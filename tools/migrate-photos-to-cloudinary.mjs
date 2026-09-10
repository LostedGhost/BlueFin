#!/usr/bin/env node
/**
 * Migration des photos de logements vers Cloudinary.
 *
 * Contexte : les fichiers ont disparu du serveur (le dossier storage/ vivait
 * dans le répertoire de l'application et a été emporté par un redéploiement).
 * Une copie plus ancienne existe en local. Ce script la téléverse sur
 * Cloudinary et produit le SQL qui rebranche la base sur ces nouvelles URL.
 *
 * AUCUNE modification du frontend ni du backend n'est nécessaire :
 * PropertyPhoto::getFullUrlAttribute() renvoie déjà une URL externe telle
 * quelle, à condition que `photo_path` soit vide. La colonne étant NOT NULL,
 * on y écrit une chaîne vide — `!empty('')` est faux, donc l'accesseur passe
 * bien à la branche `photo_url`.
 *
 * Le script n'écrit JAMAIS dans la base : il génère un fichier .sql à relire
 * puis à exécuter dans phpMyAdmin. Cela évite d'avoir à ouvrir l'accès MySQL
 * distant, et laisse une occasion de vérifier avant d'agir.
 *
 * ATTENTION — les noms de fichiers locaux ne correspondent pas à ceux
 * enregistrés en base (la copie locale est antérieure au dernier envoi de
 * photos). Le script ne peut donc pas rapprocher photo par photo : il
 * REMPLACE l'ensemble des photos d'une annonce par les fichiers trouvés dans
 * le dossier portant son identifiant. D'où la planche de contact générée :
 * vérifiez que chaque image correspond bien à l'annonce avant d'exécuter le SQL.
 *
 * Usage :
 *   node tools/migrate-photos-to-cloudinary.mjs                 # simulation
 *   node tools/migrate-photos-to-cloudinary.mjs --upload        # téléverse + génère le SQL
 *   node tools/migrate-photos-to-cloudinary.mjs --upload --limit 3
 *
 * Variables d'environnement requises pour --upload :
 *   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const SOURCE_DIR =
  process.env.PHOTOS_DIR || 'D:/SolDigit/BlueFin/Bluefin-api/public/storage/properties';
const OUT_DIR = path.resolve('tools/out');

const args = process.argv.slice(2);
const DO_UPLOAD = args.includes('--upload');
/** Génère le SQL et la planche de contact avec des URL fictives, sans rien
 *  téléverser : permet de relire exactement ce qui sera exécuté avant même
 *  d'avoir un compte Cloudinary. */
const PREVIEW = args.includes('--preview');
const LIMIT = (() => {
  const i = args.indexOf('--limit');
  return i !== -1 ? Number(args[i + 1]) : Infinity;
})();

const CLOUD = process.env.CLOUDINARY_CLOUD_NAME;
const KEY = process.env.CLOUDINARY_API_KEY;
const SECRET = process.env.CLOUDINARY_API_SECRET;

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

/** Liste les fichiers image, groupés par identifiant d'annonce (nom du dossier). */
function scan(dir) {
  if (!fs.existsSync(dir)) {
    console.error(`Dossier introuvable : ${dir}`);
    process.exit(1);
  }
  const groups = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (!/^\d+$/.test(entry.name)) {
      console.warn(`  ignoré (nom non numérique) : ${entry.name}`);
      continue;
    }
    const propertyDir = path.join(dir, entry.name);
    const files = fs
      .readdirSync(propertyDir)
      .filter((f) => IMAGE_EXT.has(path.extname(f).toLowerCase()))
      .sort()
      .map((f) => ({
        file: f,
        absolute: path.join(propertyDir, f),
        size: fs.statSync(path.join(propertyDir, f)).size,
      }));
    if (files.length) groups.push({ propertyId: Number(entry.name), files });
  }
  return groups.sort((a, b) => a.propertyId - b.propertyId);
}

/**
 * Téléverse un fichier sur Cloudinary (upload signé, sans SDK).
 * public_id déterministe + overwrite : relancer le script ne crée pas de
 * doublons, il écrase la version précédente.
 */
async function upload(absolutePath, publicId) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signed = { overwrite: 'true', public_id: publicId, timestamp: String(timestamp) };
  const toSign = Object.keys(signed)
    .sort()
    .map((k) => `${k}=${signed[k]}`)
    .join('&');
  const signature = crypto.createHash('sha1').update(toSign + SECRET).digest('hex');

  const form = new FormData();
  form.append('file', new Blob([fs.readFileSync(absolutePath)]), path.basename(absolutePath));
  form.append('api_key', KEY);
  for (const [k, v] of Object.entries(signed)) form.append(k, v);
  form.append('signature', signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, {
    method: 'POST',
    body: form,
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body?.error?.message || `HTTP ${res.status}`);
  }
  return body.secure_url;
}

const sqlStr = (v) => `'${String(v).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;

function buildSql(results) {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const backup = `property_photos_backup_${stamp}`;
  const ids = [...new Set(results.map((r) => r.propertyId))].sort((a, b) => a - b);

  const lines = [
    '-- Rebranchement des photos de logements sur Cloudinary.',
    '-- Généré par tools/migrate-photos-to-cloudinary.mjs',
    `-- ${new Date().toISOString()}`,
    '--',
    '-- À exécuter dans phpMyAdmin. Les anciennes lignes sont copiées dans une',
    `-- table de sauvegarde (${backup}) AVANT suppression : en cas de problème,`,
    '-- il suffit de réinsérer depuis cette table.',
    '--',
    `-- Annonces concernées : ${ids.join(', ')}`,
    '',
    'START TRANSACTION;',
    '',
    '-- 1. Sauvegarde des lignes qui vont être remplacées',
    `CREATE TABLE IF NOT EXISTS ${backup} LIKE property_photos;`,
    `INSERT INTO ${backup}`,
    `SELECT * FROM property_photos WHERE property_id IN (${ids.join(', ')});`,
    '',
    '-- 2. Suppression des anciennes lignes (elles pointent vers des fichiers',
    '--    qui n\'existent plus sur le serveur)',
    `DELETE FROM property_photos WHERE property_id IN (${ids.join(', ')});`,
    '',
    '-- 3. Insertion des nouvelles photos.',
    '--    photo_path reste une chaîne vide : la colonne est NOT NULL, et',
    '--    getFullUrlAttribute() ne renvoie photo_url que si photo_path est vide.',
    '--    Le WHERE EXISTS évite une erreur de clé étrangère si le dossier local',
    '--    correspond à une annonce supprimée depuis.',
    '',
  ];

  for (const r of results) {
    lines.push(
      'INSERT INTO property_photos ' +
        '(property_id, photo_path, photo_url, `order`, is_cover, is_approved, created_at, updated_at)',
      `SELECT ${r.propertyId}, '', ${sqlStr(r.url)}, ${r.order}, ${r.isCover ? 1 : 0}, 1, NOW(), NOW()`,
      `FROM DUAL WHERE EXISTS (SELECT 1 FROM properties WHERE id = ${r.propertyId});`
    );
  }

  lines.push(
    '',
    '-- 4. Relire le résultat avant de valider :',
    `--    SELECT property_id, photo_url, is_cover FROM property_photos WHERE property_id IN (${ids.join(', ')});`,
    '',
    'COMMIT;',
    '',
    '-- Pour annuler après coup :',
    `--   DELETE FROM property_photos WHERE property_id IN (${ids.join(', ')});`,
    `--   INSERT INTO property_photos SELECT * FROM ${backup};`,
    ''
  );

  return lines.join('\n');
}

function buildContactSheet(results, groups) {
  const byProperty = new Map();
  for (const r of results) {
    if (!byProperty.has(r.propertyId)) byProperty.set(r.propertyId, []);
    byProperty.get(r.propertyId).push(r);
  }

  const cards = [...byProperty.entries()]
    .map(
      ([pid, items]) => `
    <section>
      <h2>Annonce ${pid}</h2>
      <div class="row">
        ${items
          .map(
            (r) => `<figure>
              <img src="${r.url}" alt="" loading="lazy" />
              <figcaption>${r.file}${r.isCover ? ' · <b>couverture</b>' : ''}</figcaption>
            </figure>`
          )
          .join('')}
      </div>
    </section>`
    )
    .join('');

  const skipped = groups.length - byProperty.size;

  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<title>Photos à rebrancher — vérification</title>
<style>
 body{font-family:system-ui,sans-serif;margin:0;padding:32px;background:#f4f6f8;color:#0f2940}
 h1{font-size:22px;margin:0 0 6px}
 p.lede{color:#5b6673;max-width:70ch;line-height:1.6;margin:0 0 24px}
 section{background:#fff;border:1px solid #e3e8ed;border-radius:12px;padding:16px;margin-bottom:16px}
 h2{font-size:15px;margin:0 0 12px}
 .row{display:flex;flex-wrap:wrap;gap:12px}
 figure{margin:0;width:200px}
 img{width:200px;height:150px;object-fit:cover;border-radius:8px;display:block;background:#dde3e8}
 figcaption{font-size:10px;color:#7a8590;margin-top:6px;word-break:break-all}
</style></head><body>
<h1>Vérification avant exécution du SQL</h1>
<p class="lede">Les noms de fichiers locaux ne correspondent pas à ceux enregistrés en base : le rapprochement photo par photo est impossible, le script remplace donc l'ensemble des photos de chaque annonce par les fichiers du dossier portant son identifiant.
<strong>Vérifiez que chaque image correspond bien à l'annonce indiquée</strong> avant d'exécuter <code>migration.sql</code>. ${skipped > 0 ? `(${skipped} dossier(s) sans image exploitable.)` : ''}</p>
${cards}
</body></html>`;
}

async function main() {
  console.log(`Source : ${SOURCE_DIR}\n`);
  const groups = scan(SOURCE_DIR);
  const totalFiles = groups.reduce((n, g) => n + g.files.length, 0);
  const totalBytes = groups.reduce((n, g) => n + g.files.reduce((s, f) => s + f.size, 0), 0);

  console.log(`${groups.length} annonce(s), ${totalFiles} fichier(s), ${(totalBytes / 1048576).toFixed(1)} Mo`);
  for (const g of groups) {
    console.log(`  annonce ${String(g.propertyId).padEnd(4)} ${g.files.length} fichier(s)`);
  }

  if (PREVIEW) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    const fake = [];
    for (const g of groups) {
      g.files.forEach((f, i) => {
        fake.push({
          propertyId: g.propertyId,
          file: f.file,
          url: `https://res.cloudinary.com/EXEMPLE/image/upload/bluefin/properties/${g.propertyId}/${path.parse(f.file).name}`,
          order: i,
          isCover: i === 0,
        });
      });
    }
    fs.writeFileSync(path.join(OUT_DIR, 'migration.preview.sql'), buildSql(fake));
    fs.writeFileSync(path.join(OUT_DIR, 'contact-sheet.preview.html'), buildContactSheet(fake, groups));
    console.log('\nAperçu généré (URL fictives, rien téléversé) :');
    console.log(`  ${path.join(OUT_DIR, 'migration.preview.sql')}`);
    console.log(`  ${path.join(OUT_DIR, 'contact-sheet.preview.html')}  (images vides, c'est normal)`);
    return;
  }

  if (!DO_UPLOAD) {
    console.log('\nSimulation — rien n\'a été téléversé.');
    console.log('Relancez avec --preview pour relire le SQL, ou --upload pour agir.');
    return;
  }

  if (!CLOUD || !KEY || !SECRET) {
    console.error(
      '\nIl manque des identifiants Cloudinary. Définissez CLOUDINARY_CLOUD_NAME, ' +
        'CLOUDINARY_API_KEY et CLOUDINARY_API_SECRET avant de relancer.'
    );
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const manifestPath = path.join(OUT_DIR, 'manifest.json');
  const manifest = fs.existsSync(manifestPath)
    ? JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    : {};

  const results = [];
  let done = 0;
  let failed = 0;

  console.log('');
  for (const g of groups) {
    for (const [i, f] of g.files.entries()) {
      if (done >= LIMIT) break;
      const publicId = `bluefin/properties/${g.propertyId}/${path.parse(f.file).name}`;
      try {
        let url = manifest[f.absolute]?.url;
        if (url) {
          console.log(`  = deja fait  ${g.propertyId}/${f.file}`);
        } else {
          url = await upload(f.absolute, publicId);
          manifest[f.absolute] = { url, publicId, propertyId: g.propertyId };
          console.log(`  + televerse  ${g.propertyId}/${f.file}`);
        }
        results.push({ propertyId: g.propertyId, file: f.file, url, order: i, isCover: i === 0 });
        done++;
      } catch (err) {
        failed++;
        console.error(`  ! echec      ${g.propertyId}/${f.file} — ${err.message}`);
      }
    }
  }

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  if (results.length === 0) {
    console.error('\nAucun fichier téléversé : rien à générer.');
    process.exit(1);
  }

  const sqlPath = path.join(OUT_DIR, 'migration.sql');
  const sheetPath = path.join(OUT_DIR, 'contact-sheet.html');
  fs.writeFileSync(sqlPath, buildSql(results));
  fs.writeFileSync(sheetPath, buildContactSheet(results, groups));

  console.log(`\n${done} téléversée(s), ${failed} échec(s)`);
  console.log(`\nÀ faire maintenant, dans cet ordre :`);
  console.log(`  1. Ouvrir ${sheetPath}`);
  console.log(`     et vérifier que chaque image correspond bien à son annonce.`);
  console.log(`  2. Exécuter ${sqlPath} dans phpMyAdmin.`);
  console.log(`     Les anciennes lignes sont sauvegardées avant suppression.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

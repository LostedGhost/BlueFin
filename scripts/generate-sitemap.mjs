// Génère dist/sitemap.xml après le build, à partir des pages statiques connues
// et des annonces réellement actives sur l'API (pas de pages villes : voir
// audit SEO, CityPage repose sur des données de démo statiques, pas l'API réelle).
import { writeFileSync } from 'fs';
import { resolve } from 'path';

const SITE_URL = 'https://bluefin-immo.com';
const API_URL = 'https://api.bluefin-immo.com/api/v1';

const staticPaths = [
  '/',
  '/popular',
  '/hotels',
  '/experience',
  '/services',
  '/devenir-hote',
  '/a-propos',
  '/aide',
  '/blog',
  '/fonctionnement',
  '/entreprise',
  '/mentions-legales',
  '/confidentialite',
  '/cgu',
];

function urlEntry(path, priority = '0.6') {
  return `  <url>\n    <loc>${SITE_URL}${path}</loc>\n    <priority>${priority}</priority>\n  </url>`;
}

async function fetchActivePropertyIds() {
  try {
    const res = await fetch(`${API_URL}/properties?per_page=200&status=active`);
    if (!res.ok) return [];
    const json = await res.json();
    const list = json?.data?.data || json?.data || [];
    return list.map((p) => p.id).filter(Boolean);
  } catch (error) {
    console.warn('⚠️  Impossible de récupérer les annonces pour le sitemap (API indisponible pendant le build) :', error.message);
    return [];
  }
}

async function main() {
  const propertyIds = await fetchActivePropertyIds();

  const entries = [
    ...staticPaths.map((p) => urlEntry(p, p === '/' ? '1.0' : '0.6')),
    ...propertyIds.map((id) => urlEntry(`/annonce/${id}`, '0.8')),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;

  const outPath = resolve(process.cwd(), 'dist', 'sitemap.xml');
  writeFileSync(outPath, xml, 'utf-8');
  console.log(`✅ sitemap.xml généré avec ${staticPaths.length} pages statiques + ${propertyIds.length} annonces`);
}

main();

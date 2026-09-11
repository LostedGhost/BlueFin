-- ============================================================================
-- Bluefin-Immo — remplacement des textes provisoires visibles du public
-- 2026-09-11
--
-- 1. Expérience « Tour des Arts » (id 2) : la description et les deux étapes
--    contenaient un message technique de développeur (« Le problème est
--    maintenant clair : votre backend Laravel ne reçoit pas les champs… »).
-- 2. Services « Communication » (id 2) et « Maintenance » (id 1) : texte de
--    remplissage (lorem ipsum / « Action immédiate » répété).
--
-- Textes rédigés à partir des seules informations connues (lieu, prix,
-- durée, nombre de places). À faire valider par les prestataires.
--
-- À importer dans phpMyAdmin sur la base de production (onglet « Importer »,
-- jeu de caractères utf-8). Tout se fait dans une transaction, et les textes
-- d'origine sont d'abord copiés dans des tables de sauvegarde.
-- ============================================================================

START TRANSACTION;

-- Sauvegardes (retour arrière : voir tout en bas)
CREATE TABLE IF NOT EXISTS experiences_textes_backup_20260911 AS
  SELECT id, description, steps FROM experiences WHERE id = 2;
CREATE TABLE IF NOT EXISTS services_textes_backup_20260911 AS
  SELECT id, description FROM services WHERE id IN (1, 2);

-- 1. Expérience « Tour des Arts » — Ouidah
UPDATE experiences
SET description = 'Ouidah, ville d’histoire et de mémoire, est aussi l’un des foyers artistiques du Bénin. Le Tour des Arts vous fait découvrir cette création vivante : des œuvres, des lieux d’exposition et des savoir-faire nourris par l’histoire de la ville. Une visite guidée pour regarder autrement l’art béninois, d’hier et d’aujourd’hui, et repartir avec des clés pour le comprendre.',
    steps = JSON_SET(steps,
      '$[0].description', 'Accueil du groupe et présentation du parcours : l’histoire de Ouidah et la place qu’y tiennent les arts.',
      '$[1].description', 'Découverte des œuvres et des lieux d’exposition, avec les explications du guide sur les artistes, leurs techniques et leurs symboles.')
WHERE id = 2;

-- 2. Service « Communication » — 2 heures
UPDATE services
SET description = 'Un accompagnement pour mieux faire connaître votre activité d’hébergement ou de tourisme : clarifier votre message, soigner vos annonces et vos réseaux sociaux, et repartir avec un plan d’actions concret adapté à votre clientèle. Séance de 2 heures avec un professionnel de la communication.'
WHERE id = 2;

-- 3. Service « Maintenance » — 1 heure
UPDATE services
SET description = 'Diagnostic et petites réparations courantes dans votre logement, pour le remettre en état rapidement — par exemple entre deux séjours. Intervention d’une heure par un professionnel.'
WHERE id = 1;

COMMIT;

-- Vérification :
-- SELECT id, LEFT(description, 80) FROM experiences WHERE id = 2;
-- SELECT id, LEFT(description, 80) FROM services WHERE id IN (1, 2);
--
-- Retour arrière si besoin :
-- UPDATE experiences e JOIN experiences_textes_backup_20260911 b ON b.id = e.id
--   SET e.description = b.description, e.steps = b.steps;
-- UPDATE services s JOIN services_textes_backup_20260911 b ON b.id = s.id
--   SET s.description = b.description;

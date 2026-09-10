/**
 * Contenu éditorial des bandeaux de ville de la page d'accueil.
 *
 * ⚠️ Ces textes sont un BROUILLON à valider par Bluefin. Ils décrivent des
 * lieux réels, mais le ton et les affirmations engagent la marque — ils
 * doivent être relus avant mise en ligne.
 *
 * Les chiffres affichés dans le bandeau (nombre de logements, prix médian) ne
 * sont volontairement PAS ici : ils sont calculés à partir des annonces
 * réellement chargées, pour ne jamais afficher une donnée périmée ou inventée.
 * Seule `saison` est éditoriale.
 */
export interface CityEditorial {
  /** Sur-titre court, au-dessus du nom de la ville */
  kicker: string;
  /** Une phrase, pas deux. Ce qu'on retient du lieu. */
  hook: string;
  /** Période conseillée — connaissance éditoriale, pas une donnée calculée */
  saison?: string;
}

/** Clé = nom de ville normalisé (minuscules, sans accents) */
export const CITY_EDITORIAL: Record<string, CityEditorial> = {
  cotonou: {
    kicker: 'Capitale économique',
    hook: 'Le marché Dantokpa, les zémidjans, la lagune au réveil.',
    saison: 'Nov–Mar',
  },
  ouidah: {
    kicker: 'À 42 km de Cotonou',
    hook: 'La route des pythons, la plage à cinq minutes, le silence en prime.',
    saison: 'Nov–Mar',
  },
  porto_novo: {
    kicker: 'Capitale historique',
    hook: 'Les façades afro-brésiliennes, le musée Honmé, la lagune tout autour.',
    saison: 'Nov–Mar',
  },
  parakou: {
    kicker: 'Porte du Nord',
    hook: "Les marchés d'artisans, les nuits fraîches, le départ vers la Pendjari.",
    saison: 'Nov–Fév',
  },
  abomey: {
    kicker: 'Ancien royaume du Danxomè',
    hook: "Les palais royaux classés, les tentures d'appliqué, la mémoire vive.",
    saison: 'Nov–Mar',
  },
  natitingou: {
    kicker: "Massif de l'Atacora",
    hook: 'Les Tata Somba, les cascades de Kota, les collines à perte de vue.',
    saison: 'Nov–Fév',
  },
  grand_popo: {
    kicker: 'Littoral ouest',
    hook: "Vingt kilomètres de sable, l'embouchure du Mono, presque personne.",
    saison: 'Nov–Mar',
  },
};

/**
 * Normalise un nom de ville en clé : minuscules, sans accents, espaces -> _
 * `\p{Diacritic}` évite d'écrire une plage de caractères combinants en dur
 * dans le source (invisibles dans un éditeur, et facilement corrompus par
 * les outils qui ne sont pas en UTF-8).
 */
export function cityKey(city: string): string {
  return city
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/[\s'-]+/g, '_');
}

export function getCityEditorial(city: string): CityEditorial | undefined {
  return CITY_EDITORIAL[cityKey(city)];
}

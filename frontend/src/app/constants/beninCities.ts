/**
 * Centres approximatifs des principales villes du Bénin (précision de
 * l'ordre du kilomètre) : servent à regrouper sur la carte les annonces qui
 * n'ont pas encore de position exacte, et à centrer le sélecteur de position
 * quand un hôte publie une annonce.
 */
import { cityKey } from './cityEditorial';

export type LatLng = [number, number];

export const BENIN_CENTER: LatLng = [9.3, 2.3];

const CITY_COORDS: Record<string, LatLng> = {
  cotonou: [6.3703, 2.3912],
  abomey_calavi: [6.4485, 2.3557],
  porto_novo: [6.4969, 2.6289],
  ouidah: [6.3631, 2.0851],
  grand_popo: [6.2833, 1.8333],
  lokossa: [6.6389, 1.7167],
  allada: [6.665, 2.151],
  abomey: [7.1829, 1.9912],
  bohicon: [7.1782, 2.0667],
  dassa_zoume: [7.75, 2.1833],
  savalou: [7.9281, 1.9756],
  parakou: [9.3372, 2.6303],
  djougou: [9.7085, 1.666],
  natitingou: [10.3042, 1.3796],
  nikki: [9.94, 3.21],
  kandi: [11.1342, 2.9386],
  malanville: [11.8619, 3.3862],
};

/** Nom affiché pour chaque ville (la saisie libre varie : « ouidah », « OUIDAH »…). */
const CITY_LABELS: Record<string, string> = {
  cotonou: 'Cotonou', abomey_calavi: 'Abomey-Calavi', porto_novo: 'Porto-Novo', ouidah: 'Ouidah',
  grand_popo: 'Grand-Popo', lokossa: 'Lokossa', allada: 'Allada', abomey: 'Abomey', bohicon: 'Bohicon',
  dassa_zoume: 'Dassa-Zoumè', savalou: 'Savalou', parakou: 'Parakou', djougou: 'Djougou',
  natitingou: 'Natitingou', nikki: 'Nikki', kandi: 'Kandi', malanville: 'Malanville',
};

/**
 * Arrondissements saisis à la place de la ville : Akpakpa est à Cotonou
 * (y compris la coquille « Apkapka » présente dans les données).
 */
const ALIASES: Record<string, string> = { akpakpa: 'cotonou', apkapka: 'cotonou', calavi: 'abomey_calavi' };

const canonical = (city: string) => { const k = cityKey(city); return ALIASES[k] ?? k; };

/** Coordonnées d'une ville saisie librement, ou null si elle est inconnue. */
export function cityCoordinates(city?: string | null): LatLng | null {
  if (!city) return null;
  return CITY_COORDS[canonical(city)] ?? null;
}

/** Nom propre de la ville (ex. « apkapka » → « Cotonou »), ou la saisie telle quelle. */
export function cityLabel(city: string): string {
  return CITY_LABELS[canonical(city)] ?? city.trim();
}

/** Villes proposées dans les champs « Ville » (saisie libre toujours possible). */
export const BENIN_CITY_NAMES: string[] = Object.values(CITY_LABELS);

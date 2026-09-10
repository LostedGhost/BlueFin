import { ImageIcon } from 'lucide-react';

/**
 * Remplace l'image d'une annonce quand elle est absente ou illisible.
 *
 * Remplace l'ancien carré turquoise « BI » (ui-avatars) : sur une grille de
 * cartes sans photo, cet aplat de couleur de marque saturait tout l'écran et
 * faisait « placeholder cassé ». Ces tons neutres et désaturés se lisent comme
 * un choix de mise en page, pas comme une erreur.
 *
 * La teinte est tirée de l'identifiant de l'annonce : stable d'un rendu à
 * l'autre (pas de scintillement), mais variée d'une carte à l'autre.
 */
const TONES = [
  '#b9a48c', // taupe chaud
  '#8d9aa6', // bleu poussiéreux
  '#a89a86', // sable
  '#7f8f92', // ardoise sauge
  '#9fb3b8', // bleu-gris pâle
  '#a9b8a8', // sauge
];

function toneFor(seed: string | number): string {
  const s = String(seed);
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  }
  return TONES[hash % TONES.length];
}

export function PhotoPlaceholder({
  seed,
  className = '',
  label,
}: {
  /** Identifiant de l'annonce — détermine la teinte */
  seed: string | number;
  className?: string;
  /** Texte discret optionnel (ex. « Photo à venir ») */
  label?: string;
}) {
  return (
    <div
      className={`w-full h-full flex items-center justify-center ${className}`}
      style={{ backgroundColor: toneFor(seed) }}
      role="img"
      aria-label={label || 'Photo indisponible'}
    >
      {label ? (
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/75">
          {label}
        </span>
      ) : (
        <ImageIcon className="w-7 h-7 text-white/40" strokeWidth={1.5} />
      )}
    </div>
  );
}

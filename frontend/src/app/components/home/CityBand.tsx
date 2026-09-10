import { useState } from 'react';
import { getCityEditorial } from '../../constants/cityEditorial';

export interface CityBandStats {
  /** Nombre d'annonces réellement chargées pour cette ville */
  count: number;
  /** Prix médian formaté (ex. « 38 000 »), calculé sur ces annonces */
  medianPrice?: string;
}

/**
 * Bandeau éditorial d'une ville : le geste central de la direction A.
 *
 * Il est conçu pour tenir SANS photo — aujourd'hui les visuels de ville
 * n'existent pas, et un bandeau vide serait pire que pas de bandeau du tout.
 * Sans image, il se rabat sur un aplat profond qui reste une composition
 * volontaire, et il s'enrichit tout seul le jour où une photo est fournie.
 */
export function CityBand({
  city,
  stats,
  photo,
  onNavigate,
  seeAllRoute,
}: {
  city: string;
  stats: CityBandStats;
  photo?: string;
  onNavigate?: (route: any) => void;
  seeAllRoute?: any;
}) {
  const editorial = getCityEditorial(city);
  const [imgError, setImgError] = useState(false);
  const showPhoto = Boolean(photo) && !imgError;

  // Sans texte éditorial pour cette ville, on n'invente rien : on n'affiche
  // pas de bandeau, la section garde son titre simple.
  if (!editorial) return null;

  return (
    <button
      onClick={() => seeAllRoute && onNavigate?.(seeAllRoute)}
      className="relative block w-full h-[228px] overflow-hidden text-left"
    >
      {showPhoto ? (
        <img
          src={photo}
          alt={`${city}, Bénin`}
          loading="lazy"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-[#0c3f53]" />
      )}

      {/* Voile de lisibilité — nécessaire même sans photo pour garder une
          densité constante entre les deux états. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, rgba(4,36,44,.92) 0%, rgba(4,36,44,.32) 48%, rgba(4,36,44,0) 78%)',
        }}
      />

      <div className="absolute left-4 right-4 bottom-3.5 text-white">
        <p className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-[#ffc93c]">
          {editorial.kicker}
        </p>
        <h3 className="font-display text-[40px] leading-none mt-1.5 mb-1.5">{city}</h3>
        <p className="text-[12.5px] leading-relaxed opacity-95 max-w-[31ch] mb-2.5">
          {editorial.hook}
        </p>

        <div className="flex gap-2">
          <span className="px-2.5 py-1.5 rounded-lg bg-white/[0.16] backdrop-blur-sm text-[10px] leading-tight">
            <b className="block text-[13px] font-extrabold tabular-nums">{stats.count}</b>
            {stats.count > 1 ? 'logements' : 'logement'}
          </span>
          {stats.medianPrice && (
            <span className="px-2.5 py-1.5 rounded-lg bg-white/[0.16] backdrop-blur-sm text-[10px] leading-tight">
              <b className="block text-[13px] font-extrabold tabular-nums">{stats.medianPrice}</b>
              FCFA médian
            </span>
          )}
          {editorial.saison && (
            <span className="px-2.5 py-1.5 rounded-lg bg-white/[0.16] backdrop-blur-sm text-[10px] leading-tight">
              <b className="block text-[13px] font-extrabold">{editorial.saison}</b>
              meilleure saison
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

import { useRef, useState } from 'react';
import { CityBand, type CityBandStats } from './CityBand';
import { getCityEditorial } from '../../constants/cityEditorial';

export interface CityCarouselItem {
  city: string;
  stats: CityBandStats;
  seeAllRoute?: any;
}

/**
 * Carrousel éditorial des villes, en tête de page.
 *
 * Défilement manuel (scroll-snap) et non rotation automatique : le bandeau
 * promo juste au-dessus tourne déjà tout seul. Deux animations concurrentes
 * dans le premier écran se disputeraient l'attention, et une lecture
 * interrompue à mi-phrase est plus agaçante qu'utile.
 */
export function CityCarousel({
  items,
  onNavigate,
}: {
  items: CityCarouselItem[];
  onNavigate?: (route: any) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  // On n'affiche que les villes disposant d'un texte éditorial : sans lui, le
  // bandeau n'aurait rien à raconter et on n'invente pas de contenu.
  const slides = items.filter((item) => getCityEditorial(item.city));
  if (slides.length === 0) return null;

  const handleScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    if (index !== active) setActive(index);
  };

  return (
    <section className="relative">
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {slides.map((item) => (
          <div key={item.city} className="w-full flex-shrink-0 snap-start">
            <CityBand
              city={item.city}
              stats={item.stats}
              onNavigate={onNavigate}
              seeAllRoute={item.seeAllRoute}
            />
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-3 right-4 flex gap-1.5">
          {slides.map((item, i) => (
            <span
              key={item.city}
              className={`h-1.5 rounded-full transition-all ${
                i === active ? 'w-5 bg-[#ffc93c]' : 'w-1.5 bg-white/45'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

import { ArrowRight } from 'lucide-react';
import { ListingCard, type HomeListing } from './ListingCard';

export function CitySection({
  title,
  listings,
  routeFor,
  seeAllRoute,
  onNavigate,
  /** Fond légèrement teinté, en alternance avec le blanc */
  tinted = false,
}: {
  title: string;
  listings: HomeListing[];
  routeFor: (listing: HomeListing) => any;
  seeAllRoute?: any;
  onNavigate?: (route: any) => void;
  tinted?: boolean;
}) {
  if (listings.length === 0) return null;

  return (
    <section className={tinted ? 'bg-[#f6fdfe] py-1' : 'py-1'}>
      <div className="flex items-baseline justify-between px-4 pt-6 pb-3">
        <h3 className="font-display text-[26px] text-[#0f2940] leading-none">{title}</h3>
        {seeAllRoute && (
          <button
            onClick={() => onNavigate?.(seeAllRoute)}
            aria-label={`Tout voir — ${title}`}
            className="inline-flex items-center gap-1 text-[12px] font-bold text-[#12b8c9] hover:text-[#0fa0b0] transition-colors"
          >
            Tout voir
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* scroll-pl-4 est indispensable : sans lui, `snap-mandatory` force le
          défilement à aligner le bord de la première carte sur le bord du
          conteneur, ce qui annule visuellement l'inset de gauche (padding ou
          élément espaceur — les deux sont avalés de la même façon). Le
          scroll-padding décale le point d'ancrage de 16px et préserve l'espace.
          À droite, un vrai élément espaceur reste plus fiable qu'un pr-4, que
          certains navigateurs mobiles ignorent en fin de défilement. */}
      <div className="flex gap-4 overflow-x-auto pl-4 scroll-pl-4 pb-5 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} route={routeFor(listing)} onNavigate={onNavigate} />
        ))}
        <div className="w-4 flex-shrink-0" aria-hidden="true" />
      </div>
    </section>
  );
}

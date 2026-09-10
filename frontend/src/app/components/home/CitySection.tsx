import { ArrowRight } from 'lucide-react';
import { ListingCard, type HomeListing } from './ListingCard';

export function CitySection({
  title,
  listings,
  routeFor,
  seeAllRoute,
  onNavigate,
}: {
  title: string;
  listings: HomeListing[];
  routeFor: (listing: HomeListing) => any;
  seeAllRoute?: any;
  onNavigate?: (route: any) => void;
}) {
  if (listings.length === 0) return null;

  return (
    <section className="py-4">
      <div className="flex items-center justify-between px-4 mb-3">
        <h3 className="text-[19px] font-bold text-[#0f2940] tracking-tight">{title}</h3>
        {seeAllRoute && (
          <button
            onClick={() => onNavigate?.(seeAllRoute)}
            aria-label="Tout voir"
            className="w-9 h-9 flex items-center justify-center rounded-full text-[#0f2940] hover:bg-[#f4fffe] transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>
      <div className="flex gap-4 overflow-x-auto pb-1 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* Espaceurs explicites en début ET fin plutôt que pl-4/pr-4 sur le
            conteneur : le padding d'un conteneur flex en overflow-x n'est pas
            toujours respecté par certains navigateurs mobiles (Safari iOS
            notamment) — un vrai élément flex garantit l'espace de façon fiable,
            aux deux extrémités du défilement. */}
        <div className="w-4 flex-shrink-0" aria-hidden="true" />
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} route={routeFor(listing)} onNavigate={onNavigate} />
        ))}
        <div className="w-4 flex-shrink-0" aria-hidden="true" />
      </div>
    </section>
  );
}

import { ChevronRight } from 'lucide-react';
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
        <h3 className="text-lg font-semibold text-[#0f2940]">{title}</h3>
        {seeAllRoute && (
          <button
            onClick={() => onNavigate?.(seeAllRoute)}
            className="flex items-center gap-0.5 text-sm text-[#00c9a7] font-medium hover:text-[#0f2940] transition-colors"
          >
            Tout voir
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto px-4 pb-1 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} route={routeFor(listing)} onNavigate={onNavigate} />
        ))}
      </div>
    </section>
  );
}

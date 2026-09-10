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
      <div className="flex gap-3 overflow-x-auto px-4 pb-1 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} route={routeFor(listing)} onNavigate={onNavigate} />
        ))}
      </div>
    </section>
  );
}

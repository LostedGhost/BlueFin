import { useState } from 'react';
import { Heart, BadgeCheck } from 'lucide-react';
import { useFavorites } from '../../hooks/useFavorites';

export interface HomeListing {
  id: number | string;
  title: string;
  location: string;
  image: string;
  priceDisplay: string;
  priceUnit: '/nuit' | '/séance' | '/prestation';
  bluefinCertified?: boolean;
}

export function ListingCard({
  listing,
  onNavigate,
  route,
}: {
  listing: HomeListing;
  onNavigate?: (route: any) => void;
  route: any;
}) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [imgError, setImgError] = useState(false);

  return (
    <button
      onClick={() => onNavigate?.(route)}
      className="w-[168px] sm:w-[200px] flex-shrink-0 snap-start text-left group"
    >
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100">
        <img
          src={imgError ? 'https://ui-avatars.com/api/?background=00c9a7&color=fff&size=128&name=Bluefin' : listing.image}
          alt={listing.title}
          loading="lazy"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {listing.bluefinCertified && (
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 bg-[#0f2940]/90 text-white text-[10px] font-medium px-2 py-1 rounded-full backdrop-blur-sm">
            <BadgeCheck className="w-3 h-3 text-[#00c9a7]" />
            Certifié
          </span>
        )}
        <span
          role="button"
          aria-label="Ajouter aux favoris"
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite({ id: listing.id, title: listing.title } as any);
          }}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 backdrop-blur-sm shadow-sm"
        >
          <Heart
            className={`w-3.5 h-3.5 ${isFavorite(Number(listing.id)) ? 'fill-red-500 text-red-500' : 'text-[#0f2940]'}`}
          />
        </span>
      </div>
      <h4 className="mt-2 text-sm font-semibold text-[#0f2940] line-clamp-1">{listing.title}</h4>
      <p className="text-xs text-[#6b7280] line-clamp-1">{listing.location}</p>
      <p className="mt-0.5 text-sm">
        <span className="font-bold text-[#0f2940]">{listing.priceDisplay}</span>
        <span className="text-xs text-[#6b7280]"> {listing.priceUnit}</span>
      </p>
    </button>
  );
}

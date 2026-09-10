import { useState } from 'react';
import { BadgeCheck } from 'lucide-react';

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
  const [imgError, setImgError] = useState(false);

  return (
    <button
      onClick={() => onNavigate?.(route)}
      className="w-[calc(100%-72px)] max-w-[300px] sm:w-[280px] sm:max-w-none flex-shrink-0 snap-start text-left group"
    >
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 shadow-[0_4px_14px_rgba(15,41,64,0.10)]">
        <img
          src={imgError ? 'https://ui-avatars.com/api/?background=00c9a7&color=fff&size=128&name=Bluefin+Immo' : listing.image}
          alt={listing.title}
          loading="lazy"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex items-center gap-1 mt-2.5">
        <h4 className="text-[15px] font-semibold text-[#0f2940] leading-snug line-clamp-1">{listing.title}</h4>
        {listing.bluefinCertified && <BadgeCheck className="w-3.5 h-3.5 text-[#00c9a7] flex-shrink-0" />}
      </div>
      <p className="text-[13px] text-[#6b7280] truncate mt-0.5">{listing.location}</p>
      <p className="mt-1">
        <span className="text-base font-bold text-[#0f2940]">{listing.priceDisplay}</span>
        <span className="text-[13px] text-[#6b7280]"> {listing.priceUnit}</span>
      </p>
    </button>
  );
}

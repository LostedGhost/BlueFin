import { BadgeCheck, Heart } from 'lucide-react';
import { useFavorites } from '../../hooks/useFavorites';
import { ListingCardGallery } from './ListingCardGallery';

export interface HomeListing {
  id: number | string;
  title: string;
  location: string;
  /** Image de couverture — conservée pour compatibilité */
  image?: string;
  /** Toutes les photos de l'annonce, pour la galerie défilante */
  images?: string[];
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

  // `images` d'abord, `image` en repli pour les sources qui n'exposent qu'une
  // couverture (expériences, services).
  const gallery = listing.images?.length ? listing.images : listing.image ? [listing.image] : [];

  return (
    <button
      onClick={() => onNavigate?.(route)}
      className="w-[calc(100%-72px)] max-w-[300px] sm:w-[280px] sm:max-w-none flex-shrink-0 snap-start text-left group"
    >
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 shadow-[0_4px_14px_rgba(15,41,64,0.10)]">
        <ListingCardGallery images={gallery} alt={listing.title} seed={listing.id} />

        {/* Citron réservé à ce signal : c'est le seul endroit de la carte où
            une couleur d'éclat se justifie. */}
        {listing.bluefinCertified && (
          <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 bg-[#ffc93c] text-[#4a3400] text-[10px] font-extrabold px-2.5 py-1 rounded-full">
            <BadgeCheck className="w-3 h-3" />
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
          className="absolute top-2.5 right-2.5 w-8 h-8 flex items-center justify-center rounded-full bg-white/95 backdrop-blur-sm shadow-sm active:scale-90 transition-transform"
        >
          <Heart
            className={`w-4 h-4 ${isFavorite(Number(listing.id)) ? 'fill-red-500 text-red-500' : 'text-[#0f2940]'}`}
          />
        </span>
      </div>

      <h4 className="font-body mt-2.5 text-[15.5px] font-bold text-[#0f2940] leading-snug tracking-[-0.015em] line-clamp-1">
        {listing.title}
      </h4>
      <p className="text-[12.5px] text-[#6b7280] truncate mt-0.5">{listing.location}</p>
      <p className="mt-2 inline-flex items-baseline gap-1 px-2.5 py-1 rounded-full bg-[#eefbfd] text-[#075f69]">
        <span className="text-[14px] font-extrabold tabular-nums">{listing.priceDisplay}</span>
        <span className="text-[11px] font-semibold opacity-75">{listing.priceUnit}</span>
      </p>
    </button>
  );
}

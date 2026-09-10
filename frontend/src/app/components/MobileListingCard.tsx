// components/MobileListingCard.tsx
import { Heart, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useFavorites } from '../hooks/useFavorites';
import { useAuth } from '../hooks/useAuth';

interface MobileListingCardProps {
  property: {
    id: number;
    title: string;
    district: string;
    city: string;
    price_per_night: number;
    average_rating: number;
    reviews_count: number;
    cover_photo?: { photo_url: string };
    bluefin_certified?: boolean;
    superhost?: boolean;
  };
}

export function MobileListingCard({ property }: MobileListingCardProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  
  const isFav = isFavorite(property.id);
  const imageUrl = property.cover_photo?.photo_url || '/placeholder.jpg';
  const location = `${property.district}, ${property.city}`;
  const rating = property.average_rating || 0;
  const badge = property.bluefin_certified ? 'Certifié' : property.superhost ? 'Superhost' : undefined;

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/listing/${property.id}` } });
      return;
    }
    try {
      await toggleFavorite(property.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCardClick = () => {
    navigate(`/listing/${property.id}`);
  };

  return (
    <div 
      onClick={handleCardClick}
      className="flex-shrink-0 w-[280px] bg-white rounded-2xl overflow-hidden shadow-md cursor-pointer hover:shadow-lg transition-shadow"
    >
      <div className="relative aspect-[16/10]">
        <ImageWithFallback
          src={imageUrl}
          alt={property.title}
          className="w-full h-full object-cover"
        />
        <button 
          onClick={handleFavoriteClick}
          className="absolute top-2 right-2 p-2 rounded-full bg-white/90 hover:bg-white transition-colors z-10"
        >
          <Heart className={`w-4 h-4 ${isFav ? 'fill-red-500 text-red-500' : 'text-[#0f2940]'}`} />
        </button>
        {badge && (
          <div className="absolute top-2 left-2 bg-[#00c9a7] text-white px-2 py-1 rounded-full text-xs font-medium">
            {badge}
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="text-xs text-[#6b7280] mb-1">{location}</div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] font-bold text-[#0f2940] line-clamp-1">{property.title}</span>
          {rating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-[#00c9a7] text-[#00c9a7]" />
              <span className="text-xs font-medium text-[#0f2940]">{rating.toFixed(1)}</span>
            </div>
          )}
        </div>
        <div className="text-sm font-bold text-[#00c9a7]">
          {property.price_per_night.toLocaleString()} XOF <span className="text-xs font-normal text-[#6b7280]">/nuit</span>
        </div>
      </div>
    </div>
  );
}
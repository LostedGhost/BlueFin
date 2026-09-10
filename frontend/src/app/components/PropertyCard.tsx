// components/PropertyCard.tsx - Version finale
import { Heart, Star, Bed, Bath, Wifi, Wind, Zap, MapPin, Users } from 'lucide-react';
import { useFavorites } from '../hooks/useFavorites';
import { useState } from 'react';

interface PropertyCardProps {
  property: any;
  showDescription?: boolean;
  compact?: boolean;
  onNavigate?: (route: any) => void;
  isFavorite?: (id: number) => boolean;
  toggleFavorite?: (property: any) => void;
}

export function PropertyCard({ 
  property, 
  showDescription = false, 
  compact = false,
  onNavigate,
  isFavorite: propIsFavorite,
  toggleFavorite: propToggleFavorite
}: PropertyCardProps) {
  const favoritesHook = useFavorites();
  const isFavoriteFn = propIsFavorite || favoritesHook.isFavorite;
  const toggleFavoriteFn = propToggleFavorite || favoritesHook.toggleFavorite;
  const [imgError, setImgError] = useState(false);

  if (!property) return null;

  // ✅ Récupération de l'image - utilise les données qui fonctionnent
  const imageUrl = !imgError && property.images?.[0] 
    ? property.images[0] 
    : property.image || `https://picsum.photos/seed/${property.id}/400/300`;

  const handleCardClick = () => {
    if (onNavigate && property.id) {
      onNavigate({ name: 'listing', id: property.id.toString() });
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavoriteFn(property);
  };

  const priceDisplay = property.priceDisplay || `${(property.price_per_night || property.price || 0).toLocaleString()} FCFA`;
  const location = property.location || (property.district && property.city ? `${property.district}, ${property.city}` : (property.city || property.district || 'Bénin'));
  const rating = property.rating || property.average_rating || 0;
  const reviewCount = property.reviews || property.reviews_count || 0;
  const bedCount = property.beds || property.bedrooms || 1;

  return (
    <div 
      className="group cursor-pointer bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
      onClick={handleCardClick}
    >
      {/* Image container */}
      <div className="relative overflow-hidden bg-gray-100 aspect-[4/3]">
        <img
          src={imageUrl}
          alt={property.title || 'Logement'}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={() => setImgError(true)}
        />
        
        {/* Badge Bluefin Certifié */}
        {property.bluefin_certified && (
          <div className="absolute top-3 left-3 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium z-10">
            ✓ Bluefin Certifié
          </div>
        )}
        
        {/* Bouton favori */}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white transition-all duration-200 z-10 backdrop-blur-sm shadow-md hover:scale-110"
          aria-label="Ajouter aux favoris"
        >
          <Heart 
            className={`w-5 h-5 transition-all duration-200 ${
              isFavoriteFn(property.id) 
                ? 'fill-red-500 text-red-500' 
                : 'text-gray-600 hover:text-red-500'
            }`} 
          />
        </button>
      </div>

      {/* Contenu */}
      <div className="p-4">
        {/* Titre et localisation */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[#0F2940] text-base line-clamp-1 hover:text-blue-600 transition-colors">
              {property.title || 'Logement sans titre'}
            </h3>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{location}</span>
            </p>
          </div>
          
          {/* Note */}
          {rating > 0 && (
            <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg flex-shrink-0">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="font-semibold text-sm">{rating.toFixed(1)}</span>
              {reviewCount > 0 && (
                <span className="text-xs text-gray-400">({reviewCount})</span>
              )}
            </div>
          )}
        </div>

        {/* Description (optionnel) */}
        {showDescription && property.description && (
          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
            {property.description}
          </p>
        )}

        {/* Équipements clés */}
        <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-gray-500">
          {bedCount > 0 && (
            <div className="flex items-center gap-1">
              <Bed className="w-4 h-4" />
              <span>{bedCount} lit{bedCount > 1 ? 's' : ''}</span>
            </div>
          )}
          {property.bathrooms > 0 && (
            <div className="flex items-center gap-1">
              <Bath className="w-4 h-4" />
              <span>{property.bathrooms} sdb</span>
            </div>
          )}
          {property.max_guests > 0 && (
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{property.max_guests} pers.</span>
            </div>
          )}
        </div>

        {/* Équipements spécifiques */}
        <div className="flex flex-wrap gap-2 mt-2">
          {property.has_wifi && (
            <span className="inline-flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded-full">
              <Wifi className="w-3 h-3" /> Wi-Fi
            </span>
          )}
          {property.has_air_conditioning && (
            <span className="inline-flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded-full">
              <Wind className="w-3 h-3" /> Clim
            </span>
          )}
          {property.has_generator && (
            <span className="inline-flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded-full">
              <Zap className="w-3 h-3" /> Groupe
            </span>
          )}
        </div>

        {/* Prix */}
        <div className="mt-3 pt-2 border-t border-gray-100">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-xl font-bold text-blue-600">{priceDisplay}</span>
              <span className="text-sm text-gray-500"> / nuit</span>
            </div>
            <button 
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick();
              }}
            >
              Voir détails →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PropertyCard;
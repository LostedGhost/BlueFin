// components/ListingDetail.tsx
import { useState } from 'react';
import { Star, Users, Bed, Home, Bath, Wifi, Wind, Zap, Droplet, Lock, MapPin, ChevronLeft, Share, Heart, Check } from 'lucide-react';
import { BookingWidget } from './BookingWidget';
import { useFavorites } from '../hooks/useFavorites';

interface ListingDetailProps {
  property: any; // Le property formaté
  onBack?: () => void;
  onOpenBooking?: () => void;
  isAuthenticated?: boolean;
}

export function ListingDetail({ property, onBack, onOpenBooking, isAuthenticated }: ListingDetailProps) {
  const [liked, setLiked] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);
  const { toggleFavorite, isFavorite } = useFavorites();

  // Vérifier si la propriété est en favori
  const isFav = isFavorite(property.id);
  
  const handleLike = async () => {
    if (!isAuthenticated) {
      // Rediriger vers login
      window.location.href = '/login';
      return;
    }
    const result = await toggleFavorite(property.id);
    setLiked(result.action === 'added');
  };

  // Utiliser les photos réelles
  const photos = property.images?.length ? property.images : [property.image];
  const hostInitial = property.host ? property.host.charAt(0).toUpperCase() : 'H';
  const totalGuests = property.max_guests || 4;
  
  // Équipements spécifiques Bénin
  const amenitiesList = property.amenities || [];
  const hasGenerator = property.has_generator;
  const hasWaterTank = property.has_water_tank;
  const hasWifi = property.has_wifi;
  const hasAC = property.has_air_conditioning;

  const getAmenityIcon = (amenity: string) => {
    const lower = amenity.toLowerCase();
    if (lower.includes('wifi')) return Wifi;
    if (lower.includes('climat') || lower.includes('ac')) return Wind;
    if (lower.includes('électricité') || lower.includes('groupe')) return Zap;
    if (lower.includes('eau')) return Droplet;
    if (lower.includes('parking')) return Lock;
    return Check;
  };

  return (
    <div className="bg-white pb-24 lg:pb-0">
      {/* Mobile top bar */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-[#e2f5f2]">
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full border border-[#e2f5f2]">
          <ChevronLeft className="w-4 h-4 text-[#0f2940]" />
        </button>
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 flex items-center justify-center rounded-full border border-[#e2f5f2]">
            <Share className="w-4 h-4 text-[#0f2940]" />
          </button>
          <button onClick={handleLike} className="w-9 h-9 flex items-center justify-center rounded-full border border-[#e2f5f2]">
            <Heart className={`w-4 h-4 transition-colors ${(liked || isFav) ? 'fill-red-500 text-red-500' : 'text-[#0f2940]'}`} />
          </button>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        {/* Desktop back + title */}
        <div className="hidden lg:block mb-6">
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-[#6b7280] hover:text-[#0f2940] transition-colors mb-4">
            <ChevronLeft className="w-4 h-4" /> Retour aux résultats
          </button>
          <h1 className="text-3xl font-bold text-[#0f2940] mb-2">{property.title}</h1>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-[#00c9a7] text-[#00c9a7]" />
              <span className="font-medium">{property.rating}</span>
              <span className="text-[#6b7280]">({property.reviews} avis)</span>
            </div>
            <span className="text-[#6b7280]">·</span>
            <span className="text-[#6b7280]">{property.location}, Bénin</span>
          </div>
        </div>

        {/* Mobile title */}
        <div className="lg:hidden mb-4">
          <h1 className="text-xl font-bold text-[#0f2940] mb-1">{property.title}</h1>
          <div className="flex items-center gap-3 text-sm flex-wrap">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-[#00c9a7] text-[#00c9a7]" />
              <span className="font-medium">{property.rating}</span>
              <span className="text-[#6b7280]">({property.reviews} avis)</span>
            </div>
            <span className="text-[#6b7280]">·</span>
            <span className="text-[#6b7280] text-xs">{property.location}</span>
          </div>
        </div>

        {/* Galerie photos (similaire à l'original mais avec photos dynamiques) */}
        <div className="hidden lg:grid grid-cols-4 gap-2 mb-8 rounded-2xl overflow-hidden h-[400px]">
          <div className="col-span-2 row-span-2">
            <img src={photos[0]} alt="Vue principale" className="w-full h-full object-cover" />
          </div>
          {photos.slice(1, 4).map((photo, i) => (
            <div key={i} className="col-span-1 bg-[#f4fffe]">
              <img src={photo} alt={`Vue ${i+2}`} className="w-full h-full object-cover" />
            </div>
          ))}
          <div className="col-span-1 relative bg-[#f4fffe]">
            <img src={photos[4] || photos[0]} alt="Vue 5" className="w-full h-full object-cover" />
            <button className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-sm font-medium">
              Voir toutes les photos
            </button>
          </div>
        </div>

        {/* Mobile photo gallery */}
        <div className="lg:hidden mb-4">
          <div className="relative rounded-2xl overflow-hidden bg-[#f4fffe]" style={{ aspectRatio: '4/3' }}>
            <img src={photos[activePhoto]} alt="Photo" className="w-full h-full object-cover" />
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
              {photos.slice(0, 5).map((_, i) => (
                <button key={i} onClick={() => setActivePhoto(i)} className={`w-1.5 h-1.5 rounded-full transition-all ${i === activePhoto ? 'bg-white w-4' : 'bg-white/50'}`} />
              ))}
            </div>
          </div>
          <div className="flex gap-2 mt-2 overflow-x-auto scrollbar-hide">
            {photos.slice(0, 5).map((photo, i) => (
              <button key={i} onClick={() => setActivePhoto(i)} className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors bg-[#f4fffe] ${i === activePhoto ? 'border-[#00c9a7]' : 'border-transparent'}`}>
                <img src={photo} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Contenu principal */}
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          <div className="lg:col-span-2 space-y-6 lg:space-y-8">
            {/* Infos hôte */}
            <div className="flex items-start justify-between pb-6 border-b border-[#e2f5f2]">
              <div>
                <h2 className="text-base lg:text-xl font-bold text-[#0f2940] mb-1">
                  {property.type} entier hébergé par {property.host}
                </h2>
                <div className="flex items-center gap-1.5 text-sm text-[#6b7280] flex-wrap">
                  <span>{totalGuests} voyageurs</span> · <span>{property.bedrooms} chambres</span> · <span>{property.beds} lits</span> · <span>{property.baths} sdb</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-gradient-to-br from-[#00c9a7] to-[#0f2940] flex items-center justify-center text-white font-bold shadow-md">
                  {hostInitial}
                </div>
                <div className="flex flex-col gap-1">
                  {property.superhost && <div className="px-2.5 py-0.5 bg-[#00c9a7] text-white text-xs font-medium rounded-full">Superhost</div>}
                  {property.bluefin_certified && <div className="px-2.5 py-0.5 bg-[#0f2940] text-white text-xs font-medium rounded-full">Certifié</div>}
                </div>
              </div>
            </div>

            {/* Points forts */}
            <div className="grid grid-cols-2 gap-3 lg:gap-4 pb-6 border-b border-[#e2f5f2]">
              <div className="flex items-start gap-2 lg:gap-3">
                <Users className="w-5 h-5 text-[#0f2940]" />
                <div><div className="font-medium">{totalGuests} voyageurs</div><div className="text-xs text-[#6b7280]">Capacité max</div></div>
              </div>
              <div className="flex items-start gap-2 lg:gap-3">
                <Bed className="w-5 h-5 text-[#0f2940]" />
                <div><div className="font-medium">{property.beds} lits</div><div className="text-xs text-[#6b7280]">Confortables</div></div>
              </div>
              <div className="flex items-start gap-2 lg:gap-3">
                <Home className="w-5 h-5 text-[#0f2940]" />
                <div><div className="font-medium">Logement entier</div><div className="text-xs text-[#6b7280]">Espace privé</div></div>
              </div>
              <div className="flex items-start gap-2 lg:gap-3">
                <Bath className="w-5 h-5 text-[#0f2940]" />
                <div><div className="font-medium">{property.baths} sdb</div><div className="text-xs text-[#6b7280]">Modernes</div></div>
              </div>
            </div>

            {/* Équipements */}
            <div className="pb-6 border-b border-[#e2f5f2]">
              <h3 className="font-bold text-base lg:text-lg text-[#0f2940] mb-4">Points forts</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {amenitiesList.slice(0, 5).map((amenity, idx) => {
                  const Icon = getAmenityIcon(amenity);
                  return (
                    <div key={idx} className="flex items-start gap-3 p-3 lg:p-4 bg-[#f4fffe] rounded-xl">
                      <div className="w-8 h-8 lg:w-10 lg:h-10 bg-[#00c9a7]/20 rounded-lg flex items-center justify-center">
                        <Icon className="w-4 h-4 lg:w-5 lg:h-5 text-[#00c9a7]" />
                      </div>
                      <div><div className="font-medium text-sm">{amenity}</div><div className="text-xs text-[#6b7280]">Inclus</div></div>
                    </div>
                  );
                })}
                {hasGenerator && (
                  <div className="flex items-start gap-3 p-3 lg:p-4 bg-[#f4fffe] rounded-xl">
                    <div className="w-8 h-8 lg:w-10 lg:h-10 bg-[#00c9a7]/20 rounded-lg flex items-center justify-center">
                      <Zap className="w-4 h-4 lg:w-5 lg:h-5 text-[#00c9a7]" />
                    </div>
                    <div><div className="font-medium text-sm">Groupe électrogène</div><div className="text-xs text-[#6b7280]">Sécurité électrique</div></div>
                  </div>
                )}
                {hasWaterTank && (
                  <div className="flex items-start gap-3 p-3 lg:p-4 bg-[#f4fffe] rounded-xl">
                    <div className="w-8 h-8 lg:w-10 lg:h-10 bg-[#00c9a7]/20 rounded-lg flex items-center justify-center">
                      <Droplet className="w-4 h-4 lg:w-5 lg:h-5 text-[#00c9a7]" />
                    </div>
                    <div><div className="font-medium text-sm">Citerne d'eau</div><div className="text-xs text-[#6b7280]">Eau 24/7</div></div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="pb-6 border-b border-[#e2f5f2]">
              <h3 className="font-bold text-base lg:text-lg text-[#0f2940] mb-3">Description</h3>
              <p className="text-sm lg:text-base text-[#0f2940] leading-relaxed">{property.longDescription}</p>
            </div>

            {/* Localisation */}
            <div>
              <h3 className="font-bold text-base lg:text-lg text-[#0f2940] mb-3">Emplacement</h3>
              <div className="bg-gradient-to-br from-[#f4fffe] to-[#e8fffb] rounded-2xl h-48 lg:h-64 flex items-center justify-center border border-[#e2f5f2]">
                <div className="text-center text-[#6b7280]">
                  <MapPin className="w-10 h-10 mx-auto mb-2 text-[#00c9a7]" />
                  <p className="font-medium text-[#0f2940]">{property.location}</p>
                  <p className="text-sm">Bénin</p>
                </div>
              </div>
            </div>
          </div>

          {/* Widget de réservation */}
          <div className="hidden lg:block lg:col-span-1">
            <BookingWidget 
              propertyId={property.id}
              pricePerNight={property.priceNumber}
              pricePerNightEur={Math.round(property.priceNumber / 655)}
              minStay={property.min_stay || 1}
              maxGuests={totalGuests}
            />
          </div>
        </div>
      </div>

      {/* Mobile sticky bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#e2f5f2] px-4 py-3 flex items-center justify-between z-40">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-[#0f2940]">{property.priceNumber.toLocaleString()} FCFA</span>
            <span className="text-sm text-[#6b7280]">/nuit</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-[#00c9a7]">
            <Star className="w-3 h-3 fill-[#00c9a7]" />
            <span>{property.rating} · {property.reviews} avis</span>
          </div>
        </div>
        <button onClick={onOpenBooking} className="bg-[#00c9a7] text-white px-6 py-3 rounded-full font-medium">Réserver</button>
      </div>
    </div>
  );
}
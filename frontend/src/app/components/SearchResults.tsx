// pages/SearchResults.tsx
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SlidersHorizontal, MapPin, ChevronLeft, Map, Loader2 } from 'lucide-react';
import propertyService from '../services/property.service';
import { useFavorites } from '../hooks/useFavorites';

interface SearchResultsProps {
  mode?: 'logements' | 'hotels';
}

export function SearchResults({ mode = 'logements' }: SearchResultsProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [showMap, setShowMap] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Filtres actuels depuis l'URL
  const destination = searchParams.get('destination') || '';
  const checkIn = searchParams.get('check_in') || '';
  const checkOut = searchParams.get('check_out') || '';
  const guests = searchParams.get('guests') || '1';
  const minPrice = searchParams.get('min_price') || '';
  const maxPrice = searchParams.get('max_price') || '';
  const propertyType = searchParams.get('property_type') || '';
  const sortBy = searchParams.get('sort_by') || 'recommended';

  const fetchResults = async () => {
    setLoading(true);
    try {
      const filters: any = {
        destination: destination || undefined,
        check_in: checkIn || undefined,
        check_out: checkOut || undefined,
        guests: parseInt(guests) || 1,
        min_price: minPrice ? parseInt(minPrice) : undefined,
        max_price: maxPrice ? parseInt(maxPrice) : undefined,
        property_type: propertyType || undefined,
        sort_by: sortBy,
        per_page: 20,
      };
      const response = await propertyService.getAll(filters);
      setProperties(response.data.data);
      setTotal(response.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [searchParams]);

  const updateFilter = (key: string, value: string) => {
    if (value) {
      searchParams.set(key, value);
    } else {
      searchParams.delete(key);
    }
    setSearchParams(searchParams);
  };

  const title = mode === 'hotels' ? 'Hôtels et résidences' : 'Hébergements';
  const subtitle = checkIn && checkOut 
    ? `${checkIn} – ${checkOut} · ${guests} voyageur${parseInt(guests) > 1 ? 's' : ''}`
    : 'Recherche de disponibilités';

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#00c9a7] animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Barre de filtres */}
      <div className="border-b border-[#e2f5f2] sticky top-0 bg-white z-40 px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-[1440px] mx-auto flex items-center gap-2 lg:gap-3">
          <button onClick={() => navigate(-1)} className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full border border-[#e2f5f2] lg:hidden">
            <ChevronLeft className="w-4 h-4 text-[#0f2940]" />
          </button>
          <div className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {/* Filtres rapides (exemple) */}
            <button onClick={() => updateFilter('sort_by', 'price_asc')} className="flex-shrink-0 px-3 py-2 rounded-full border border-[#e2f5f2] text-xs">Prix croissant</button>
            <button onClick={() => updateFilter('sort_by', 'price_desc')} className="flex-shrink-0 px-3 py-2 rounded-full border border-[#e2f5f2] text-xs">Prix décroissant</button>
            <button onClick={() => updateFilter('sort_by', 'rating_desc')} className="flex-shrink-0 px-3 py-2 rounded-full border border-[#e2f5f2] text-xs">Mieux notés</button>
            <button className="flex-shrink-0 px-3 py-2 rounded-full bg-white border border-[#e2f5f2] flex items-center gap-1.5" onClick={() => setFiltersOpen(true)}>
              <SlidersHorizontal className="w-3.5 h-3.5" /> Filtres
            </button>
          </div>
          <button onClick={() => setShowMap(!showMap)} className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs border lg:hidden ${showMap ? 'bg-[#0f2940] text-white' : ''}`}>
            <Map className="w-3.5 h-3.5" /> Carte
          </button>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
        <div className="flex gap-6 lg:gap-8">
          {/* Liste des résultats */}
          <div className={`flex-1 space-y-3 lg:space-y-4 ${showMap ? 'hidden sm:block' : 'block'}`}>
            <div className="mb-4 lg:mb-6">
              <h2 className="text-lg lg:text-2xl font-bold text-[#0f2940]">{title} à {destination || 'Cotonou'}</h2>
              <p className="text-sm text-[#6b7280]">{total} résultat{total > 1 ? 's' : ''} · {subtitle}</p>
            </div>

            {properties.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500">Aucun logement trouvé pour ces critères</p>
                <button onClick={() => navigate('/')} className="mt-4 text-[#00c9a7]">Modifier la recherche</button>
              </div>
            ) : (
              properties.map((property) => (
                <div key={property.id} onClick={() => navigate(`/listing/${property.id}`)} className="flex gap-3 lg:gap-4 bg-white rounded-xl lg:rounded-2xl overflow-hidden shadow hover:shadow-md transition-all cursor-pointer p-3 lg:p-4 border border-transparent hover:border-[#e2f5f2]">
                  <div className="relative w-28 sm:w-40 lg:w-60 h-24 sm:h-32 lg:h-40 flex-shrink-0 rounded-xl overflow-hidden bg-[#f4fffe]">
                    <img src={property.cover_photo?.photo_url || '/placeholder.jpg'} alt={property.title} className="w-full h-full object-cover" />
                    {property.bluefin_certified && <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium bg-[#00c9a7] text-white">Certifié</div>}
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between gap-2 mb-1">
                        <h3 className="font-bold text-sm lg:text-lg text-[#0f2940] line-clamp-2">{property.title}</h3>
                        <div className="flex items-center gap-1 px-2 py-1 bg-[#00c9a7]/10 rounded-full">
                          <span className="text-xs font-medium">★ {property.average_rating || 'Nouveau'}</span>
                          {property.reviews_count > 0 && <span className="text-xs text-[#6b7280] hidden sm:inline">({property.reviews_count})</span>}
                        </div>
                      </div>
                      <p className="text-xs text-[#6b7280] mb-2">{property.district}, {property.city}</p>
                      <div className="flex items-center gap-1.5 text-xs text-[#6b7280]">
                        <MapPin className="w-3.5 h-3.5" /> {property.district}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-base lg:text-xl font-bold text-[#0f2940]">{property.price_per_night.toLocaleString()}</span>
                          <span className="text-xs">XOF/nuit</span>
                        </div>
                        <span className="text-xs text-[#00c9a7]">≈ {Math.round(property.price_per_night / 655)} €</span>
                      </div>
                      <button className="hidden sm:block text-[#00c9a7] border-2 border-[#00c9a7] px-4 py-1.5 rounded-full text-sm font-medium hover:bg-[#00c9a7] hover:text-white">Voir</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Carte (simplifiée - peut être remplacée par Google Maps) */}
          <div className={`lg:w-[46%] lg:sticky lg:top-32 lg:h-[calc(100vh-8rem)] ${showMap ? 'block w-full' : 'hidden lg:block'}`}>
            <div className="w-full h-[calc(100vh-12rem)] lg:h-full bg-[#f4fffe] rounded-2xl overflow-hidden relative border border-[#e2f5f2]">
              <div className="absolute inset-0 flex items-center justify-center text-[#6b7280]">
                <div className="text-center">
                  <MapPin className="w-10 h-10 mx-auto mb-2 text-[#00c9a7]" />
                  <p className="font-semibold">Carte interactive</p>
                  <p className="text-sm">{destination || 'Cotonou'}, Bénin</p>
                </div>
              </div>
              {/* Marqueurs simplifiés pour démonstration */}
              {properties.slice(0, 5).map((p, i) => (
                <div key={i} className="absolute bg-white rounded-full px-3 py-1.5 shadow-md text-sm font-semibold cursor-pointer" style={{ top: `${15 + i * 12}%`, left: `${20 + (i % 3) * 15}%` }} onClick={() => navigate(`/listing/${p.id}`)}>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00c9a7] inline-block mr-1"></div>
                  {p.price_per_night.toLocaleString()} XOF
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
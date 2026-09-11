// pages/ListingCard.tsx (ou components/ListingCard.tsx)
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ListingDetail } from './ListingDetail';
import propertyService from '../services/property.service';
import { useAuth } from '../hooks/useAuth';

interface ListingCardProps {
  onNavigate?: (route: any) => void;
}

export function ListingCard({ onNavigate }: ListingCardProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("ID de logement manquant");
      setLoading(false);
      return;
    }

    const fetchProperty = async () => {
      setLoading(true);
      try {
        const response = await propertyService.getById(parseInt(id));
        if (response.success && response.data) {
          // Transformer les données de l'API vers le format attendu par ListingDetail
          const apiProperty = response.data;
          const formattedProperty = {
            id: apiProperty.id,
            title: apiProperty.title,
            description: apiProperty.description,
            location: `${apiProperty.district}, ${apiProperty.city}`,
            city: apiProperty.city,
            district: apiProperty.district,
            priceNumber: apiProperty.price_per_night,
            priceDisplay: `${apiProperty.price_per_night.toLocaleString()} FCFA / nuit`,
            rating: apiProperty.average_rating || 0,
            reviews: apiProperty.reviews_count || 0,
            image: apiProperty.cover_photo?.photo_url || apiProperty.photos?.[0]?.photo_url || '/placeholder.jpg',
            images: apiProperty.photos?.map((p: any) => p.photo_url) || [],
            beds: apiProperty.beds,
            baths: apiProperty.bathrooms,
            bedrooms: apiProperty.bedrooms,
            max_guests: apiProperty.max_guests,
            host: apiProperty.user?.full_name || 'Hôte',
            hostImage: apiProperty.user?.profile_photo_url,
            hostSince: apiProperty.user?.created_at ? new Date(apiProperty.user.created_at).getFullYear().toString() : '2024',
            superhost: apiProperty.superhost || false,
            responseRate: 100,
            responseTime: 'quelques heures',
            longDescription: apiProperty.description,
            amenities: apiProperty.amenities_list || [],
            type: apiProperty.property_type,
            bluefin_certified: apiProperty.bluefin_certified,
            has_generator: apiProperty.has_generator,
            has_wifi: apiProperty.has_wifi,
            has_air_conditioning: apiProperty.has_air_conditioning,
            has_water_tank: apiProperty.has_water_tank,
            cancellation_policy: apiProperty.cancellation_policy,
            instant_booking: apiProperty.instant_booking,
          };
          setProperty(formattedProperty);
        } else {
          setError("Propriété non trouvée");
        }
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.message || "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00c9a7] mx-auto mb-4"></div>
          <p className="text-gray-500">Chargement du logement...</p>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-semibold text-[#0F2940] mb-2">Logement introuvable</h1>
          <p className="text-gray-500 mb-4">
            {error || "Le logement que vous recherchez n'existe pas ou a été supprimé."}
          </p>
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-[#00c9a7] text-[#0F2940] rounded-full font-semibold hover:bg-[#00b892] transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <ListingDetail 
      property={property}
      onBack={() => navigate(-1)}
      onOpenBooking={() => navigate(`/checkout/${property.id}`)}
      isAuthenticated={isAuthenticated}
    />
  );
}
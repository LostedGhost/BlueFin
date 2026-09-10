// components/DestinationCard.tsx
import { useNavigate } from 'react-router-dom';

interface Destination {
  id: number;
  name: string;      // ville ou quartier
  subtitle: string;  // nombre de propriétés
  image: string;     // URL de l'image représentative
  filter: { city?: string; district?: string };
}

interface DestinationCardProps {
  destination: Destination;
  onClick?: () => void;
}

export function DestinationCard({ destination, onClick }: DestinationCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Naviguer vers la page de recherche avec les filtres
      const params = new URLSearchParams(destination.filter).toString();
      navigate(`/search?${params}`);
    }
  };

  return (
    <div 
      className="relative h-40 sm:h-52 lg:h-64 rounded-2xl overflow-hidden cursor-pointer group bg-[#f4fffe]" 
      onClick={handleClick}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-[#0f2940]/90 via-[#0f2940]/40 to-transparent z-10"></div>
      <img
        src={destination.image}
        alt={destination.name}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        onError={(e) => {
          (e.target as HTMLImageElement).src = '/placeholder-destination.jpg';
        }}
      />
      <div className="absolute bottom-6 left-6 z-20">
        <h3 className="text-white font-bold text-2xl mb-1">{destination.name}</h3>
        <p className="text-white/70 text-sm">{destination.subtitle}</p>
      </div>
    </div>
  );
}
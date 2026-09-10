import { Search, MapPin, Calendar, Users, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface HeroProps {
  onSearch?: (query?: string) => void;
  onNavigate?: (path?: string, params?: URLSearchParams) => void;
}

// Liste des destinations
const destinationsList = [
  "Cotonou", "Porto-Novo", "Abomey-Calavi", "Parakou", "Abomey", "Ouidah", "Grand-Popo", "Dassa-Zoumè",
  "Natitingou", "Lokossa", "Bohicon", "Kandi", "Malanville", "Dogbo", "Savalou", "Pobè", "Sakété",
  "Allada", "Ganvié", "Fidjrossè", "Haie Vive", "Akpakpa", "Menontin", "Patte d'Oie", "Ganhi", "Cocotiers"
];

// Images du carrousel - immeubles modernes
const heroImages = [
  {
    url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1920&h=800&fit=crop",
    alt: "Immeuble moderne avec piscine"
  },
  {
    url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&h=800&fit=crop",
    alt: "Gratte-ciel et immeubles de bureaux"
  },
  {
    url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1920&h=800&fit=crop",
    alt: "Immeuble résidentiel de luxe"
  },
  {
    url: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1920&h=800&fit=crop",
    alt: "Complexe immobilier moderne"
  }
];

export function Hero({ onSearch, onNavigate }: HeroProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guestCounts, setGuestCounts] = useState({ adults: 1, children: 0, babies: 0, pets: 0 });
  const [activeTab, setActiveTab] = useState<"destination" | "dates" | "guests" | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const destinationRef = useRef<HTMLDivElement>(null);
  const datesRef = useRef<HTMLDivElement>(null);
  const guestsRef = useRef<HTMLDivElement>(null);

  // Fonction pour le carrousel automatique
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fermer les popups au clic en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (destinationRef.current && !destinationRef.current.contains(event.target as Node)) {
        if (activeTab === "destination") setActiveTab(null);
      }
      if (datesRef.current && !datesRef.current.contains(event.target as Node)) {
        if (activeTab === "dates") setActiveTab(null);
      }
      if (guestsRef.current && !guestsRef.current.contains(event.target as Node)) {
        if (activeTab === "guests") setActiveTab(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeTab]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + heroImages.length) % heroImages.length);
  };

  const guestLabel = () => {
    const totalGuests = guestCounts.adults + guestCounts.children;
    const parts = [];
    if (totalGuests > 0) parts.push(`${totalGuests} voyageur${totalGuests > 1 ? 's' : ''}`);
    if (guestCounts.babies > 0) parts.push(`${guestCounts.babies} bébé${guestCounts.babies > 1 ? 's' : ''}`);
    if (guestCounts.pets > 0) parts.push(`${guestCounts.pets} animal${guestCounts.pets > 1 ? 's' : ''}`);
    return parts.length > 0 ? parts.join(" · ") : "Ajouter des voyageurs";
  };

  const dateLabel = () => {
    if (checkIn && checkOut) {
      return `${new Date(checkIn).toLocaleDateString('fr-BJ', { day: 'numeric', month: 'short' })} - ${new Date(checkOut).toLocaleDateString('fr-BJ', { day: 'numeric', month: 'short' })}`;
    }
    return "Ajouter des dates";
  };

  // Fonctions calendrier
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    const firstDayOfWeek = firstDay.getDay();
    const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    for (let i = startOffset; i > 0; i--) {
      const prevDate = new Date(year, month, -i + 1);
      days.push({ date: prevDate, isCurrentMonth: false });
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    return days;
  };

  const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  const isDateSelected = (date: Date) => {
    if (!checkIn && !checkOut) return false;
    const dateStr = date.toDateString();
    if (checkIn && dateStr === new Date(checkIn).toDateString()) return true;
    if (checkOut && dateStr === new Date(checkOut).toDateString()) return true;
    return false;
  };

  const isInRange = (date: Date) => {
    if (!checkIn || !checkOut) return false;
    const dateTime = date.getTime();
    const checkInTime = new Date(checkIn).getTime();
    const checkOutTime = new Date(checkOut).getTime();
    return dateTime > checkInTime && dateTime < checkOutTime;
  };

  const handleDateSelect = (date: Date) => {
    if (!checkIn || (checkIn && checkOut)) {
      setCheckIn(date.toISOString().split('T')[0]);
      setCheckOut("");
    } else if (checkIn && !checkOut) {
      if (date < new Date(checkIn)) {
        setCheckOut(checkIn);
        setCheckIn(date.toISOString().split('T')[0]);
      } else {
        setCheckOut(date.toISOString().split('T')[0]);
      }
    }
  };

  const changeMonth = (delta: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1));
  };

  const days = getDaysInMonth(currentMonth);

  // Fonction de recherche
  const handleSearch = () => {
    const searchParams = new URLSearchParams();
    
    if (destination) searchParams.set('destination', destination);
    if (checkIn) searchParams.set('checkIn', checkIn);
    if (checkOut) searchParams.set('checkOut', checkOut);
    
    const totalGuests = guestCounts.adults + guestCounts.children;
    if (totalGuests > 0) searchParams.set('guests', totalGuests.toString());
    if (guestCounts.babies > 0) searchParams.set('babies', guestCounts.babies.toString());
    if (guestCounts.pets > 0) searchParams.set('pets', guestCounts.pets.toString());
    
    if (onNavigate) {
      onNavigate('/s/logements', searchParams);
    }
    
    setActiveTab(null);
    setShowMobileSearch(false);
    onSearch?.(destination || undefined);
  };

  return (
    <div className="relative overflow-hidden" style={{ minHeight: 'clamp(300px, 45vw, 500px)' }}>
      {/* Carrousel d'images */}
      {heroImages.map((image, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentImageIndex ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <img
            src={image.url}
            alt={image.alt}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0f2940]/40 via-[#0f2940]/50 to-[#0f2940]/85"></div>
        </div>
      ))}

      {/* Boutons de navigation du carrousel */}
      <button
        onClick={prevImage}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all duration-300"
      >
        <ChevronLeft className="w-5 h-5 text-white" />
      </button>
      <button
        onClick={nextImage}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all duration-300"
      >
        <ChevronRight className="w-5 h-5 text-white" />
      </button>

      {/* Indicateurs du carrousel */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {heroImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentImageIndex(index)}
            className={`transition-all duration-300 ${
              index === currentImageIndex
                ? 'w-6 h-1.5 bg-[#00c9a7] rounded-full'
                : 'w-1.5 h-1.5 bg-white/50 rounded-full hover:bg-white/80'
            }`}
          />
        ))}
      </div>

      <div className="relative z-20 flex flex-col items-center justify-center h-full px-4 sm:px-6 lg:px-8 py-8 lg:py-12" style={{ minHeight: 'clamp(300px, 45vw, 500px)' }}>
        <div className="text-center mb-6 lg:mb-8">
          <h1 className="text-white text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 lg:mb-3 leading-tight">
            Trouvez votre hébergement<br className="hidden sm:block" /> idéal au Bénin
          </h1>
          <p className="text-white/85 text-sm sm:text-base lg:text-lg">
            Appartements, villas, hôtels — partout au Bénin
          </p>
        </div>

        

       
      </div>
    </div>
  );
}
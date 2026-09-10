import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Heart, Star, X, MapPin, Clock, Users, 
  Calendar as CalendarIcon, CheckCircle, AlertCircle,
  Share2, MessageCircle, ChevronLeft, ChevronRight,
  Crown, Info, User, Calendar, DollarSign, Phone,
  Mail, Globe, ChevronDown, ChevronUp, Sparkles,
  Play, Image
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface ExperienceDetailModalProps {
  experience: any;
  onClose: () => void;
  onNavigate?: (route: { name: string; params?: any; search?: string; id?: string }) => void;
}

// ============================================
// FORMAT CURRENCY
// ============================================
const formatCurrency = (amount: number) => {
  const fCFA = `${amount.toLocaleString()} FCFA`;
  const euro = `${(amount / 655.957).toFixed(2)} €`;
  return { fCFA, euro };
};

// ============================================
// COMPOSANT CALENDRIER DE DISPONIBILITÉ
// ============================================
interface AvailabilityCalendarProps {
  propertyId: number;
  checkIn?: string;
  checkOut?: string;
  onDateSelect?: (checkIn: string, checkOut: string) => void;
}

const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({ 
  propertyId, 
  checkIn, 
  checkOut, 
  onDateSelect 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedStart, setSelectedStart] = useState<string | null>(checkIn || null);
  const [selectedEnd, setSelectedEnd] = useState<string | null>(checkOut || null);
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const getDaysInMonth = (year: number, month: number) => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const days: Date[] = [];
    
    const startPadding = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    for (let i = startPadding; i > 0; i--) {
      const date = new Date(year, month - 1, 1 - i);
      days.push(date);
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month - 1, i));
    }
    
    const endPadding = 7 - (days.length % 7);
    if (endPadding < 7) {
      for (let i = 1; i <= endPadding; i++) {
        const date = new Date(year, month, i);
        days.push(date);
      }
    }
    
    return days;
  };

  const days = getDaysInMonth(year, month);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const formatDateKey = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const isDateInPast = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d < today;
  };

  const isDateSelected = (date: Date) => {
    const key = formatDateKey(date);
    return key === selectedStart || key === selectedEnd;
  };

  const isDateInRange = (date: Date) => {
    if (!selectedStart || !selectedEnd) return false;
    const key = formatDateKey(date);
    return key > selectedStart && key < selectedEnd;
  };

  const handleDateClick = (date: Date) => {
    if (isDateInPast(date)) return;
    
    const key = formatDateKey(date);
    
    if (!selectedStart) {
      setSelectedStart(key);
      return;
    }
    
    if (!selectedEnd && key !== selectedStart) {
      if (key < selectedStart) {
        setSelectedStart(key);
        return;
      }
      setSelectedEnd(key);
      if (onDateSelect) {
        onDateSelect(selectedStart, key);
      }
      return;
    }
    
    setSelectedStart(key);
    setSelectedEnd(null);
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === month - 1;
  };

  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentDate(new Date(year, month - 2, 1))}
          className="p-2 rounded-lg hover:bg-gray-100 transition"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h3 className="font-semibold text-gray-800">
          {monthNames[month - 1]} {year}
        </h3>
        <button
          onClick={() => setCurrentDate(new Date(year, month, 1))}
          className="p-2 rounded-lg hover:bg-gray-100 transition"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => {
          const isPast = isDateInPast(date);
          const isSelected = isDateSelected(date);
          const isInRange = isDateInRange(date);
          const isCurrentMonthDay = isCurrentMonth(date);
          
          let bgColor = 'hover:bg-gray-50';
          let textColor = 'text-gray-800';
          let cursor = 'cursor-pointer';
          
          if (!isCurrentMonthDay) {
            textColor = 'text-gray-300';
            cursor = 'cursor-default';
            bgColor = '';
          } else if (isPast) {
            textColor = 'text-gray-300';
            cursor = 'cursor-not-allowed';
            bgColor = 'bg-gray-50';
          } else if (isSelected) {
            bgColor = 'bg-[#00c9a7] text-white';
            textColor = 'text-white';
          } else if (isInRange) {
            bgColor = 'bg-[#00c9a7]/20';
          }
          
          return (
            <div
              key={index}
              onClick={() => isCurrentMonthDay && !isPast && handleDateClick(date)}
              className={`
                relative aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all duration-200
                ${bgColor} ${textColor} ${cursor}
                ${isSelected ? 'shadow-lg shadow-[#00c9a7]/30 scale-105' : ''}
                ${isInRange && !isSelected ? 'border border-[#00c9a7]/30' : ''}
              `}
            >
              <span>{date.getDate()}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-[#00c9a7]"></div>
          <span className="text-gray-600">Sélectionné</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-[#00c9a7]/20"></div>
          <span className="text-gray-600">Plage</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-gray-50 border border-gray-200"></div>
          <span className="text-gray-600">Passé</span>
        </div>
      </div>
      
      <div className="mt-3 text-xs text-gray-400 text-center">
        {selectedStart && !selectedEnd && 'Sélectionnez la date de fin'}
        {selectedStart && selectedEnd && `${selectedStart} → ${selectedEnd}`}
      </div>
    </div>
  );
};

// ============================================
// COMPOSANT PRINCIPAL EXPERIENCE DETAIL MODAL
// ============================================
export const ExperienceDetailModal: React.FC<ExperienceDetailModalProps> = ({ 
  experience, 
  onClose, 
  onNavigate 
}) => {
  const { isAuthenticated, user } = useAuth();
  
  const [showAllSteps, setShowAllSteps] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  
  const [checkIn, setCheckIn] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  
  const [checkOut, setCheckOut] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
  });
  
  const [participants, setParticipants] = useState(1);
  const [availabilityStatus, setAvailabilityStatus] = useState<'idle' | 'available' | 'unavailable'>('idle');

  // Fonction pour récupérer les images (à adapter avec votre logique)

const getExperienceImages = (exp: any): string[] => {
  const images: string[] = [];
  
  const addImage = (url: string) => {
    if (!url) return;
    const cleanUrl = getImageUrl(url);
    if (!images.includes(cleanUrl) && !cleanUrl.includes('undefined')) {
      images.push(cleanUrl);
    }
  };

  // 1. Récupérer depuis exp.images
  if (exp.images && Array.isArray(exp.images)) {
    for (const img of exp.images) {
      if (typeof img === 'string') {
        addImage(img);
      } else if (typeof img === 'object') {
        if (img.url) addImage(img.url);
        if (img.path) addImage(img.path);
        if (img.image_url) addImage(img.image_url);
        if (img.image_path) addImage(img.image_path);
      }
    }
    if (images.length > 0) return images;
  }

  // 2. Récupérer depuis exp.image
  if (exp.image && exp.image !== 'undefined') {
    addImage(exp.image);
  }

  // 3. Récupérer depuis les étapes
  if (exp.steps && Array.isArray(exp.steps) && exp.steps.length > 0) {
    for (const step of exp.steps) {
      if (step.image_url) addImage(step.image_url);
      if (step.image_path) addImage(step.image_path);
      if (step.image) addImage(step.image);
    }
  }

  // 4. Récupérer depuis availability meta
  if (exp.availability && Array.isArray(exp.availability)) {
    for (const item of exp.availability) {
      try {
        let parsed = item;
        if (typeof item === 'string') parsed = JSON.parse(item);
        if (parsed && typeof parsed === 'object' && parsed.gallery) {
          for (const img of parsed.gallery) addImage(img);
        }
      } catch (e) {}
    }
  }

  // 5. Fallback
  if (images.length === 0) {
    images.push(`https://picsum.photos/seed/${exp.id}/800/600`);
    images.push(`https://picsum.photos/seed/${exp.id}-2/800/600`);
    images.push(`https://picsum.photos/seed/${exp.id}-3/800/600`);
  }
  
  return images;
};

// ✅ Version simplifiée
const getImageUrl = (exp: any): string => {
    // 1. Vérifier si l'expérience a des images
    if (exp.images && Array.isArray(exp.images) && exp.images.length > 0) {
        const firstImage = exp.images[0];
        return formatImageUrl(firstImage);
    }
    
    // 2. Vérifier si l'expérience a un champ image direct
    if (exp.image && exp.image !== 'undefined') {
        return formatImageUrl(exp.image);
    }
    
    // 3. Vérifier dans les étapes
    if (exp.steps && Array.isArray(exp.steps) && exp.steps.length > 0) {
        for (const step of exp.steps) {
            if (step.image_url) return formatImageUrl(step.image_url);
            if (step.image_path) return formatImageUrl(step.image_path);
            if (step.image) return formatImageUrl(step.image);
        }
    }
    
    // 4. Fallback
    return `https://picsum.photos/seed/${exp.id}/800/600`;
};

// ✅ Version améliorée - accepte string ou objet
const formatImageUrl = (path: any): string => {
  if (!path) return '';
  
  // Si c'est un objet, extraire l'URL
  if (typeof path === 'object') {
    if (path.url) return formatImageUrl(path.url);
    if (path.path) return formatImageUrl(path.path);
    if (path.image_url) return formatImageUrl(path.image_url);
    if (path.image_path) return formatImageUrl(path.image_path);
    return '';
  }
  
  // Si c'est déjà une URL complète
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Si c'est un chemin avec /storage/
  if (path.startsWith('/storage/')) {
    return `https://api.bluefin-immo.com${path}`;
  }
  
  // Si c'est un chemin storage/ sans slash
  if (path.startsWith('storage/')) {
    return `https://api.bluefin-immo.com/${path}`;
  }
  
  // Si c'est un chemin relatif (experiences/...)
  if (path.startsWith('experiences/')) {
    return `https://api.bluefin-immo.com/storage/${path}`;
  }
  
  // Si c'est un chemin avec des backslashes
  if (path.includes('\\')) {
    const cleanPath = path.replace(/\\/g, '/');
    return `https://api.bluefin-immo.com/storage/${cleanPath}`;
  }
  
  // Fallback
  return `https://api.bluefin-immo.com/storage/${path}`;
};

  // Fonction pour récupérer les étapes
  const getExperienceSteps = (exp: any): any[] => {
    if (exp.steps && Array.isArray(exp.steps) && exp.steps.length > 0) {
      return exp.steps.map((step: any) => {
        if (typeof step === 'string') {
          return { order: 0, description: step, image: '' };
        }
        return {
          order: step.order || 0,
          description: step.description || step.text || '',
          image: step.image_url || step.image || ''
        };
      });
    }
    return [
      { order: 1, description: `Accueil et présentation au cœur de ${exp.location || 'votre destination'}`, image: '' },
      { order: 2, description: 'Découverte de l\'histoire locale et des techniques utilisées', image: '' },
      { order: 3, description: 'Mise en pratique avec votre guide ou artisan', image: '' },
      { order: 4, description: 'Création d\'un souvenir à emporter chez vous', image: '' }
    ];
  };

  

  const images = getExperienceImages(experience);
  const steps = getExperienceSteps(experience);
  
  const host = experience.host?.first_name 
    ? `${experience.host.first_name} ${experience.host.last_name || ''}` 
    : 'Hôte vérifié';
  
  const hostAvatarUrl = `https://ui-avatars.com/api/?background=00c9a7&color=fff&name=${encodeURIComponent(host)}&bold=true&size=128`;
  const price = experience.price || 0;
  const maxParticipants = experience.total_places || 10;
  const availablePlaces = experience.available_places || maxParticipants;
  const rating = experience.average_rating || 0;
  const reviews = experience.reviews_count || 0;
  const responseRate = experience.host?.response_rate || 100;

  const nights = Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)));
  const subtotal = price * nights;
  const serviceFee = subtotal * 0.10;
  const total = subtotal + serviceFee;
  
  const priceFormatted = formatCurrency(price);
  const subtotalFormatted = formatCurrency(subtotal);
  const serviceFeeFormatted = formatCurrency(serviceFee);
  const totalFormatted = formatCurrency(total);

  // Vérification de disponibilité
  useEffect(() => {
    if (checkIn && checkOut) {
      // Vérifier si les dates sont disponibles (simulation)
      const isAvailable = availablePlaces >= participants;
      setAvailabilityStatus(isAvailable ? 'available' : 'unavailable');
    }
  }, [checkIn, checkOut, participants, availablePlaces]);

  const handleDateSelect = (start: string, end: string) => {
    setCheckIn(start);
    setCheckOut(end);
    setAvailabilityStatus('idle');
  };

  const handleReservationClick = () => {
    if (availabilityStatus !== 'available') {
      alert('Cette expérience n\'est pas disponible pour les dates sélectionnées.');
      return;
    }

    if (!isAuthenticated) {
      localStorage.setItem('redirect_intent', 'experience_booking');
      localStorage.setItem('redirect_experience_id', experience.id.toString());
      localStorage.setItem('redirect_experience_name', experience.name || experience.title);
      localStorage.setItem('redirect_experience_price', price.toString());
      localStorage.setItem('temp_booking_check_in', checkIn);
      localStorage.setItem('temp_booking_check_out', checkOut);
      localStorage.setItem('temp_booking_guests', participants.toString());
      localStorage.setItem('temp_booking_nights', nights.toString());
      
      if (onNavigate) {
        onNavigate({ name: 'auth', search: 'redirect=experience_booking' });
      } else {
        window.location.href = '/auth?redirect=experience_booking';
      }
    } else {
      const bookingData = {
        experience_id: experience.id,
        experience_name: experience.name || experience.title,
        check_in: checkIn,
        check_out: checkOut,
        participants: participants,
        nights: nights,
        price: price,
        total: total,
        guest_details: {
          full_name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : '',
          email: user?.email || '',
          phone: user?.phone || ''
        }
      };
      
      sessionStorage.setItem('experienceBookingData', JSON.stringify(bookingData));
      
      if (onNavigate) {
        onNavigate({ 
          name: 'experience-booking', 
          id: experience.id.toString(),
          search: `?check_in=${checkIn}&check_out=${checkOut}&participants=${participants}`
        });
      } else {
        window.location.href = `/experience-booking/${experience.id}?check_in=${checkIn}&check_out=${checkOut}&participants=${participants}`;
      }
    }
  };

  // Galerie d'images
  const GalleryModal = () => {
    useEffect(() => {
      if (isGalleryOpen) {
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
      } else {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
      }
      return () => {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
      };
    }, [isGalleryOpen]);

    return (
      <div className="fixed inset-0 z-[200] bg-black flex flex-col">
        <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center p-4 bg-gradient-to-b from-black/80 to-transparent">
          <button 
            onClick={() => setIsGalleryOpen(false)} 
            className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all backdrop-blur-sm"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="text-white text-sm bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm font-medium">
            {galleryIndex + 1} / {images.length}
          </div>
          <button className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all backdrop-blur-sm">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <img 
            src={images[galleryIndex]} 
            alt={`${experience.name} - ${galleryIndex + 1}`}
            className="max-w-full max-h-full object-contain select-none"
            draggable={false}
          />
        </div>
        {images.length > 1 && (
          <>
            <button
              onClick={() => setGalleryIndex(Math.max(0, galleryIndex - 1))}
              className={`absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all backdrop-blur-sm ${
                galleryIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'opacity-100 hover:scale-110'
              }`}
              disabled={galleryIndex === 0}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => setGalleryIndex(Math.min(images.length - 1, galleryIndex + 1))}
              className={`absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all backdrop-blur-sm ${
                galleryIndex === images.length - 1 ? 'opacity-30 cursor-not-allowed' : 'opacity-100 hover:scale-110'
              }`}
              disabled={galleryIndex === images.length - 1}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>
    );
  };

  return (
    <>
      {isGalleryOpen && <GalleryModal />}
      
      <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
        <div className="min-h-screen pb-20">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b px-3 sm:px-4 py-3 flex justify-between items-center">
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-all">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-sm sm:text-base font-semibold text-[#0F2940] truncate max-w-[50%]">
              {experience.name || experience.title}
            </h1>
            <div className="flex gap-2">
              <button className="p-2 rounded-full hover:bg-gray-100 transition-all">
                <Share2 className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-full hover:bg-gray-100 transition-all">
                <Heart className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
            {/* Images */}
            <div 
              className="grid grid-cols-2 gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl overflow-hidden mb-4 sm:mb-6 cursor-pointer"
              onClick={() => setIsGalleryOpen(true)}
            >
              <div className="col-span-1 row-span-2 overflow-hidden aspect-[4/3] relative">
                <img 
                  src={images[0] || `https://picsum.photos/seed/${experience.id}/800/600`} 
                  alt={experience.name} 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
              {images.slice(1, 4).map((img, i) => (
                <div key={i} className="overflow-hidden aspect-[4/3]">
                  <img 
                    src={img || `https://picsum.photos/seed/${experience.id}-${i+2}/800/600`} 
                    alt={`${experience.name} - ${i + 2}`} 
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ))}
            </div>

            {/* Layout principal */}
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
              {/* Colonne gauche - Détails */}
              <div className="flex-1 space-y-6 sm:space-y-8">
                {/* Titre */}
                <div className="border-b pb-4">
                  <div className="text-xs sm:text-sm text-gray-500">
                    Expérience · {experience.location || 'Bénin'}
                  </div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-[#0F2940] mt-1">
                    {experience.name || experience.title}
                  </h1>
                  <div className="flex items-center gap-2 mt-2">
                    <Star className="w-4 h-4 fill-current text-yellow-400" />
                    <span className="font-medium text-sm text-[#0F2940]">
                      {typeof rating === 'number' && rating > 0 ? rating.toFixed(1) : 'Nouveau'}
                    </span>
                    {reviews > 0 && (
                      <>
                        <span className="text-gray-300">·</span>
                        <span className="text-gray-500 text-sm">{reviews} commentaires</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Hôte */}
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#00c9a7] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {host.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-[#0F2940] text-base sm:text-lg">
                      Hôte : {host}
                    </div>
                    <div className="text-sm text-gray-500">
                      Taux de réponse {responseRate}%
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  {experience.description || 'Aucune description disponible'}
                </div>

                {/* Étapes */}
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg text-[#0F2940]">
                      Programme de l'expérience
                    </h3>
                    <span className="text-sm text-gray-400">{steps.length}</span>
                  </div>
                  
                  <div className="space-y-3">
                    {(showAllSteps ? steps : steps.slice(0, 3)).map((step: any, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:shadow-md transition-shadow">
                        {step.image && (
                          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                            <img 
                              src={step.image} 
                              alt={`Étape ${index + 1}`} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="w-7 h-7 rounded-full bg-[#00c9a7] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                              {index + 1}
                            </span>
                            <span className="text-sm font-semibold text-[#0F2940]">Étape {index + 1}</span>
                          </div>
                          <p className="text-sm text-gray-700">{step.description || step}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {steps.length > 3 && (
                    <button 
                      onClick={() => setShowAllSteps(!showAllSteps)}
                      className="text-sm text-[#00c9a7] font-semibold hover:underline mt-3"
                    >
                      {showAllSteps ? 'Voir moins' : `Voir tout (${steps.length} étapes)`}
                    </button>
                  )}
                </div>
              </div>

              {/* Colonne droite - Réservation avec calendrier */}
              <div className="lg:w-96 xl:w-[420px] flex-shrink-0">
                <div className="sticky top-24 bg-white border border-gray-200 rounded-2xl p-5 shadow-lg">
                  {/* Prix */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-[#0F2940]">
                        {price.toLocaleString()} FCFA
                      </span>
                      <span className="text-sm text-gray-500">/ personne</span>
                    </div>
                    <div className="text-sm text-gray-400">
                      ≈ {Math.round(price / 655.957).toFixed(2)} €
                    </div>
                  </div>

                  {/* ✅ CALENDRIER - comme PropertyDetailModal */}
                  <div className="border rounded-xl mb-4 overflow-hidden">
                    <div className="p-3">
                      <AvailabilityCalendar
                        propertyId={experience.id}
                        checkIn={checkIn}
                        checkOut={checkOut}
                        onDateSelect={handleDateSelect}
                      />
                    </div>

                    <div className="grid grid-cols-2 border-t">
                      <div className="p-3">
                        <div className="text-xs font-bold text-gray-500 uppercase">Arrivée</div>
                        <input 
                          type="date" 
                          value={checkIn} 
                          onChange={(e) => {
                            setCheckIn(e.target.value);
                            setAvailabilityStatus('idle');
                          }} 
                          min={new Date().toISOString().split('T')[0]} 
                          className="w-full text-sm font-medium mt-1 border-0 p-0 focus:ring-0 bg-transparent" 
                        />
                      </div>
                      <div className="p-3 border-l">
                        <div className="text-xs font-bold text-gray-500 uppercase">Départ</div>
                        <input 
                          type="date" 
                          value={checkOut} 
                          onChange={(e) => {
                            setCheckOut(e.target.value);
                            setAvailabilityStatus('idle');
                          }} 
                          min={checkIn} 
                          className="w-full text-sm font-medium mt-1 border-0 p-0 focus:ring-0 bg-transparent" 
                        />
                      </div>
                    </div>

                    {availabilityStatus === 'available' && (
                      <div className="p-2 bg-green-50 text-center text-xs text-green-600 border-t">
                        <CheckCircle className="inline w-3 h-3 mr-1" /> Disponible
                      </div>
                    )}
                    {availabilityStatus === 'unavailable' && (
                      <div className="p-2 bg-red-50 text-center text-xs text-red-600 border-t">
                        <AlertCircle className="inline w-3 h-3 mr-1" /> Non disponible
                      </div>
                    )}

                    {/* Participants */}
                    <div className="p-3 border-t">
                      <div className="text-xs font-bold text-gray-500 uppercase mb-2">Participants</div>
                      
                      <div className="flex justify-between items-center py-1">
                        <div>
                          <span className="text-sm">Personnes</span>
                          <p className="text-[10px] text-gray-400">À partir de 1 personne</p>
                        </div>
                        <div className="flex gap-3">
                          <button 
                            onClick={() => setParticipants(Math.max(1, participants - 1))} 
                            className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:border-[#00c9a7] transition-colors"
                          >
                            -
                          </button>
                          <span className="min-w-[20px] text-center">{participants}</span>
                          <button 
                            onClick={() => setParticipants(Math.min(maxParticipants, participants + 1))} 
                            className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:border-[#00c9a7] transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-400 mt-2">Max {maxParticipants} personnes</p>
                    </div>
                  </div>

                  {/* Détails du prix */}
                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>{price.toLocaleString()} FCFA × {nights} jours</span>
                      <div className="text-right">
                        <div>{subtotalFormatted.fCFA}</div>
                        <div className="text-xs text-gray-400">{subtotalFormatted.euro}</div>
                      </div>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Frais de service</span>
                      <div className="text-right">
                        <div>{serviceFeeFormatted.fCFA}</div>
                        <div className="text-xs text-gray-400">{serviceFeeFormatted.euro}</div>
                      </div>
                    </div>
                    <div className="flex justify-between font-bold pt-2 border-t border-gray-200">
                      <span className="text-[#0F2940]">Total</span>
                      <div className="text-right">
                        <div className="text-[#00c9a7]">{totalFormatted.fCFA}</div>
                        <div className="text-xs font-normal text-gray-400">{totalFormatted.euro}</div>
                      </div>
                    </div>
                  </div>

                  {/* Bouton Réserver */}
                  <button 
                    onClick={handleReservationClick} 
                    disabled={availabilityStatus !== 'available'} 
                    className={`w-full py-3.5 rounded-xl font-semibold text-sm sm:text-base transition-all ${
                      availabilityStatus === 'available' 
                        ? 'bg-[#00c9a7] text-white hover:bg-[#00b892] shadow-lg hover:shadow-xl' 
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {availabilityStatus === 'available' ? 'Réserver' : availabilityStatus === 'idle' ? 'Sélectionnez des dates' : 'Non disponible'}
                  </button>

                  {/* Contacter l'hôte */}
                  <button
                    onClick={() => {
                      const params = new URLSearchParams();
                      params.set('experience', experience.id.toString());
                      params.set('check_in', checkIn);
                      params.set('check_out', checkOut);
                      params.set('participants', participants.toString());
                      
                      if (onNavigate) {
                        onNavigate({ 
                          name: 'messages', 
                          id: 'inquiry',
                          search: `?${params.toString()}`
                        });
                      } else {
                        window.location.href = `/messages/inquiry?${params.toString()}`;
                      }
                    }}
                    className="w-full mt-3 py-3 rounded-xl border-2 border-[#00c9a7] text-[#00c9a7] font-medium hover:bg-[#00c9a7]/5 transition flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Contacter l'hôte
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
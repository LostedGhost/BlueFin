import { useState, useEffect, useRef } from 'react';
import { Search, Menu, X, MapPin, Home, Star, Server, LogIn, Calendar, Globe, Sparkles, UserPlus, ChevronLeft, ChevronRight, Users, Plus, Minus, Baby, Dog, Info, LogOut } from 'lucide-react';
import type { Route } from '../router';
import Logo from '../assets/Bluefin Immo_01.jpg.jpeg';
import propertyService from '../../services/property.service';
import { useAuth } from '../../contexts/AuthContext';
import { ProfileMenu, UserAvatar, accountLinks } from './account/ProfileMenu';

const destinationsList = [
  "Abomey", "Abomey-Calavi", "Cotonou", "Porto-Novo", "Parakou", "Ouidah", "Grand-Popo",
  "Natitingou", "Kandi", "Lokossa", "Dogbo", "Bohicon", "Dassa-Zoumè", "Savalou", "Fidjrossè",
  "Haie Vive", "Ganhi", "Akpakpa", "Menontin", "Cadjèhoun", "Jéricho", "Saint-Michel"
];

interface Logement {
  id: number;
  title: string;
  city: string;
  price: number;
  images: string[];
}

interface NavbarProps {
  onGoHome: () => void;
  onNavigate?: (route: Route) => void;
  currentPage?: string;
  onSearch?: (searchParams: { destination: string; checkIn: string; checkOut: string; guests: number }) => void;
  onRealTimeSearch?: (city: string) => void;
  allLogements?: Logement[];
}

export function Navbar({
  onGoHome,
  onNavigate,
  currentPage,
  onSearch,
  onRealTimeSearch,
  allLogements = [],
}: NavbarProps) {
  // Session : un utilisateur connecté voit son avatar et son menu de compte
  // à la place de « S'inscrire » ; « Devenir hôte » reste proposé aux seuls
  // voyageurs (c'est une offre, pas un bouton de connexion).
  const { user, isAuthenticated, logout } = useAuth();
  const signedIn = Boolean(isAuthenticated && user);
  const showBecomeHost = !signedIn || (user?.user_type !== 'hote' && user?.user_type !== 'admin');
  // Même règle que la barre latérale (App.tsx) : sur grand écran, le logo y
  // est déjà affiché en tête.
  const logoInSidebar = signedIn && user?.user_type !== 'admin';
  const handleLogout = async () => {
    await logout();
    onNavigate?.({ name: 'home' });
  };
  const [menuOpen, setMenuOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [babies, setBabies] = useState(0);
  const [pets, setPets] = useState(0);
  const [activeTab, setActiveTab] = useState<"destination" | "dates" | "guests" | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [mobileSearchActive, setMobileSearchActive] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availableProperties, setAvailableProperties] = useState<any[]>([]);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const destinationPopupRef = useRef<HTMLDivElement>(null);
  const datesPopupRef = useRef<HTMLDivElement>(null);
  const guestsPopupRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const navItems = [
    { name: 'Logement', icon: Home, route: { name: 'home' } as Route, gradient: 'from-emerald-400 to-teal-500' },
    { name: 'Expérience', icon: Star, route: { name: 'experience' } as Route, gradient: 'from-amber-400 to-orange-500' },
    { name: 'Service', icon: Server, route: { name: 'services' } as Route, gradient: 'from-blue-400 to-indigo-500' },
  ];

  const isActive = (itemName: string) => {
    if (itemName === 'Logement' && currentPage === 'home') return true;
    if (itemName === 'Expérience' && currentPage === 'experience') return true;
    if (itemName === 'Service' && currentPage === 'services') return true;
    return false;
  };

  const checkAvailabilityByDates = async (city: string, checkInDate: string, checkOutDate: string, guestsCount: number) => {
    if (!checkInDate || !checkOutDate) {
      return null;
    }
    
    setIsCheckingAvailability(true);
    try {
      const response = await propertyService.getAll({
        city: city,
        check_in: checkInDate,
        check_out: checkOutDate,
        max_guests: guestsCount,
        per_page: 50
      });
      
      const properties = response?.data?.data || response?.data || [];
      setAvailableProperties(properties);
      return properties;
    } catch (error) {
      console.error('Erreur vérification disponibilité:', error);
      return null;
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const handleSearch = async () => {
    if (isSearching) return;
    
    setIsSearching(true);
    
    const totalGuests = adults + children + (babies > 0 ? 1 : 0);
    const finalGuests = totalGuests > 0 ? totalGuests : 1;
    
    const searchParams = {
      destination: destination,
      checkIn: checkIn,
      checkOut: checkOut,
      guests: finalGuests
    };
    
    console.log('🔍 Recherche complète avec disponibilité:', searchParams);
    
    if (checkIn && checkOut && destination) {
      const availableProps = await checkAvailabilityByDates(destination, checkIn, checkOut, finalGuests);
      
      if (availableProps && availableProps.length === 0) {
        console.log('❌ Aucune propriété disponible pour ces dates');
        if (onSearch) {
          onSearch({ ...searchParams, noResults: true });
        }
      } else if (availableProps && availableProps.length > 0) {
        console.log(`✅ ${availableProps.length} propriété(s) disponible(s) trouvée(s)`);
        if (onSearch) {
          onSearch(searchParams);
        }
      } else {
        if (onSearch) {
          onSearch(searchParams);
        }
      }
    } else {
      if (onSearch) {
        onSearch(searchParams);
      }
    }
    
    if (onRealTimeSearch && destination) {
      onRealTimeSearch(destination);
    }
    
    setActiveTab(null);
    setMobileSearchActive(false);
    
    setTimeout(() => {
      setIsSearching(false);
    }, 500);
  };

  const handleRealTimeSearch = (searchTerm: string) => {
    setDestination(searchTerm);
    
    if (searchTerm.trim() === "") {
      setSearchSuggestions([]);
      if (onRealTimeSearch) {
        onRealTimeSearch("");
      }
      return;
    }
    
    const matches = destinationsList.filter(city => 
      city.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setSearchSuggestions(matches.slice(0, 5));
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      if (onRealTimeSearch && searchTerm.trim() !== "") {
        onRealTimeSearch(searchTerm);
      } else if (onRealTimeSearch && searchTerm.trim() === "") {
        onRealTimeSearch("");
      }
    }, 300);
  };

  const selectSuggestion = (city: string) => {
    setDestination(city);
    setSearchSuggestions([]);
    setActiveTab(null);
    
    if (onRealTimeSearch) {
      onRealTimeSearch(city);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeTab === "destination" && destinationPopupRef.current && !destinationPopupRef.current.contains(event.target as Node)) {
        setActiveTab(null);
      }
      if (activeTab === "dates" && datesPopupRef.current && !datesPopupRef.current.contains(event.target as Node)) {
        setActiveTab(null);
      }
      if (activeTab === "guests" && guestsPopupRef.current && !guestsPopupRef.current.contains(event.target as Node)) {
        setActiveTab(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeTab]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const guestLabel = () => {
    const totalGuests = adults + children;
    const parts = [];
    
    if (totalGuests > 0) {
      parts.push(`${totalGuests} voyageur${totalGuests > 1 ? 's' : ''}`);
    }
    if (babies > 0) {
      parts.push(`${babies} bébé${babies > 1 ? 's' : ''}`);
    }
    if (pets > 0) {
      parts.push(`${pets} animal${pets > 1 ? 's' : ''}`);
    }
    
    if (parts.length === 0) return "Ajouter des voyageurs";
    return parts.join(" · ");
  };

  const dateLabel = () => {
    if (checkIn && checkOut) {
      return `${new Date(checkIn).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${new Date(checkOut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`;
    }
    if (checkIn) {
      return `${new Date(checkIn).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} → ?`;
    }
    return "Quand ?";
  };

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
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({ date: nextDate, isCurrentMonth: false });
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) return;
    
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

  const handleMobileSearch = async () => {
    if (isSearching) return;
    
    setIsSearching(true);
    
    const totalGuests = adults + children + (babies > 0 ? 1 : 0);
    const finalGuests = totalGuests > 0 ? totalGuests : 1;
    
    const searchParams = {
      destination: destination,
      checkIn: checkIn,
      checkOut: checkOut,
      guests: finalGuests
    };
    
    if (checkIn && checkOut && destination) {
      await checkAvailabilityByDates(destination, checkIn, checkOut, finalGuests);
    }
    
    if (onSearch) {
      onSearch(searchParams);
    }
    
    if (onRealTimeSearch && destination) {
      onRealTimeSearch(destination);
    }
    
    setMobileSearchActive(false);
    
    setTimeout(() => {
      setIsSearching(false);
    }, 500);
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-3 lg:py-4">
        
        {/* Première ligne - Logo et navigation */}
        <div className="flex items-center justify-between gap-4">
          {logoInSidebar && <span aria-hidden className="hidden lg:block w-px" />}
          <button onClick={onGoHome} className={`flex items-center gap-3 flex-shrink-0 group ${logoInSidebar ? 'lg:hidden' : ''}`}>
            <img src={Logo} alt="Logo" className="w-10 h-10 lg:w-12 lg:h-12 object-contain rounded-xl shadow-md group-hover:shadow-lg transition-all" />
            <div className="hidden sm:block">
              <div className="font-bold text-lg lg:text-xl text-[#0f2940]">Bluefin-Immo</div>
              <div className="text-xs text-[#00c9a7]">L'hébergement au Bénin</div>
            </div>
          </button>

          {/* Navigation Desktop */}
          <div className="hidden lg:flex items-center gap-2">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => onNavigate?.(item.route)}
                className={`px-4 py-2 rounded-full transition-all text-sm flex items-center gap-2
                  ${isActive(item.name) 
                    ? 'bg-gradient-to-r from-[#00c9a7] to-[#00b396] text-white shadow-md' 
                    : 'text-[#0f2940] hover:bg-gray-50'
                  }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </button>
            ))}
          </div>

          {/* Actions droite */}
          <div className="hidden lg:flex items-center gap-3">
            {showBecomeHost && (
              <button onClick={() => onNavigate?.({ name: 'become-host' })} className="px-5 py-2 rounded-full bg-[#0f2940] text-white text-sm hover:bg-[#1a3a52] transition">
                Devenir hôte
              </button>
            )}
            {signedIn && user ? (
              <ProfileMenu user={user} onNavigate={onNavigate} onLogout={handleLogout} />
            ) : (
              <button onClick={() => onNavigate?.({ name: 'auth', search: 'mode=signup' })} className="px-5 py-2 rounded-full border border-[#00c9a7] text-[#0f2940] text-sm flex items-center gap-2 hover:bg-[#00c9a7]/5 transition">
                <LogIn className="w-4 h-4" />
                S'inscrire
              </button>
            )}
          </div>

          {/* Mobile - Barre de recherche + Menu */}
          <div className="flex lg:hidden items-center gap-2 flex-1">
            {/* Barre de recherche mobile simplifiée */}
            <button
              onClick={() => setMobileSearchActive(true)}
              className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 shadow-sm hover:shadow-md transition-all"
            >
              <Search className="w-4 h-4 text-[#00c9a7] flex-shrink-0" />
              <span className="text-sm text-gray-600 truncate">
                {destination || "Où allez-vous ?"}
              </span>
            </button>
            
            <button 
              onClick={() => setMenuOpen(!menuOpen)} 
              className={`relative p-2.5 rounded-full transition-all duration-300 shadow-lg flex-shrink-0 ${
                menuOpen 
                  ? 'bg-gradient-to-r from-rose-400 to-red-500 shadow-rose-400/30' 
                  : 'bg-gradient-to-r from-[#0f2940] to-[#1a3a52] shadow-[#0f2940]/30'
              } hover:scale-105`}
            >
              {menuOpen ? (
                <X className="w-5 h-5 text-white transition-transform duration-300 rotate-90" />
              ) : (
                <Menu className="w-5 h-5 text-white transition-transform duration-300" />
              )}
            </button>
          </div>
        </div>

        {/* Barre de recherche Desktop */}
        <div className="hidden lg:flex justify-center mt-6" ref={searchRef}>
          <div className="bg-white rounded-full shadow-xl border border-gray-200 hover:shadow-2xl transition-all w-full max-w-3xl">
            <div className="flex items-center p-1">
              
              {/* Bouton Destination */}
              <div className="relative flex-[1.3]">
                <button
                  onClick={() => setActiveTab(activeTab === "destination" ? null : "destination")}
                  className={`w-full text-left px-5 py-3 rounded-full transition-all ${activeTab === "destination" ? "bg-gray-50" : "hover:bg-gray-50"}`}
                >
                  <div className="text-xs font-medium text-gray-500">Destination</div>
                  <div className="text-sm text-gray-900 truncate flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#00c9a7]" />
                    {destination || "Rechercher une destination"}
                  </div>
                </button>
                
                {/* Popup Destination */}
                {activeTab === "destination" && (
                  <div ref={destinationPopupRef} className="absolute top-full left-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">Où souhaitez-vous aller ?</h3>
                        <button onClick={() => setActiveTab(null)} className="p-1 rounded-full hover:bg-gray-100">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Rechercher une destination au Bénin"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00c9a7]"
                          value={destination}
                          onChange={(e) => handleRealTimeSearch(e.target.value)}
                          autoFocus
                        />
                        {destination && searchSuggestions.length === 0 && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="animate-pulse text-xs text-gray-400">Recherche...</div>
                          </div>
                        )}
                      </div>
                      
                      {searchSuggestions.length > 0 && (
                        <div className="mt-4 space-y-1 max-h-64 overflow-y-auto">
                          <div className="text-xs font-semibold text-gray-500 mb-2">Villes trouvées</div>
                          {searchSuggestions.map((place) => (
                            <button
                              key={place}
                              onClick={() => selectSuggestion(place)}
                              className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-sm flex items-center gap-2"
                            >
                              <MapPin className="w-4 h-4 text-[#00c9a7]" />
                              <span>{place}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {!destination && (
                        <div className="mt-4 space-y-1 max-h-64 overflow-y-auto">
                          <div className="text-xs font-semibold text-gray-500 mb-2">Destinations populaires</div>
                          {destinationsList.slice(0, 10).map((place) => (
                            <button
                              key={place}
                              onClick={() => selectSuggestion(place)}
                              className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-sm"
                            >
                              {place}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="w-px h-8 bg-gray-200"></div>

              {/* Bouton Dates */}
              <div className="relative flex-1">
                <button
                  onClick={() => setActiveTab(activeTab === "dates" ? null : "dates")}
                  className={`w-full text-left px-5 py-3 rounded-full transition-all ${activeTab === "dates" ? "bg-gray-50" : "hover:bg-gray-50"}`}
                >
                  <div className="text-xs font-medium text-gray-500">Dates</div>
                  <div className="text-sm text-gray-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#00c9a7]" />
                    {dateLabel()}
                  </div>
                </button>
                
                {activeTab === "dates" && (
                  <div ref={datesPopupRef} className="absolute top-full left-0 mt-2 w-[640px] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50">
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">Sélectionnez vos dates</h3>
                        <button onClick={() => setActiveTab(null)} className="p-1 rounded-full hover:bg-gray-100">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between mb-4">
                        <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-100">
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="font-semibold text-base">
                          {currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                        </span>
                        <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-100">
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {weekDays.map(day => (
                          <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">{day}</div>
                        ))}
                      </div>
                      
                      <div className="grid grid-cols-7 gap-1">
                        {days.map((day, index) => {
                          const isSelected = isDateSelected(day.date);
                          const inRange = isInRange(day.date);
                          const isToday = day.date.toDateString() === new Date().toDateString();
                          const isPast = day.date < new Date(new Date().setHours(0, 0, 0, 0));
                          
                          return (
                            <button
                              key={index}
                              onClick={() => !isPast && handleDateSelect(day.date)}
                              disabled={isPast}
                              className={`relative aspect-square rounded-full text-sm transition-all
                                ${isPast && 'text-gray-300 cursor-not-allowed'}
                                ${!day.isCurrentMonth && !isPast && 'text-gray-300'}
                                ${isSelected && 'bg-[#00c9a7] text-white shadow-md'}
                                ${inRange && !isSelected && 'bg-[#00c9a7]/10'}
                                ${isToday && !isSelected && !inRange && !isPast && 'border-2 border-[#00c9a7]'}
                                ${!isSelected && !inRange && !isPast && day.isCurrentMonth && 'hover:bg-gray-100'}`}
                            >
                              {day.date.getDate()}
                            </button>
                          );
                        })}
                      </div>
                      
                      <div className="mt-5 pt-4 border-t border-gray-100 flex justify-between">
                        <button 
                          onClick={() => { setCheckIn(""); setCheckOut(""); }}
                          className="text-sm text-gray-500 hover:text-[#00c9a7] transition"
                        >
                          Effacer les dates
                        </button>
                        <button 
                          onClick={() => setActiveTab(null)} 
                          className="px-5 py-2 bg-[#00c9a7] text-white rounded-lg text-sm font-medium hover:bg-[#00b396] transition"
                        >
                          Valider
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="w-px h-8 bg-gray-200"></div>

              {/* Bouton Voyageurs */}
              <div className="relative flex-1">
                <button
                  onClick={() => setActiveTab(activeTab === "guests" ? null : "guests")}
                  className={`w-full text-left px-5 py-3 rounded-full transition-all ${activeTab === "guests" ? "bg-gray-50" : "hover:bg-gray-50"}`}
                >
                  <div className="text-xs font-medium text-gray-500">Voyageurs</div>
                  <div className="text-sm text-gray-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#00c9a7]" />
                    {guestLabel()}
                  </div>
                </button>
                
                {activeTab === "guests" && (
                  <div ref={guestsPopupRef} className="absolute top-full right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50">
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">Voyageurs</h3>
                        <button onClick={() => setActiveTab(null)} className="p-1 rounded-full hover:bg-gray-100">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="space-y-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">Adultes</p>
                            <p className="text-xs text-gray-500">13 ans et plus</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <button onClick={() => setAdults(Math.max(1, adults - 1))} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-[#00c9a7] hover:bg-[#00c9a7]/5 transition">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center text-base font-medium">{adults}</span>
                            <button onClick={() => setAdults(adults + 1)} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-[#00c9a7] hover:bg-[#00c9a7]/5 transition">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">Enfants</p>
                            <p className="text-xs text-gray-500">De 2 à 12 ans</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <button onClick={() => setChildren(Math.max(0, children - 1))} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-[#00c9a7] hover:bg-[#00c9a7]/5 transition">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center text-base font-medium">{children}</span>
                            <button onClick={() => setChildren(children + 1)} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-[#00c9a7] hover:bg-[#00c9a7]/5 transition">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm flex items-center gap-2">
                              <Baby className="w-4 h-4 text-[#00c9a7]" />
                              Bébés
                            </p>
                            <p className="text-xs text-gray-500">Moins de 2 ans</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <button onClick={() => setBabies(Math.max(0, babies - 1))} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-[#00c9a7] hover:bg-[#00c9a7]/5 transition">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center text-base font-medium">{babies}</span>
                            <button onClick={() => setBabies(babies + 1)} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-[#00c9a7] hover:bg-[#00c9a7]/5 transition">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm flex items-center gap-2">
                              <Dog className="w-4 h-4 text-[#00c9a7]" />
                              Animaux domestiques
                            </p>
                            <p className="text-xs text-gray-500">Vous voyagez avec un animal ?</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <button onClick={() => setPets(Math.max(0, pets - 1))} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-[#00c9a7] hover:bg-[#00c9a7]/5 transition">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center text-base font-medium">{pets}</span>
                            <button onClick={() => setPets(pets + 1)} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-[#00c9a7] hover:bg-[#00c9a7]/5 transition">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-start gap-2">
                        <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-blue-700">
                          Les bébés et animaux n'affectent pas le nombre total de voyageurs mais sont pris en compte par certains hôtes.
                        </p>
                      </div>
                      
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <button onClick={() => setActiveTab(null)} className="w-full bg-[#00c9a7] text-white py-2.5 rounded-lg font-medium hover:bg-[#00b396] transition">
                          Valider
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bouton Rechercher */}
              <button 
                onClick={handleSearch}
                disabled={isSearching || isCheckingAvailability}
                className="bg-gradient-to-r from-[#00c9a7] to-[#00a887] text-white px-6 py-3 rounded-full flex items-center gap-2 hover:shadow-lg transition-all ml-1 font-medium disabled:opacity-50"
              >
                {isCheckingAvailability ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span>{isCheckingAvailability ? 'Vérification...' : (isSearching ? 'Recherche...' : 'Rechercher')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search Modal */}
      {mobileSearchActive && (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
          <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
            <button onClick={() => setMobileSearchActive(false)} className="p-2 rounded-full hover:bg-gray-100">
              <X className="w-5 h-5" />
            </button>
            <h2 className="font-semibold text-[#0F2940]">Rechercher</h2>
            <div className="w-10"></div>
          </div>
          
          <div className="p-4 space-y-5 pb-20">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Destination</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => handleRealTimeSearch(e.target.value)}
                  placeholder="Où allez-vous ?"
                  className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00c9a7]"
                  autoFocus
                />
              </div>
              
              {searchSuggestions.length > 0 && (
                <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                  {searchSuggestions.map((place) => (
                    <button
                      key={place}
                      onClick={() => selectSuggestion(place)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-sm flex items-center gap-2"
                    >
                      <MapPin className="w-4 h-4 text-[#00c9a7]" />
                      <span>{place}</span>
                    </button>
                  ))}
                </div>
              )}
              
              {!destination && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-gray-500 mt-2">Destinations populaires</p>
                  {destinationsList.slice(0, 5).map((place) => (
                    <button
                      key={place}
                      onClick={() => selectSuggestion(place)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      {place}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Dates</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm"
                    placeholder="Arrivée"
                  />
                  <p className="text-xs text-gray-400 mt-1">Arrivée</p>
                </div>
                <div>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    min={checkIn || new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm"
                    placeholder="Départ"
                  />
                  <p className="text-xs text-gray-400 mt-1">Départ</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Voyageurs</label>
              <div className="space-y-4 bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Adultes</p>
                    <p className="text-xs text-gray-500">13 ans et plus</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={() => setAdults(Math.max(1, adults - 1))} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center bg-white">-</button>
                    <span className="w-8 text-center text-base font-medium">{adults}</span>
                    <button onClick={() => setAdults(adults + 1)} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center bg-white">+</button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Enfants</p>
                    <p className="text-xs text-gray-500">De 2 à 12 ans</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={() => setChildren(Math.max(0, children - 1))} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center bg-white">-</button>
                    <span className="w-8 text-center text-base font-medium">{children}</span>
                    <button onClick={() => setChildren(children + 1)} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center bg-white">+</button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm flex items-center gap-2">
                      <Baby className="w-4 h-4 text-[#00c9a7]" />
                      Bébés
                    </p>
                    <p className="text-xs text-gray-500">Moins de 2 ans</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={() => setBabies(Math.max(0, babies - 1))} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center bg-white">-</button>
                    <span className="w-8 text-center text-base font-medium">{babies}</span>
                    <button onClick={() => setBabies(babies + 1)} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center bg-white">+</button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm flex items-center gap-2">
                      <Dog className="w-4 h-4 text-[#00c9a7]" />
                      Animaux
                    </p>
                    <p className="text-xs text-gray-500">Vous voyagez avec un animal ?</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={() => setPets(Math.max(0, pets - 1))} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center bg-white">-</button>
                    <span className="w-8 text-center text-base font-medium">{pets}</span>
                    <button onClick={() => setPets(pets + 1)} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center bg-white">+</button>
                  </div>
                </div>
              </div>
            </div>

            <button onClick={handleMobileSearch} disabled={isSearching || isCheckingAvailability} className="w-full bg-gradient-to-r from-[#00c9a7] to-[#00a887] text-white py-3.5 rounded-xl font-semibold shadow-lg disabled:opacity-50">
              {isCheckingAvailability ? 'Vérification...' : (isSearching ? 'Recherche...' : 'Rechercher')}
            </button>
          </div>
        </div>
      )}

      {/* Mobile Menu - Version slide droite→gauche */}
      {menuOpen && (
        <>
          <div className="lg:hidden fixed inset-y-0 right-0 w-80 bg-white shadow-2xl z-50 overflow-y-auto animate-slideInRight">
            {/* Bouton de fermeture */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">B</span>
                </div>
                <span className="font-semibold text-sm text-[#0f2940]">Menu</span>
              </div>
              <button 
                onClick={() => setMenuOpen(false)} 
                className="p-2 rounded-full hover:bg-gray-100 transition-all duration-300 hover:rotate-90"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Contenu du menu */}
            <div className="p-4 space-y-1">
              {navItems.map((item) => (
                <button 
                  key={item.name} 
                  onClick={() => { onNavigate?.(item.route); setMenuOpen(false); }} 
                  className={`w-full text-left py-3 px-4 rounded-xl flex items-center gap-3 transition-all duration-200 ${
                    isActive(item.name)
                      ? `bg-gradient-to-r ${item.gradient} text-white shadow-md`
                      : 'hover:bg-gray-50 text-[#0f2940]'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive(item.name) ? 'text-white' : 'text-gray-500'}`} />
                  <span className="font-medium text-sm">{item.name}</span>
                  {isActive(item.name) && (
                    <span className="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full">•</span>
                  )}
                </button>
              ))}
              
              <div className="h-px bg-gray-100 my-3"></div>

              {signedIn && user && (
                <div className="mb-2">
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#f4fffe]">
                    <UserAvatar user={user} size={40} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#0f2940] truncate">{user.first_name} {user.last_name}</p>
                      <p className="text-xs text-emerald-600">Connecté</p>
                    </div>
                  </div>
                  {accountLinks(user).map(({ label, icon: Icon, route }) => (
                    <button key={label} onClick={() => { onNavigate?.(route); setMenuOpen(false); }}
                      className="w-full text-left py-3 px-4 rounded-xl flex items-center gap-3 hover:bg-gray-50 text-[#0f2940]">
                      <Icon className="w-5 h-5 text-gray-500" />
                      <span className="font-medium text-sm">{label}</span>
                    </button>
                  ))}
                </div>
              )}

              {showBecomeHost && (
              <button 
                onClick={() => { onNavigate?.({ name: 'become-host' }); setMenuOpen(false); }} 
                className="w-full bg-[#0f2940] text-white py-3 rounded-xl text-center font-medium text-sm hover:bg-[#1a3a52] transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Devenir hôte
              </button>
              )}

              {signedIn ? (
                <button
                  onClick={() => { setMenuOpen(false); handleLogout(); }}
                  className="w-full mt-2 py-3 rounded-xl text-center font-medium text-sm flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 transition-all duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  Se déconnecter
                </button>
              ) : (
              <button 
                onClick={() => { onNavigate?.({ name: 'auth', search: 'mode=signup' }); setMenuOpen(false); }} 
                className="w-full border border-emerald-400 py-3 rounded-xl text-center font-medium text-sm flex items-center justify-center gap-2 hover:bg-emerald-50 transition-all duration-200 text-[#0f2940]"
              >
                <UserPlus className="w-4 h-4 text-emerald-500" />
                S'inscrire
              </button>
              )}
            </div>
          </div>

          {/* Overlay sombre */}
          <div 
            className="lg:hidden fixed inset-0 bg-black/30 z-40 animate-fadeIn"
            onClick={() => setMenuOpen(false)}
          />
        </>
      )}

      <style>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slideInRight {
          animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease forwards;
        }

        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </nav>
  );
}
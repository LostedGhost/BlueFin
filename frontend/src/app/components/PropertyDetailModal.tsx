import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Share2, Heart, Star, Crown, Award, Check, 
  Sparkles, Calendar, Bed, Bath, Filter, ChevronDown, X 
} from 'lucide-react';

interface PropertyDetailModalBookingParams {
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  nationality: string;
  idType: string;
  idNumber: string;
  paymentOption: '50' | '100';
  totalAmount: number;
  paymentAmount: number;
}

interface HotelProperty {
  id: number;
  title: string;
  location: string;
  price: number;
  priceNumber: number;
  priceDisplay: string;
  rating: number;
  reviews: number;
  image: string;
  images?: string[];
  beds: number;
  baths: number;
  description: string;
  longDescription?: string;
  amenities: string[];
  host: string;
  hostImage?: string;
  hostSince?: string;
  hostId?: any;
  superhost?: boolean;
  responseRate?: number;
  responseTime?: string;
  property_type?: string;
  bluefin_certified?: boolean;
  has_generator?: boolean;
  has_wifi?: boolean;
  has_air_conditioning?: boolean;
  has_water_tank?: boolean;
  cancellation_policy?: string;
  instant_booking?: boolean;
  check_in_time?: string;
  check_out_time?: string;
  max_guests?: number;
  bedrooms?: number;
  min_stay?: number;
  status?: string;
  status_label?: string;
  status_color?: string;
  rejection_reason?: string;
}

interface PropertyDetailModalProps {
  property: HotelProperty;
  onClose: () => void;
  onReserve: (bookingParams: PropertyDetailModalBookingParams) => void;
  onChat?: (hostId: any) => void;
}

export const PropertyDetailModal: React.FC<PropertyDetailModalProps> = ({ 
  property, 
  onClose, 
  onReserve, 
  onChat 
}) => {
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [checkIn, setCheckIn] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const [checkOut, setCheckOut] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
  });
  const [guests, setGuests] = useState(1);
  const [selectedPriceOption, setSelectedPriceOption] = useState<"non-remboursable" | "remboursable">("non-remboursable");
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [animate, setAnimate] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedCheckInDate, setSelectedCheckInDate] = useState<Date | null>(null);
  const [selectedCheckOutDate, setSelectedCheckOutDate] = useState<Date | null>(null);
  const [calendarStart, setCalendarStart] = useState(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  });

  // États du formulaire
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [nationality, setNationality] = useState('');
  const [idType, setIdType] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [paymentOption, setPaymentOption] = useState<'50' | '100'>('50');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const formatDisplayDate = (date: Date) => `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  const formatIsoDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const formatDisplayFromIso = (isoDate: string) => {
    if (!isoDate) return '';
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
  };

  const handleDateSelect = (date: Date) => {
    if (!selectedCheckInDate || (selectedCheckInDate && selectedCheckOutDate)) {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      setSelectedCheckInDate(date);
      setSelectedCheckOutDate(nextDay);
      setCheckIn(formatIsoDate(date));
      setCheckOut(formatIsoDate(nextDay));
      return;
    }

    if (selectedCheckInDate && date <= selectedCheckInDate) {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      setSelectedCheckInDate(date);
      setSelectedCheckOutDate(nextDay);
      setCheckIn(formatIsoDate(date));
      setCheckOut(formatIsoDate(nextDay));
      return;
    }

    setSelectedCheckOutDate(date);
    setCheckOut(formatIsoDate(date));
  };

  const calendarDays = Array.from({ length: 35 }, (_, index) => {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);
    return date;
  });

  const isSelectedDay = (date: Date) => {
    if (!selectedCheckInDate) return false;
    if (selectedCheckInDate && !selectedCheckOutDate) {
      return date.getTime() === selectedCheckInDate.getTime();
    }
    return (
      date.getTime() === selectedCheckInDate.getTime() ||
      date.getTime() === selectedCheckOutDate?.getTime() ||
      (selectedCheckOutDate && date > selectedCheckInDate && date < selectedCheckOutDate)
    );
  };

  const effectiveCheckInDate = selectedCheckInDate || new Date(checkIn);
  const effectiveCheckOutDate = selectedCheckOutDate || new Date(checkOut);
  const nights = Math.max(1, Math.ceil((effectiveCheckOutDate.getTime() - effectiveCheckInDate.getTime()) / (1000 * 60 * 60 * 24)));

  // Générer des images variées
  const getPropertyImages = (property: HotelProperty): string[] => {
    if (property.images && Array.isArray(property.images) && property.images.length > 0) {
      return property.images;
    }
    
    const baseImage = property.image;
    const imageVariants = [
      baseImage,
      property.property_type === 'Villa' ? 'https://images.unsplash.com/photo-1613977257363-707ba9347c6c?w=800&q=80' :
      property.property_type === 'Appartement' ? 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80' :
      property.property_type === 'Studio' ? 'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=800&q=80' :
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
    ];
    
    const uniqueImages = [...new Set(imageVariants)];
    while (uniqueImages.length < 5) {
      uniqueImages.push(baseImage);
    }
    
    return uniqueImages.slice(0, 5);
  };

  const images = getPropertyImages(property);
  const nightlyPrice = property.priceNumber || property.price || 0;
  
  const host = property.host || 'Hôte vérifié';
  const hostAvatarUrl = property.hostImage || `https://ui-avatars.com/api/?background=00c9a7&color=fff&name=${encodeURIComponent(host)}&bold=true&size=128`;
  const hostSince = property.hostSince || "1 an";
  const superhost = property.superhost ?? true;
  const hostId = property.hostId ?? property.id;
  const responseRate = property.responseRate || 95;
  const responseTime = property.responseTime || "dans l'heure";
  const longDescription = property.longDescription || property.description;
  const amenities = property.amenities || ["Wifi", "Climatisation", "TV", "Parking", "Eau chaude", "Petit déjeuner"];
  const testimonials = [
    { name: "Marie", date: "mars 2026", text: "Excellent séjour, hôtel magnifique !", rating: 5 },
    { name: "Jean", date: "février 2026", text: "Très bien situé, personnel accueillant.", rating: 4.8 },
    { name: "Sophie", date: "janvier 2026", text: "Je recommande vivement, rapport qualité-prix exceptionnel.", rating: 4.9 }
  ];

  const subtotal = nightlyPrice * nights;
  const cleaningFee = 15000;
  const serviceFee = 12000;
  const total = subtotal + cleaningFee + serviceFee;
  const totalWithoutFees = nightlyPrice * nights;
  
  const getPaymentAmount = () => {
    if (paymentOption === '50') return Math.floor(total * 0.5);
    return total;
  };

  // Validation du formulaire
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!fullName.trim()) errors.fullName = 'Nom complet requis';
    if (!email.trim()) errors.email = 'Email requis';
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'Email invalide';
    if (!phone.trim()) errors.phone = 'Téléphone requis';
    if (!nationality) errors.nationality = 'Nationalité requise';
    if (!idType) errors.idType = 'Type de pièce d\'identité requis';
    if (!idNumber.trim()) errors.idNumber = 'Numéro de pièce d\'identité requis';
    if (!checkIn) errors.checkIn = 'Date d\'arrivée requise';
    if (!checkOut) errors.checkOut = 'Date de départ requise';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleConfirmReservation = () => {
    if (!validateForm()) return;
    
    const bookingParams: PropertyDetailModalBookingParams = {
      checkIn,
      checkOut,
      guests,
      nights,
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      nationality,
      idType,
      idNumber: idNumber.trim(),
      paymentOption,
      totalAmount: total,
      paymentAmount: getPaymentAmount()
    };
    
    onReserve(bookingParams);
  };

  const handleReserveClick = () => {
    setShowBookingForm(true);
  };

  const handleBackToDetails = () => {
    setShowBookingForm(false);
  };

  useEffect(() => {
    if (testimonials.length <= 1) return;
    const interval = setInterval(() => {
      setAnimate(true);
      setTimeout(() => {
        setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
        setAnimate(false);
      }, 300);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  // Format date pour l'affichage
  const formattedCheckIn = formatDisplayFromIso(checkIn);
  const formattedCheckOut = formatDisplayFromIso(checkOut);

  // Si le formulaire de réservation est affiché
  if (showBookingForm) {
    return (
      <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center gap-4">
            <button onClick={handleBackToDetails} className="p-2 rounded-full hover:bg-gray-100 transition-all">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold text-[#0F2940]">Réserver cet appartement</h1>
          </div>

          <div className="max-w-2xl mx-auto px-4 py-6">
            {/* Appartement info */}
            <div className="bg-white rounded-xl p-4 mb-6 shadow-sm">
              <h2 className="font-semibold text-lg text-[#0F2940]">{property.title}</h2>
              <p className="text-gray-500 text-sm mt-1">{property.location}</p>
              <div className="flex items-center gap-2 mt-2">
                <Star className="w-4 h-4 fill-[#00c9a7] text-[#00c9a7]" />
                <span className="text-sm font-medium">{property.rating}</span>
                <span className="text-gray-400">·</span>
                <span className="text-sm text-gray-500">{property.reviews} commentaires</span>
              </div>
            </div>

            {/* Formulaire */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              {/* Informations personnelles */}
              <div className="mb-6">
                <h3 className="font-semibold text-[#0F2940] mb-4 pb-2 border-b">📋 Informations personnelles</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom complet <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#00c9a7] focus:border-transparent ${formErrors.fullName ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Jean Dupont"
                    />
                    {formErrors.fullName && <p className="text-red-500 text-xs mt-1">{formErrors.fullName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#00c9a7] focus:border-transparent ${formErrors.email ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="jean.dupont@email.com"
                    />
                    {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Téléphone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#00c9a7] focus:border-transparent ${formErrors.phone ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="+229 97 00 00 00"
                    />
                    {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00c9a7] focus:border-transparent"
                      placeholder="Votre adresse complète"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nationalité <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={nationality}
                      onChange={(e) => setNationality(e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#00c9a7] focus:border-transparent ${formErrors.nationality ? 'border-red-500' : 'border-gray-300'}`}
                    >
                      <option value="">Sélectionnez...</option>
                      <option value="beninoise">Béninoise</option>
                      <option value="francaise">Française</option>
                      <option value="canadienne">Canadienne</option>
                      <option value="americaine">Américaine</option>
                      <option value="autre">Autre</option>
                    </select>
                    {formErrors.nationality && <p className="text-red-500 text-xs mt-1">{formErrors.nationality}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type de pièce d'identité <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={idType}
                      onChange={(e) => setIdType(e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#00c9a7] focus:border-transparent ${formErrors.idType ? 'border-red-500' : 'border-gray-300'}`}
                    >
                      <option value="">Sélectionnez...</option>
                      <option value="cni">Carte Nationale d'Identité</option>
                      <option value="passeport">Passeport</option>
                      <option value="permis">Permis de conduire</option>
                      <option value="sejour">Titre de séjour</option>
                    </select>
                    {formErrors.idType && <p className="text-red-500 text-xs mt-1">{formErrors.idType}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Numéro de pièce d'identité <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#00c9a7] focus:border-transparent ${formErrors.idNumber ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Numéro du document"
                    />
                    {formErrors.idNumber && <p className="text-red-500 text-xs mt-1">{formErrors.idNumber}</p>}
                  </div>
                </div>
              </div>

              {/* Dates de séjour */}
              <div className="mb-6">
                <h3 className="font-semibold text-[#0F2940] mb-4 pb-2 border-b">📅 Dates de séjour</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date d'arrivée <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#00c9a7] focus:border-transparent ${formErrors.checkIn ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {formErrors.checkIn && <p className="text-red-500 text-xs mt-1">{formErrors.checkIn}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date de départ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      min={checkIn}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#00c9a7] focus:border-transparent ${formErrors.checkOut ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {formErrors.checkOut && <p className="text-red-500 text-xs mt-1">{formErrors.checkOut}</p>}
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  {nights} nuit{nights > 1 ? 's' : ''} · {nightlyPrice.toLocaleString()} FCFA / nuit
                </div>
              </div>

              {/* Options de paiement */}
              <div className="mb-6">
                <h3 className="font-semibold text-[#0F2940] mb-4 pb-2 border-b">💰 Options de paiement</h3>
                
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Total du séjour:</span>
                    <span className="text-2xl font-bold text-[#0F2940]">{total.toLocaleString()} FCFA</span>
                  </div>
                  <div className="text-sm text-gray-500 space-y-1">
                    <div className="flex justify-between">
                      <span>{nightlyPrice.toLocaleString()} FCFA × {nights} nuits</span>
                      <span>{subtotal.toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Frais de ménage</span>
                      <span>{cleaningFee.toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Frais de service</span>
                      <span>{serviceFee.toLocaleString()} FCFA</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div 
                    className={`border rounded-xl p-4 cursor-pointer transition-all ${paymentOption === '50' ? 'border-[#00c9a7] bg-[#00c9a7]/5 shadow-md' : 'border-gray-200'}`}
                    onClick={() => setPaymentOption('50')}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-[#0F2940]">💳 Payer 50% maintenant</div>
                        <div className="text-sm text-gray-500">Solde à payer à l'arrivée</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-[#00c9a7]">{Math.floor(total * 0.5).toLocaleString()} FCFA</div>
                        <div className="text-xs text-gray-400">Total: {total.toLocaleString()} FCFA</div>
                      </div>
                    </div>
                  </div>

                  <div 
                    className={`border rounded-xl p-4 cursor-pointer transition-all ${paymentOption === '100' ? 'border-[#00c9a7] bg-[#00c9a7]/5 shadow-md' : 'border-gray-200'}`}
                    onClick={() => setPaymentOption('100')}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-[#0F2940]">🔒 Payer 100% maintenant</div>
                        <div className="text-sm text-gray-500">Paiement complet sécurisé</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-[#00c9a7]">{total.toLocaleString()} FCFA</div>
                        <div className="text-xs text-gray-400">Paiement unique</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="sticky bottom-0 bg-white border-t mt-6 px-4 py-4 -mx-4">
              <div className="max-w-2xl mx-auto flex gap-3">
                <button
                  onClick={handleBackToDetails}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmReservation}
                  className="flex-1 px-4 py-3 bg-[#00c9a7] text-[#0F2940] rounded-xl font-bold hover:bg-[#00b892] transition-all transform hover:scale-105 shadow-md"
                >
                  Confirmer la réservation
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vue détaillée de l'appartement (sans formulaire)
  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      <div className="min-h-screen">
        <div className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex justify-between items-center">
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-all hover:scale-110">
            <ArrowLeft className="w-5 h-5"/>
          </button>
          <div className="flex gap-2">
            <button className="p-2 rounded-full hover:bg-gray-100 transition-all hover:scale-110">
              <Share2 className="w-5 h-5"/>
            </button>
            <button className="p-2 rounded-full hover:bg-gray-100 transition-all hover:scale-110">
              <Heart className="w-5 h-5"/>
            </button>
          </div>
        </div>
        
        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Galerie d'images */}
          <div className="relative grid grid-cols-4 gap-2 rounded-2xl overflow-hidden mb-6 group">
            <div className="col-span-2 row-span-2 overflow-hidden cursor-pointer" onClick={() => setSelectedImageIndex(0)}>
              <img 
                src={images[0]} 
                alt={property.title} 
                className="w-full h-full object-cover min-h-[300px] transition-transform duration-700 group-hover:scale-105" 
              />
            </div>
            {images.slice(1, 5).map((img, i) => (
              <div key={i} className="overflow-hidden cursor-pointer" onClick={() => setSelectedImageIndex(i + 1)}>
                <img 
                  src={img} 
                  alt={`${property.title} - ${i + 2}`} 
                  className="w-full h-36 object-cover transition-transform duration-700 group-hover:scale-105" 
                />
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Colonne de gauche - Informations */}
            <div className="lg:col-span-2 space-y-8">
              <div className="border-b pb-4">
                <div className="text-sm text-gray-500">
                  {property.property_type || 'Logement'} · {property.beds} chambres · {property.beds} lits · {property.baths} sdb
                </div>
                <h1 className="text-3xl font-semibold text-[#0F2940] mt-2">{property.title}</h1>
                <div className="flex items-center gap-2 mt-2">
                  <Star className="w-5 h-5 fill-current text-[#00c9a7]" />
                  <span className="font-medium">{property.rating}</span>
                  <span className="text-gray-500">· {property.reviews} commentaires</span>
                  {superhost && <span className="text-[#00c9a7] font-medium">· Superhôte</span>}
                </div>
              </div>

              {/* Badge coup de cœur */}
              {property.rating >= 4.8 && (
                <div className="bg-[#00c9a7]/10 rounded-xl p-5 flex gap-4 items-center">
                  <Crown className="w-10 h-10 text-[#00c9a7]" />
                  <div>
                    <div className="font-semibold text-lg text-[#0F2940]">Coup de cœur · voyageurs</div>
                    <div className="text-gray-600">Un des logements préférés des voyageurs au Bénin</div>
                  </div>
                </div>
              )}

              {/* Informations hôte */}
              <div className="flex gap-5 items-start">
                <img 
                  src={hostAvatarUrl}
                  alt={host} 
                  className="w-16 h-16 rounded-full object-cover border-2 border-[#00c9a7] shadow-lg" 
                />
                <div>
                  <div className="font-semibold text-xl text-[#0F2940]">Hôte : {host}</div>
                  {superhost && (
                    <div className="flex items-center gap-1 text-[#00c9a7]">
                      <Award className="w-4 h-4"/>Superhôte · {hostSince}
                    </div>
                  )}
                  <div className="text-sm text-gray-600">
                    Taux de réponse {responseRate}% · Répond {responseTime}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="text-gray-700 leading-relaxed">{property.description}</p>
                {longDescription && longDescription !== property.description && (
                  <p className="text-gray-700 mt-3 leading-relaxed">{longDescription}</p>
                )}
              </div>

              {/* Équipements */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-xl text-[#0F2940]">Équipements</h3>
                  <button onClick={() => setShowAllAmenities(!showAllAmenities)} className="text-[#00c9a7] text-sm underline">
                    Voir tout
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {(showAllAmenities ? amenities : amenities.slice(0, 6)).map((a, i) => (
                    <div key={i} className="flex items-center gap-3 text-gray-700">
                      <Check className="w-5 h-5 text-[#00c9a7]"/>{a}
                    </div>
                  ))}
                </div>
              </div>

              {/* Témoignages */}
              <div className="bg-gradient-to-r from-[#0F2940]/5 to-[#00c9a7]/5 rounded-2xl p-6">
                <h3 className="font-semibold text-xl text-[#0F2940] mb-4 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-[#00c9a7]" />
                  Ce que nos clients disent
                </h3>
                <div className={`transition-all duration-300 transform ${animate ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="relative">
                      <img 
                        src={`https://ui-avatars.com/api/?background=00c9a7&color=fff&name=${testimonials[currentTestimonial]?.name?.charAt(0) || 'U'}`} 
                        alt={testimonials[currentTestimonial]?.name || "Client"}
                        className="w-20 h-20 rounded-full object-cover border-4 border-[#00c9a7] shadow-xl" 
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <span className="font-bold text-lg text-[#0F2940]">{testimonials[currentTestimonial]?.name || "Client"}</span>
                        <span className="text-sm text-gray-500">{testimonials[currentTestimonial]?.date || "récemment"}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < Math.floor(testimonials[currentTestimonial]?.rating || 5) ? 'fill-current text-[#00c9a7]' : 'text-gray-300'}`} />
                        ))}
                      </div>
                      <p className="text-gray-700 mt-3 leading-relaxed">"{testimonials[currentTestimonial]?.text || "Excellent séjour !"}"</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Colonne de droite - Carte de réservation */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 border rounded-2xl p-6 shadow-xl bg-white">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <span className="text-3xl font-bold text-[#0F2940]">{nightlyPrice.toLocaleString()} FCFA</span>
                    <span className="text-gray-500"> / nuit</span>
                  </div>
                  <div className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full">
                    <Star className="w-4 h-4 fill-current text-[#00c9a7]"/>{property.rating}
                  </div>
                </div>

                <div className="border rounded-xl mb-5 overflow-hidden">
                  <div className="flex">
                    <div className="flex-1 p-3 border-r">
                      <div className="text-xs font-bold text-gray-500 uppercase">Arrivée</div>
                      <div className="font-medium">{formattedCheckIn || 'Sélectionner'}</div>
                    </div>
                    <div className="flex-1 p-3">
                      <div className="text-xs font-bold text-gray-500 uppercase">Départ</div>
                      <div className="font-medium">{formattedCheckOut || 'Sélectionner'}</div>
                    </div>
                  </div>
                  <div className="p-3 border-t">
                    <div className="text-xs font-bold text-gray-500 uppercase">Voyageurs</div>
                    <div className="font-medium">{guests} adulte{guests > 1 ? 's' : ''}</div>
                  </div>
                </div>

                <div className="space-y-2 mb-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{nightlyPrice.toLocaleString()} FCFA × {nights} nuits</span>
                    <span>{subtotal.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Frais de ménage</span>
                    <span>{cleaningFee.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Frais de service</span>
                    <span>{serviceFee.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between font-bold pt-2 border-t">
                    <span>Total</span>
                    <span className="text-[#00c9a7]">{total.toLocaleString()} FCFA</span>
                  </div>
                </div>

                <button 
                  onClick={handleReserveClick}
                  className="w-full bg-[#00c9a7] text-[#0F2940] py-3 rounded-xl font-bold text-lg hover:bg-[#00b892] transition-all hover:scale-105 transform shadow-md"
                >
                  Réserver
                </button>

                {onChat && hostId && (
                  <button
                    onClick={() => onChat(hostId)}
                    className="w-full mt-3 bg-[#0F76F4] text-white py-3 rounded-xl font-bold text-lg hover:bg-[#0d6ad0] transition-all shadow-md"
                  >
                    Discuter avec l'hôte
                  </button>
                )}
                <p className="text-center text-xs text-gray-500 mt-3">Aucun débit pour le moment</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
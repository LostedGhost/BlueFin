// components/MobileBookingSheet.tsx
import { X, Calendar, Users, Minus, Plus, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import propertyService from '../../services/property.service';
import bookingService from '../../services/booking.service';
import { useAuth } from '../hooks/useAuth';

interface MobileBookingSheetProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: number;
  pricePerNight: number;
  minStay?: number;
  maxGuests?: number;
}

export function MobileBookingSheet({ 
  isOpen, 
  onClose, 
  propertyId, 
  pricePerNight, 
  minStay = 1, 
  maxGuests = 10 
}: MobileBookingSheetProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [checkIn, setCheckIn] = useState<string>('');
  const [checkOut, setCheckOut] = useState<string>('');
  const [guests, setGuests] = useState(1);
  const [nights, setNights] = useState(0);
  const [loading, setLoading] = useState(false);
  const [priceDetails, setPriceDetails] = useState<{
    subtotal: number;
    serviceFee: number;
    total: number;
    nights: number;
  } | null>(null);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Réinitialiser quand la feuille s'ouvre
  useEffect(() => {
    if (isOpen) {
      // Réinitialiser les dates si nécessaire
      if (!checkIn) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setCheckIn(tomorrow.toISOString().split('T')[0]);
      }
      if (!checkOut && checkIn) {
        const defaultCheckOut = new Date(checkIn);
        defaultCheckOut.setDate(defaultCheckOut.getDate() + 3);
        setCheckOut(defaultCheckOut.toISOString().split('T')[0]);
      }
    }
  }, [isOpen]);

  // Calculer les nuits et vérifier la disponibilité
  useEffect(() => {
    if (checkIn && checkOut) {
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setNights(diffDays);
      
      if (diffDays >= minStay) {
        checkAvailability();
      } else {
        setAvailabilityError(`Séjour minimum de ${minStay} nuit(s)`);
        setIsAvailable(false);
      }
    } else {
      setNights(0);
      setPriceDetails(null);
    }
  }, [checkIn, checkOut, guests]);

  const checkAvailability = async () => {
    if (!checkIn || !checkOut) return;
    setLoading(true);
    setAvailabilityError(null);
    try {
      const response = await propertyService.checkAvailability(propertyId, checkIn, checkOut, guests);
      if (response.data.available) {
        setIsAvailable(true);
        setPriceDetails(response.data.price_details);
      } else {
        setIsAvailable(false);
        setAvailabilityError('Ces dates ne sont pas disponibles');
      }
    } catch (err: any) {
      setAvailabilityError(err.response?.data?.message || 'Erreur de vérification');
      setIsAvailable(false);
    } finally {
      setLoading(false);
    }
  };

  const handleReservation = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/property/${propertyId}` } });
      onClose();
      return;
    }
    
    if (!isAvailable || !priceDetails) {
      alert('Veuillez sélectionner des dates valides');
      return;
    }

    setIsSubmitting(true);
    try {
      // Rediriger vers la page de paiement
      navigate(`/checkout/${propertyId}`, {
        state: {
          checkIn,
          checkOut,
          guests,
          nights: priceDetails.nights,
          subtotal: priceDetails.subtotal,
          serviceFee: priceDetails.serviceFee,
          total: priceDetails.total
        }
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '--/--/----';
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')} ${d.toLocaleString('fr', { month: 'short' })} ${d.getFullYear()}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/50" onClick={onClose}>
      <div
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-[#e2f5f2] rounded-full"></div>
        </div>
        <div className="sticky top-0 bg-white border-b border-[#e2f5f2] px-6 py-3 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-[#0f2940]">{pricePerNight.toLocaleString()} XOF</span>
            <span className="text-sm text-[#0f2940]">/nuit</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#00c9a7]">≈ {Math.round(pricePerNight / 655)} €</span>
            <button onClick={onClose} className="w-8 h-8 rounded-full border border-[#e2f5f2] flex items-center justify-center">
              <X className="w-4 h-4 text-[#0f2940]" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Dates */}
          <div>
            <label className="text-sm font-medium text-[#0f2940] mb-3 block">Dates du séjour</label>
            <div className="bg-[#f4fffe] rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-[#00c9a7]" />
                <div className="flex-1">
                  <div className="text-xs text-[#6b7280]">Arrivée</div>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="font-medium text-[#0f2940] bg-transparent focus:outline-none w-full"
                  />
                </div>
              </div>
              <div className="h-px bg-[#e2f5f2]"></div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-[#00c9a7]" />
                <div className="flex-1">
                  <div className="text-xs text-[#6b7280]">Départ</div>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    min={checkIn || new Date().toISOString().split('T')[0]}
                    disabled={!checkIn}
                    className="font-medium text-[#0f2940] bg-transparent focus:outline-none w-full disabled:opacity-50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Voyageurs */}
          <div>
            <label className="text-sm font-medium text-[#0f2940] mb-3 block">Voyageurs</label>
            <div className="bg-[#f4fffe] rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-[#00c9a7]" />
                <span className="font-medium text-[#0f2940]">{guests} voyageur{guests > 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setGuests(Math.max(1, guests - 1))}
                  className="w-10 h-10 rounded-full bg-white border border-[#e2f5f2] flex items-center justify-center"
                >
                  <Minus className="w-5 h-5 text-[#0f2940]" />
                </button>
                <span className="w-8 text-center font-medium text-[#0f2940]">{guests}</span>
                <button
                  onClick={() => setGuests(Math.min(maxGuests, guests + 1))}
                  className="w-10 h-10 rounded-full bg-white border border-[#e2f5f2] flex items-center justify-center"
                >
                  <Plus className="w-5 h-5 text-[#0f2940]" />
                </button>
              </div>
            </div>
            {guests > maxGuests && <p className="text-xs text-red-500 mt-1">Maximum {maxGuests} voyageurs</p>}
          </div>

          {/* Erreur disponibilité */}
          {availabilityError && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl">
              {availabilityError}
            </div>
          )}

          {/* Détail des prix */}
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 text-[#00c9a7] animate-spin" />
            </div>
          ) : priceDetails && isAvailable && (
            <div className="bg-[#f4fffe] rounded-2xl p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#6b7280]">{pricePerNight.toLocaleString()} XOF × {priceDetails.nights} nuits</span>
                <span className="text-[#0f2940] font-medium">{priceDetails.subtotal.toLocaleString()} XOF</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#6b7280]">Frais de service</span>
                <span className="text-[#0f2940] font-medium">{priceDetails.serviceFee.toLocaleString()} XOF</span>
              </div>
              <div className="h-px bg-[#e2f5f2]"></div>
              <div className="flex justify-between">
                <span className="font-bold text-[#0f2940]">Total</span>
                <div className="text-right">
                  <div className="font-bold text-lg text-[#0f2940]">{priceDetails.total.toLocaleString()} XOF</div>
                  <div className="text-xs text-[#00c9a7]">≈ {Math.round(priceDetails.total / 655)} €</div>
                </div>
              </div>
            </div>
          )}

          {/* Modes de paiement */}
          <div>
            <label className="text-sm font-medium text-[#0f2940] mb-3 block">Mode de paiement</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: 'MTN MoMo', provider: 'MTN', color: 'bg-yellow-400' },
                { name: 'Moov', provider: 'Moov', color: 'bg-blue-500 text-white' },
                { name: 'Orange', provider: 'Orange', color: 'bg-orange-500 text-white' },
                { name: 'Carte', provider: 'card', color: 'bg-[#6b7280] text-white' },
              ].map((payment, idx) => (
                <button
                  key={idx}
                  className={`p-4 rounded-xl border-2 font-medium text-sm transition-all ${
                    idx === 0
                      ? 'border-[#00c9a7] ' + payment.color
                      : 'border-[#e2f5f2] bg-white'
                  }`}
                >
                  {payment.name}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleReservation}
            disabled={!isAvailable || !checkIn || !checkOut || loading || isSubmitting}
            className="w-full bg-[#00c9a7] text-white py-4 rounded-full font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
            {isSubmitting ? 'Traitement...' : 'Réserver maintenant'}
          </button>
        </div>
      </div>
    </div>
  );
}
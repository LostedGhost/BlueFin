// components/BookingWidget.tsx
import { Calendar, Users, Minus, Plus, Loader2, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import propertyService from '../../services/property.service';
import { useAuth } from '../hooks/useAuth';
import CheckoutModal from './CheckoutModal';

interface BookingWidgetProps {
  propertyId: number;
  pricePerNight: number;
  pricePerNightEur?: number;
  minStay?: number;
  maxGuests?: number;
  cancellationPolicy?: 'flexible' | 'moderate' | 'strict';
}

interface PriceDetails {
  subtotal: number;
  serviceFee: number;
  total: number;
  nights: number;
}

interface PolicyRule {
  deadline: Date;
  refundPercentage: number;
  label: string;
  description: string;
  icon: JSX.Element;
}

export function BookingWidget({ 
  propertyId, 
  pricePerNight, 
  pricePerNightEur, 
  minStay = 1, 
  maxGuests = 10,
  cancellationPolicy = 'moderate'
}: BookingWidgetProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  // États pour les dates et voyageurs
  const [checkIn, setCheckIn] = useState<string>('');
  const [checkOut, setCheckOut] = useState<string>('');
  const [guests, setGuests] = useState(1);
  const [nights, setNights] = useState(0);
  const [loading, setLoading] = useState(false);
  const [priceDetails, setPriceDetails] = useState<PriceDetails | null>(null);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [policyRules, setPolicyRules] = useState<PolicyRule[]>([]);
  const [currentRule, setCurrentRule] = useState<PolicyRule | null>(null);

  // Calculer le nombre de nuits et vérifier la disponibilité
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

  // Calculer la politique d'annulation
  useEffect(() => {
    if (!checkIn) return;

    const checkInDate = new Date(checkIn);
    const bookingDate = new Date();
    const rules: PolicyRule[] = [];

    if (cancellationPolicy === 'flexible') {
      // Politique flexible
      const fullRefundDeadline = new Date(checkInDate);
      fullRefundDeadline.setDate(checkInDate.getDate() - 1);
      fullRefundDeadline.setHours(23, 59, 59);
      
      rules.push({
        deadline: fullRefundDeadline,
        refundPercentage: 100,
        label: 'Remboursement intégral',
        description: `Annulez avant le ${fullRefundDeadline.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} pour un remboursement complet.`,
        icon: <CheckCircle className="w-5 h-5 text-green-500" />
      });
      
      const partialRefundDeadline = new Date(checkInDate);
      partialRefundDeadline.setDate(checkInDate.getDate() - 7);
      partialRefundDeadline.setHours(15, 0, 0);
      
      if (partialRefundDeadline > bookingDate) {
        rules.push({
          deadline: partialRefundDeadline,
          refundPercentage: 50,
          label: 'Remboursement partiel',
          description: `Annulez avant le ${partialRefundDeadline.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} pour un remboursement de 50%. Les frais de service ne sont pas remboursés.`,
          icon: <Clock className="w-5 h-5 text-orange-500" />
        });
      }
      
      rules.push({
        deadline: checkInDate,
        refundPercentage: 0,
        label: 'Aucun remboursement',
        description: `Annulation moins de 7 jours avant le check-in (à partir du ${partialRefundDeadline.toLocaleDateString('fr-FR')} à 15h00) : aucun remboursement, sans exception.`,
        icon: <XCircle className="w-5 h-5 text-red-500" />
      });
      
    } else if (cancellationPolicy === 'strict') {
      // Politique stricte
      const fullRefundDeadline = new Date(checkInDate);
      fullRefundDeadline.setDate(checkInDate.getDate() - 14);
      fullRefundDeadline.setHours(23, 59, 59);
      
      rules.push({
        deadline: fullRefundDeadline,
        refundPercentage: 100,
        label: 'Remboursement intégral',
        description: `Annulez avant le ${fullRefundDeadline.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} pour un remboursement complet.`,
        icon: <CheckCircle className="w-5 h-5 text-green-500" />
      });
      
      const partialRefundDeadline = new Date(checkInDate);
      partialRefundDeadline.setDate(checkInDate.getDate() - 7);
      partialRefundDeadline.setHours(15, 0, 0);
      
      if (partialRefundDeadline > fullRefundDeadline) {
        rules.push({
          deadline: partialRefundDeadline,
          refundPercentage: 50,
          label: 'Remboursement partiel',
          description: `Annulez avant le ${partialRefundDeadline.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} pour un remboursement de 50%. Les frais de service ne sont pas remboursés.`,
          icon: <Clock className="w-5 h-5 text-orange-500" />
        });
      }
      
      rules.push({
        deadline: checkInDate,
        refundPercentage: 0,
        label: 'Aucun remboursement',
        description: `Annulation moins de 7 jours avant le check-in : aucun remboursement, sans exception.`,
        icon: <XCircle className="w-5 h-5 text-red-500" />
      });
      
    } else {
      // Politique modérée (par défaut)
      const fullRefundDeadline = new Date(bookingDate);
      fullRefundDeadline.setHours(bookingDate.getHours() + 24);
      
      rules.push({
        deadline: fullRefundDeadline,
        refundPercentage: 100,
        label: 'Remboursement intégral',
        description: `Annulez dans les 24h suivant votre réservation (avant le ${fullRefundDeadline.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}) pour un remboursement complet.`,
        icon: <CheckCircle className="w-5 h-5 text-green-500" />
      });
      
      const partialRefundDeadline = new Date(checkInDate);
      partialRefundDeadline.setDate(checkInDate.getDate() - 7);
      partialRefundDeadline.setHours(15, 0, 0);
      
      if (partialRefundDeadline > fullRefundDeadline) {
        rules.push({
          deadline: partialRefundDeadline,
          refundPercentage: 50,
          label: 'Remboursement partiel',
          description: `Annulez avant le ${partialRefundDeadline.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} pour un remboursement de 50%. Les frais de service ne sont pas remboursés.`,
          icon: <Clock className="w-5 h-5 text-orange-500" />
        });
      }
      
      rules.push({
        deadline: checkInDate,
        refundPercentage: 0,
        label: 'Aucun remboursement',
        description: `Annulation moins de 7 jours avant le check-in (après le ${partialRefundDeadline.toLocaleDateString('fr-FR')} à 15h00) : aucun remboursement, sans exception.`,
        icon: <XCircle className="w-5 h-5 text-red-500" />
      });
    }
    
    setPolicyRules(rules);
    
    // Déterminer la règle actuelle
    const now = new Date();
    let activeRule = rules[rules.length - 1];
    for (const rule of rules) {
      if (now < rule.deadline) {
        activeRule = rule;
        break;
      }
    }
    setCurrentRule(activeRule);
    
  }, [checkIn, cancellationPolicy]);

  const checkAvailability = async () => {
    if (!checkIn || !checkOut) return;
    setLoading(true);
    setAvailabilityError(null);
    try {
      const response = await propertyService.checkAvailability(propertyId, checkIn, checkOut);
      
      if (response?.data?.available) {
        setIsAvailable(true);
        const subtotal = pricePerNight * nights;
        const serviceFee = subtotal * 0.10; // 10% frais de service
        setPriceDetails({
          subtotal,
          serviceFee,
          total: subtotal + serviceFee,
          nights
        });
      } else {
        setIsAvailable(false);
        setAvailabilityError(response?.data?.message || 'Ces dates ne sont pas disponibles');
      }
    } catch (err: any) {
      console.error('Erreur vérification:', err);
      setAvailabilityError(err.response?.data?.message || 'Erreur de vérification');
      setIsAvailable(false);
    } finally {
      setLoading(false);
    }
  };

  const handleReservation = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/property/${propertyId}` } });
      return;
    }

    if (!isAvailable || !priceDetails || !checkIn || !checkOut) {
      alert('Veuillez sélectionner des dates valides');
      return;
    }

    navigate(`/booking/${propertyId}?check_in=${checkIn}&check_out=${checkOut}&guests=${guests}&nights=${nights}`);
  };

  // Composant Politique d'annulation
  const CancellationPolicySection = () => {
    if (!checkIn) {
      return (
        <div className="bg-gray-50 rounded-xl p-4 text-center mt-6">
          <p className="text-gray-500 text-sm">
            Sélectionnez vos dates pour voir la politique d'annulation
          </p>
        </div>
      );
    }

    return (
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mt-6">
        <div className="bg-gradient-to-r from-[#0F2940] to-[#1a3a52] px-4 py-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#00c9a7]" />
            <h4 className="font-semibold text-white text-sm">Politique d'annulation</h4>
          </div>
        </div>
        
        {/* Règle active */}
        {currentRule && (
          <div className={`p-4 border-b ${
            currentRule.refundPercentage === 100 ? 'bg-green-50 border-green-200' :
            currentRule.refundPercentage === 50 ? 'bg-orange-50 border-orange-200' :
            'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">{currentRule.icon}</div>
              <div>
                <h5 className={`font-semibold text-sm ${
                  currentRule.refundPercentage === 100 ? 'text-green-700' :
                  currentRule.refundPercentage === 50 ? 'text-orange-700' :
                  'text-red-700'
                }`}>
                  {currentRule.label}
                </h5>
                <p className="text-xs text-gray-600 mt-1">{currentRule.description}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Liste des règles */}
        <div className="p-4 space-y-3">
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            L'heure indiquée est basée sur l'emplacement du logement
          </p>
          
          {policyRules.map((rule, index) => (
            <div key={index} className={`pb-2 ${index < policyRules.length - 1 ? 'border-b border-gray-100' : ''}`}>
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 mt-0.5">
                  {rule.refundPercentage === 100 ? (
                    <CheckCircle className="w-3 h-3 text-green-500" />
                  ) : rule.refundPercentage === 50 ? (
                    <Clock className="w-3 h-3 text-orange-500" />
                  ) : (
                    <XCircle className="w-3 h-3 text-red-400" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-800">{rule.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {rule.description.split('.')[0]}.
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Note supplémentaire */}
        <div className="bg-gray-50 px-4 py-2 border-t border-gray-100">
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Les frais de service (10%) ne sont pas remboursés en cas d'annulation partielle.
          </p>
        </div>
      </div>
    );
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '--/--/--';
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getFullYear().toString().slice(-2)}`;
  };

  return (
    <div className="bg-white border border-[#e2f5f2] rounded-2xl p-6 shadow-[0_4px_24px_rgba(15,41,64,0.08)] sticky top-24">
      <div className="mb-6">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-3xl font-bold text-[#0f2940]">{pricePerNight.toLocaleString()} FCFA</span>
          <span className="text-[#0f2940]">/nuit</span>
        </div>
        {pricePerNightEur && (
          <span className="text-sm text-[#00c9a7]">≈ {pricePerNightEur} €</span>
        )}
      </div>

      {/* Sélecteur de dates */}
      <div className="border border-[#e2f5f2] rounded-xl overflow-hidden mb-4">
        <div className="grid grid-cols-2 border-b border-[#e2f5f2]">
          <div className="p-3 border-r border-[#e2f5f2]">
            <label className="text-xs font-medium text-[#6b7280] block mb-1">Arrivée</label>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#00c9a7]" />
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="text-sm text-[#0f2940] bg-transparent focus:outline-none"
              />
            </div>
          </div>
          <div className="p-3">
            <label className="text-xs font-medium text-[#6b7280] block mb-1">Départ</label>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#00c9a7]" />
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                min={checkIn || new Date().toISOString().split('T')[0]}
                disabled={!checkIn}
                className="text-sm text-[#0f2940] bg-transparent focus:outline-none disabled:opacity-50"
              />
            </div>
          </div>
        </div>
        <div className="p-3">
          <label className="text-xs font-medium text-[#6b7280] block mb-2">Voyageurs</label>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#00c9a7]" />
              <span className="text-sm text-[#0f2940]">{guests} voyageur{guests > 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setGuests(Math.max(1, guests - 1))}
                className="w-8 h-8 rounded-full border border-[#e2f5f2] flex items-center justify-center hover:border-[#00c9a7] transition-colors"
              >
                <Minus className="w-4 h-4 text-[#0f2940]" />
              </button>
              <button
                onClick={() => setGuests(Math.min(maxGuests, guests + 1))}
                className="w-8 h-8 rounded-full border border-[#e2f5f2] flex items-center justify-center hover:border-[#00c9a7] transition-colors"
              >
                <Plus className="w-4 h-4 text-[#0f2940]" />
              </button>
            </div>
          </div>
          {guests > maxGuests && (
            <p className="text-xs text-red-500 mt-1">Maximum {maxGuests} voyageurs</p>
          )}
        </div>
      </div>

      {/* Message d'erreur disponibilité */}
      {availabilityError && (
        <div className="bg-red-50 text-red-600 text-sm p-2 rounded-lg mb-4">
          {availabilityError}
        </div>
      )}

      {/* Détail des prix */}
      {priceDetails && isAvailable && (
        <>
          <div className="space-y-3 mb-6 pb-6 border-b border-[#e2f5f2]">
            <div className="flex justify-between text-sm">
              <span className="text-[#6b7280]">{pricePerNight.toLocaleString()} FCFA × {priceDetails.nights} nuits</span>
              <span className="text-[#0f2940]">{priceDetails.subtotal.toLocaleString()} FCFA</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#6b7280]">Frais de service Bluefin (10%)</span>
              <span className="text-[#0f2940]">{priceDetails.serviceFee.toLocaleString()} FCFA</span>
            </div>
          </div>

          <div className="flex justify-between items-baseline mb-6">
            <span className="font-bold text-[#0f2940]">Total</span>
            <div className="text-right">
              <div className="text-xl font-bold text-[#0f2940]">{priceDetails.total.toLocaleString()} FCFA</div>
              <div className="text-xs text-[#00c9a7]">≈ {Math.round(priceDetails.total / 655)} €</div>
            </div>
          </div>
        </>
      )}

      {/* Politique d'annulation */}
      <CancellationPolicySection />

      <div className="mb-4 mt-6">
        <div className="text-xs font-medium text-[#6b7280] mb-2">Paiement accepté</div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-2 py-1 bg-yellow-400 rounded text-xs font-medium">MTN MoMo</div>
          <div className="px-2 py-1 bg-blue-500 text-white rounded text-xs font-medium">Moov</div>
          <div className="px-2 py-1 bg-orange-500 text-white rounded text-xs font-medium">Orange</div>
          <div className="px-2 py-1 bg-[#6b7280] text-white rounded text-xs font-medium">Carte</div>
        </div>
      </div>

      <button
        onClick={handleReservation}
        disabled={!isAvailable || !checkIn || !checkOut || loading}
        className="w-full bg-[#00c9a7] text-white py-4 rounded-full font-medium hover:bg-[#00b396] transition-colors mb-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading && <Loader2 className="w-5 h-5 animate-spin" />}
        {loading ? 'Vérification...' : 'Réserver maintenant'}
      </button>

      <button
        onClick={() => navigate(`/messages/inquiry?property=${propertyId}`)}
        className="w-full border-2 border-[#0f2940] text-[#0f2940] py-3 rounded-full font-medium hover:bg-[#0f2940] hover:text-white transition-colors"
      >
        Contacter l'hôte
      </button>
    </div>
  );
}
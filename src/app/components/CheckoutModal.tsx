import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import bookingService from '../../services/booking.service';

export const CheckoutModal = ({ propertyId, propertyTitle, checkIn, checkOut, guests, totalPrice, onClose, onSuccess }: any) => {
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<'mobile_money' | 'card' | 'bank_transfer'>('mobile_money');
  const [mobileProvider, setMobileProvider] = useState<'MTN' | 'Moov' | 'Orange'>('MTN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    if (!user) {
      setError('Veuillez vous connecter pour réserver');
      return;
    }
    setLoading(true);
    setError('');
    const bookingData = {
      property_id: propertyId,
      check_in: checkIn,
      check_out: checkOut,
      guests_count: guests || 1,
      payment_method: paymentMethod,
      mobile_money_provider: paymentMethod === 'mobile_money' ? mobileProvider : undefined,
      mobile_money_number: paymentMethod === 'mobile_money' ? user?.phone : undefined,
      guest_details: {
        full_name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim(),
        email: user?.email || '',
        phone: user?.phone || '',
      },
    };

    try {
      const resp = await bookingService.create(bookingData as any);
      const bookingId = resp?.booking?.id || resp?.data?.booking?.id || resp?.id;
      if (bookingId) {
        onSuccess?.(bookingId);
        onClose?.();
      } else {
        setError("Impossible de récupérer l'ID de la réservation");
      }
    } catch (e: any) {
      console.error('Checkout error', e);
      setError(e?.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-3">Confirmer la réservation</h2>
        <p className="text-sm text-gray-600 mb-2">{propertyTitle}</p>
        <p className="text-sm text-gray-600 mb-4">{checkIn} — {checkOut} · {guests} voyageur(s)</p>
        <div className="border rounded-2xl p-4 mb-4">
          <h3 className="font-medium mb-2">Moyen de paiement</h3>
          <div className="flex gap-2 mb-3">
            <button onClick={() => setPaymentMethod('mobile_money')} className={`flex-1 p-2 rounded-lg border ${paymentMethod==='mobile_money'?'border-[#00c9a7] bg-[#f4fffe]':''}`}>Mobile Money</button>
            <button onClick={() => setPaymentMethod('card')} className={`flex-1 p-2 rounded-lg border ${paymentMethod==='card'?'border-[#00c9a7] bg-[#f4fffe]':''}`}>Carte</button>
            <button onClick={() => setPaymentMethod('bank_transfer')} className={`flex-1 p-2 rounded-lg border ${paymentMethod==='bank_transfer'?'border-[#00c9a7] bg-[#f4fffe]':''}`}>Virement</button>
          </div>
          {paymentMethod === 'mobile_money' && (
            <div>
              <div className="text-xs text-gray-500 mb-2">Choisissez un opérateur</div>
              <div className="flex gap-2 mb-2">
                {['MTN','Moov','Orange'].map(op => (
                  <button key={op} onClick={() => setMobileProvider(op as any)} className={`flex-1 p-2 rounded-lg border ${mobileProvider===op?'border-[#00c9a7] bg-[#f4fffe]':''}`}>{op}</button>
                ))}
              </div>
              <div className="text-xs text-gray-500">Paiement demandé sur : {user?.phone}</div>
            </div>
          )}
        </div>
        {error && <div className="text-red-600 text-sm mb-3">{error}</div>}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 border rounded-lg py-2">Annuler</button>
          <button onClick={handleConfirm} disabled={loading} className="flex-1 bg-[#00c9a7] text-[#0F2940] font-semibold py-2 rounded-lg">{loading ? 'Traitement...' : `Payer ${totalPrice?.toLocaleString()} FCFA`}</button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;

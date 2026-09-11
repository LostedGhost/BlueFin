// src/app/pages/FedapayCallbackPage.tsx

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { CheckCircle, XCircle, Loader2, Home } from 'lucide-react';
import { fedapayService } from '../../services/fedapay.service';
import bookingService from '../../services/booking.service';

interface FedapayCallbackPageProps {
  onNavigate?: (route: any) => void;
}

export function FedapayCallbackPage({ onNavigate }: FedapayCallbackPageProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'success' | 'failed' | 'pending'>('pending');
  const [error, setError] = useState('');
  const [bookingId, setBookingId] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const transId = searchParams.get('transaction_id');
      const statusParam = searchParams.get('status');
      const bookingIdParam = searchParams.get('booking_id');

      setBookingId(bookingIdParam);

      if (!transId) {
        setStatus('failed');
        setError('Transaction non trouvée');
        setLoading(false);
        return;
      }

      try {
        // Vérifier le statut de la transaction
        const response = await fedapayService.getTransactionStatus(transId);
        
        if (response.status === 'success') {
          let createdBookingId = bookingIdParam || sessionStorage.getItem('fedapay_booking_id');
          const storedBookingData = sessionStorage.getItem('fedapay_booking_data');

          if (!createdBookingId && storedBookingData) {
            try {
              const bookingData = JSON.parse(storedBookingData);
              console.log('📤 Création de la réservation après paiement:', bookingData);

              const bookingResponse = await bookingService.create(bookingData);
              createdBookingId = bookingResponse?.booking?.id 
                || bookingResponse?.data?.booking?.id 
                || bookingResponse?.data?.id 
                || bookingResponse?.id?.toString();

              if (createdBookingId) {
                sessionStorage.setItem('fedapay_booking_id', createdBookingId.toString());
              }
            } catch (bookingError: any) {
              console.error('❌ Erreur création réservation après paiement:', bookingError);
              setStatus('failed');
              setError(bookingError.message || 'Erreur lors de la création de la réservation');
              toast.error('❌ Échec création réservation après paiement');
              setLoading(false);
              return;
            }
          }

          setStatus('success');
          toast.success('✅ Paiement confirmé !');
          
          // Sauvegarder la transaction
          sessionStorage.setItem('fedapay_payment_success', 'true');
          sessionStorage.setItem('fedapay_transaction_id', transId);
          
          // Rediriger vers la confirmation ou l'accueil après 3 secondes
          setTimeout(() => {
            if (createdBookingId) {
              const confirmationRoute = `/reserver/confirmation/${createdBookingId}`;
              if (onNavigate) {
                onNavigate({ name: 'confirmation', id: createdBookingId.toString() });
              } else {
                navigate(confirmationRoute);
              }
            } else if (onNavigate) {
              onNavigate({ name: 'home' });
            } else {
              navigate('/');
            }
          }, 3000);
        } else {
          setStatus('failed');
          setError(response.data?.message || 'Le paiement a échoué');
          toast.error('❌ Paiement échoué');
        }
      } catch (error: any) {
        console.error('Erreur callback:', error);
        setStatus('failed');
        setError(error.message || 'Erreur lors de la confirmation du paiement');
        toast.error('❌ ' + (error.message || 'Erreur de confirmation'));
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [searchParams, onNavigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4fffe]">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-[#00c9a7] animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg font-medium">Vérification du paiement en cours...</p>
          <p className="text-gray-400 text-sm mt-2">Veuillez patienter</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4fffe] p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center shadow-xl border border-[#e2f5f2]">
        {status === 'success' ? (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-[#0F2940] mb-2">✅ Paiement réussi !</h2>
            <p className="text-gray-600 mb-2">Votre réservation est confirmée.</p>
            <p className="text-gray-400 text-sm">Redirection vers l'accueil dans quelques secondes...</p>
            
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => {
                  if (onNavigate) {
                    onNavigate({ name: 'home' });
                  } else {
                    navigate('/');
                  }
                }}
                className="px-6 py-2 bg-[#00c9a7] text-white rounded-xl hover:bg-[#00b892] transition flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Accueil
              </button>
            </div>
          </>
        ) : status === 'failed' ? (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-12 h-12 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-[#0F2940] mb-2">❌ Paiement échoué</h2>
            <p className="text-gray-600 mb-4">{error || 'Une erreur est survenue lors du paiement'}</p>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  if (onNavigate) {
                    onNavigate({ name: 'fedapay-payment' });
                  } else {
                    navigate('/payment/fedapay');
                  }
                }}
                className="w-full px-6 py-3 bg-[#00c9a7] text-white rounded-xl hover:bg-[#00b892] transition flex items-center justify-center gap-2"
              >
                Réessayer
              </button>
              <button
                onClick={() => {
                  if (onNavigate) {
                    onNavigate({ name: 'home' });
                  } else {
                    navigate('/');
                  }
                }}
                className="w-full px-6 py-3 border border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 transition flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Retour à l'accueil
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-12 h-12 text-yellow-600 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-[#0F2940] mb-2">⏳ En cours...</h2>
            <p className="text-gray-600">Le statut du paiement est en attente de confirmation.</p>
            <button
              onClick={() => {
                if (onNavigate) {
                  onNavigate({ name: 'home' });
                } else {
                  navigate('/');
                }
              }}
              className="mt-6 px-6 py-2 bg-[#00c9a7] text-white rounded-xl hover:bg-[#00b892] transition flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Accueil
            </button>
          </>
        )}
      </div>
    </div>
  );
}
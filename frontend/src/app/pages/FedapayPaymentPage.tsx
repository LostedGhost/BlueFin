// FedapayPaymentPage.tsx - Version complète corrigée

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  CreditCard, Loader2, CheckCircle, XCircle, ArrowLeft,
  Shield, Lock, Banknote, Smartphone, Wallet, Home, AlertCircle,
  Calendar, User, Mail, Phone
} from 'lucide-react';
import { fedapayService } from '../../services/fedapay.service';
import bookingService from '../../services/booking.service';
import propertyService from '../../services/property.service';
import { useAuth } from '../../contexts/AuthContext';
import { refreshCsrfToken, getCookie, v1Api } from '../../services/api';

interface FedapayPaymentPageProps {
  onNavigate?: (route: any) => void;
  bookingData?: any;
}

// ✅ Fonction de formatage du téléphone pour Fedapay
const formatPhoneForFedapay = (phone: string): string => {
  if (!phone) return '+22969000000';
  
  // Nettoyer : garder uniquement les chiffres
  let cleaned = phone.replace(/[^0-9]/g, '');
  
  // Cas spécial: 0150036568 → 50036568
  if (cleaned.startsWith('01') && cleaned.length === 10) {
    cleaned = cleaned.substring(2);
  }
  
  // Si commence par 0, l'enlever
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  // Si commence par 1 et a 9 chiffres
  if (cleaned.startsWith('1') && cleaned.length === 9) {
    cleaned = cleaned.substring(1);
  }
  
  // Si commence par 1 et a 10 chiffres
  if (cleaned.startsWith('1') && cleaned.length === 10) {
    cleaned = cleaned.substring(1);
  }
  
  // Si le numéro a plus de 8 chiffres, prendre les 8 derniers
  if (cleaned.length > 8) {
    cleaned = cleaned.slice(-8);
  }
  
  // Si moins de 8 chiffres, compléter avec des zéros
  if (cleaned.length < 8) {
    cleaned = cleaned.padStart(8, '0');
  }
  
  return `+229${cleaned}`;
};

export function FedapayPaymentPage({ onNavigate, bookingData }: FedapayPaymentPageProps) {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, refreshUser, logout } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'pending' | 'processing' | 'success' | 'failed'>('idle');
  const [paymentMethod, setPaymentMethod] = useState<'mobile_money' | 'card'>('mobile_money');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [localBookingData, setLocalBookingData] = useState<any>(null);
  const [error, setError] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<'idle' | 'available' | 'unavailable' | 'checking'>('idle');
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [propertyPrice, setPropertyPrice] = useState<number>(0);
  const [authChecked, setAuthChecked] = useState(false);

  // ============================================
  // ✅ FONCTION DE VÉRIFICATION D'AUTHENTIFICATION
  // ============================================
  const checkAuthentication = useCallback(async (): Promise<boolean> => {
    const sessionCookie = getCookie('laravel_session') || getCookie('PHPSESSID');
    const storedUser = localStorage.getItem('user');
    
    console.log('🔍 Vérification auth:', {
      hasSessionCookie: !!sessionCookie,
      hasUser: !!user,
      hasStoredUser: !!storedUser,
      isAuthenticated,
    });

    // ✅ Si pas de cookie de session, essayer de le récupérer
    if (!sessionCookie) {
      console.log('🔄 Tentative de récupération de session...');
      await refreshCsrfToken();
      
      // Vérifier à nouveau
      const newSessionCookie = getCookie('laravel_session') || getCookie('PHPSESSID');
      if (!newSessionCookie) {
        console.error('❌ Impossible de récupérer la session');
        toast.error('❌ Veuillez vous reconnecter');
        
        localStorage.removeItem('user');
        localStorage.removeItem('userType');
        
        await logout();
        
        if (onNavigate) {
          onNavigate({ name: 'auth', search: 'redirect=payment&session_expired=true' });
        } else {
          window.location.href = '/auth?redirect=payment&session_expired=true';
        }
        return false;
      }
    }

    // ✅ Si l'utilisateur n'est pas dans le contexte mais dans localStorage
    if (!user && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        await refreshUser();
        return true;
      } catch (e) {
        console.error('❌ Erreur parsing user:', e);
        return false;
      }
    }

    // ✅ Vérifier que l'utilisateur est valide
    if (user && user.id) {
      return true;
    }

    return false;
  }, [user, isAuthenticated, refreshUser, logout, onNavigate]);

  // ============================================
  // ✅ VÉRIFICATION DE L'AUTHENTIFICATION
  // ============================================
  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔍 Vérification de l\'authentification pour le paiement...');
      console.log('📊 État auth:', { isAuthenticated, user: user?.email });
      
      // ✅ Si pas authentifié, rediriger
      if (!isAuthenticated || !user) {
        console.warn('⚠️ Utilisateur non authentifié, redirection vers login');
        
        // Sauvegarder les données
        const currentData = localBookingData || sessionStorage.getItem('fedapay_booking_data');
        if (currentData) {
          sessionStorage.setItem('fedapay_booking_data', 
            typeof currentData === 'string' ? currentData : JSON.stringify(currentData)
          );
        }
        
        if (onNavigate) {
          onNavigate({ name: 'auth', search: 'redirect=payment' });
        } else {
          navigate('/auth?redirect=payment');
        }
        return;
      }
      
      // ✅ Vérifier le cookie de session
      const sessionCookie = getCookie('laravel_session') || getCookie('PHPSESSID');
      if (!sessionCookie) {
        console.warn('⚠️ Cookie de session manquant, tentative de récupération...');
        await refreshCsrfToken();
        
        // Vérifier à nouveau
        const newSessionCookie = getCookie('laravel_session') || getCookie('PHPSESSID');
        if (!newSessionCookie) {
          console.error('❌ Impossible de récupérer la session');
          if (onNavigate) {
            onNavigate({ name: 'auth', search: 'redirect=payment&session_expired=true' });
          } else {
            navigate('/auth?redirect=payment&session_expired=true');
          }
          return;
        }
      }
      
      // ✅ Tout est bon
      if (user && user.id) {
        console.log('✅ Utilisateur authentifié:', user);
        setAuthChecked(true);
      }
    };
    
    checkAuth();
  }, [isAuthenticated, user, onNavigate, navigate, localBookingData]);

  // ✅ Vérification périodique du cookie
  useEffect(() => {
    if (isAuthenticated && user) {
      const interval = setInterval(() => {
        const hasSession = getCookie('laravel_session') || getCookie('PHPSESSID');
        if (!hasSession) {
          console.warn('⚠️ Cookie de session perdu');
          // Rafraîchir silencieusement
          refreshCsrfToken().then(() => {
            const newSession = getCookie('laravel_session') || getCookie('PHPSESSID');
            if (!newSession) {
              console.error('❌ Session perdue');
              toast.error('Session expirée, veuillez vous reconnecter');
              if (onNavigate) {
                onNavigate({ name: 'auth', search: 'redirect=payment&session_expired=true' });
              } else {
                navigate('/auth?redirect=payment&session_expired=true');
              }
            }
          });
        }
      }, 30000); // Toutes les 30 secondes
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user, onNavigate, navigate]);

  // ============================================
  // ✅ CHARGEMENT DES DONNÉES DE RÉSERVATION
  // ============================================
  useEffect(() => {
    console.log('🔍 Chargement des données de réservation...');
    console.log('📦 bookingData prop:', bookingData);
    console.log('🔗 location.search:', location.search);

    // 1️⃣ Données passées en prop (via onNavigate)
    if (bookingData) {
      console.log('✅ Données chargées depuis la prop:', bookingData);
      setLocalBookingData(bookingData);
      sessionStorage.setItem('fedapay_booking_data', JSON.stringify(bookingData));
      setIsDataLoaded(true);
      return;
    }

    // 2️⃣ Données décodées de l'URL (paramètre 'data')
    const params = new URLSearchParams(location.search);
    const dataParam = params.get('data');
    
    if (dataParam) {
      try {
        const decodedData = JSON.parse(decodeURIComponent(dataParam));
        console.log('✅ Données décodées de l\'URL:', decodedData);
        setLocalBookingData(decodedData);
        sessionStorage.setItem('fedapay_booking_data', JSON.stringify(decodedData));
        setIsDataLoaded(true);
        return;
      } catch (e) {
        console.error('❌ Erreur décodage des données URL:', e);
      }
    }

    // 3️⃣ sessionStorage (fedapay_booking_data)
    const fedapayData = sessionStorage.getItem('fedapay_booking_data');
    if (fedapayData) {
      try {
        const parsed = JSON.parse(fedapayData);
        console.log('✅ Données chargées depuis fedapay_booking_data:', parsed);
        setLocalBookingData(parsed);
        setIsDataLoaded(true);
        return;
      } catch (e) {
        console.error('❌ Erreur parsing fedapay_booking_data:', e);
      }
    }

    // 4️⃣ bookingFormData
    const savedData = sessionStorage.getItem('bookingFormData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        console.log('✅ Données chargées depuis bookingFormData:', parsed);
        setLocalBookingData(parsed);
        setIsDataLoaded(true);
        return;
      } catch (e) {
        console.error('❌ Erreur parsing bookingFormData:', e);
      }
    }

    console.warn('⚠️ Aucune donnée de réservation trouvée');
    setError('Aucune donnée de réservation trouvée');
  }, [bookingData, location.search]);

  // ============================================
  // ✅ RÉCUPÉRATION DU PRIX
  // ============================================
  useEffect(() => {
    const fetchPropertyPrice = async () => {
      if (!isDataLoaded || !localBookingData?.property_id) return;
      
      // Si le prix est déjà présent dans les données, l'utiliser
      if (localBookingData.price_per_night && localBookingData.price_per_night > 0) {
        setPropertyPrice(localBookingData.price_per_night);
        console.log('✅ Prix récupéré depuis les données:', localBookingData.price_per_night);
        return;
      }

      try {
        console.log('🔍 Récupération du prix depuis l\'API pour la propriété:', localBookingData.property_id);
        const response = await propertyService.getById(localBookingData.property_id);
        const property = response?.data || response;
        
        if (property?.price_per_night) {
          const price = Number(property.price_per_night);
          setPropertyPrice(price);
          setLocalBookingData((prev: any) => ({
            ...prev,
            price_per_night: price
          }));
          console.log('✅ Prix récupéré depuis l\'API:', price);
        } else {
          console.warn('⚠️ Aucun prix trouvé pour cette propriété');
        }
      } catch (error) {
        console.error('❌ Erreur récupération du prix:', error);
      }
    };

    fetchPropertyPrice();
  }, [isDataLoaded, localBookingData?.property_id]);

  // ============================================
  // ✅ VÉRIFICATION DE LA DISPONIBILITÉ
  // ============================================
  const checkAvailability = useCallback(async () => {
    if (!localBookingData?.property_id || !localBookingData?.check_in || !localBookingData?.check_out) {
      setError('Données de réservation incomplètes');
      return false;
    }

    setIsCheckingAvailability(true);
    setAvailabilityStatus('checking');

    try {
      const propertyId = localBookingData.property_id;
      const checkIn = localBookingData.check_in;
      const checkOut = localBookingData.check_out;
      const guests = localBookingData.guests || localBookingData.guests_count || 1;

      console.log('🔍 Vérification disponibilité Fedapay:', {
        propertyId,
        checkIn,
        checkOut,
        guests
      });

      const response = await propertyService.checkAvailability(
        propertyId,
        checkIn,
        checkOut,
        guests
      );

      console.log('📥 Réponse disponibilité Fedapay:', response);

      const isAvailable = response?.available === true;
      
      if (isAvailable) {
        setAvailabilityStatus('available');
        setError('');
        toast.success('✅ Ces dates sont disponibles !');
        return true;
      } else {
        setAvailabilityStatus('unavailable');
        const message = response?.message || '❌ Ces dates ne sont pas disponibles.';
        setError(message);
        toast.error(message);
        return false;
      }
    } catch (error: any) {
      console.error('❌ Erreur vérification disponibilité:', error);
      setAvailabilityStatus('unavailable');
      const errorMsg = error.response?.data?.message || '❌ Impossible de vérifier la disponibilité.';
      setError(errorMsg);
      toast.error(errorMsg);
      return false;
    } finally {
      setIsCheckingAvailability(false);
    }
  }, [localBookingData]);

  // Déclencher la vérification automatiquement
  useEffect(() => {
    if (isDataLoaded && localBookingData?.property_id && localBookingData?.check_in && localBookingData?.check_out) {
      console.log('✅ Données prêtes, vérification de la disponibilité...');
      checkAvailability();
    }
  }, [isDataLoaded, localBookingData?.property_id, checkAvailability]);

  // ============================================
  // ✅ INITIATE PAYMENT - CORRIGÉ AVEC AXIOS
  // ============================================
  const initiatePayment = async () => {
    if (!localBookingData) {
      toast.error('❌ Données de réservation manquantes');
      return;
    }

    // ✅ Vérifier l'authentification
    const isAuthValid = await checkAuthentication();
    if (!isAuthValid) return;

    if (paymentMethod === 'mobile_money' && (!phoneNumber || phoneNumber.length < 8)) {
      setError('Veuillez entrer un numéro Mobile Money valide');
      return;
    }

    setLoading(true);
    setStatus('processing');
    setError('');

    try {
      // ✅ ÉTAPE 1 : Rafraîchir le CSRF token
      console.log('🔄 Rafraîchissement du token CSRF...');
      await refreshCsrfToken();
      
      // ✅ Vérifier que le cookie XSRF-TOKEN est présent
      const xsrfToken = getCookie('XSRF-TOKEN');
      if (!xsrfToken) {
        console.warn('⚠️ XSRF-TOKEN non trouvé, tentative de récupération...');
        await refreshCsrfToken();
      }
      console.log('✅ CSRF cookie prêt');

      // ✅ ÉTAPE 2 : Vérifier la disponibilité
      const isAvailable = await checkAvailability();
      
      if (!isAvailable) {
        setStatus('failed');
        setLoading(false);
        toast.error('❌ Ces dates ne sont pas disponibles.');
        return;
      }

      // ✅ ÉTAPE 3 : Récupérer le prix
      let pricePerNight = propertyPrice || localBookingData.price_per_night || 0;
      
      if (pricePerNight === 0 && localBookingData.property_id) {
        try {
          console.log('🔍 Récupération du prix depuis l\'API...');
          const response = await propertyService.getById(localBookingData.property_id);
          const property = response?.data || response;
          if (property?.price_per_night) {
            pricePerNight = Number(property.price_per_night);
            setPropertyPrice(pricePerNight);
            setLocalBookingData((prev: any) => ({
              ...prev,
              price_per_night: pricePerNight
            }));
            console.log('✅ Prix récupéré depuis l\'API:', pricePerNight);
          }
        } catch (error) {
          console.error('❌ Erreur récupération prix:', error);
        }
      }

      if (pricePerNight <= 0) {
        toast.error('❌ Le prix de ce logement n\'est pas disponible');
        setStatus('failed');
        setLoading(false);
        return;
      }

      // ✅ ÉTAPE 4 : Calculer les montants
      const userData = user || JSON.parse(localStorage.getItem('user') || '{}');
      const guestDetails = localBookingData?.guest_details || {
        full_name: `${userData?.first_name || ''} ${userData?.last_name || ''}`.trim() || 'Voyageur',
        email: userData?.email || '',
        phone: userData?.phone || '',
        address: ''
      };

      const nights = localBookingData.nights || 1;
      const subtotal = pricePerNight * nights;
      const serviceFee = Math.round(subtotal * 0.10);
      const totalAmount = subtotal + serviceFee;

      console.log('💰 Détail du calcul (10% de frais):', {
        pricePerNight,
        nights,
        subtotal,
        serviceFee,
        totalAmount
      });

      if (totalAmount <= 0) {
        toast.error('❌ Le montant total est invalide');
        setStatus('failed');
        setLoading(false);
        return;
      }

      // ✅ ÉTAPE 5 : Créer la réservation avec AXIOS
      const bookingPayload = {
        property_id: localBookingData.property_id,
        check_in: localBookingData.check_in,
        check_out: localBookingData.check_out,
        guests_count: localBookingData.guests || 1,
        payment_method: 'fedapay' as const,
        guest_details: guestDetails,
        payment_option: '100' as const,
        total_amount: totalAmount,
        payment_amount: totalAmount,
        nights: localBookingData.nights || 1,
        special_requests: localBookingData.special_requests || undefined
      };

      const rawPhone = phoneNumber || guestDetails.phone || '69000000';
      const formattedPhone = formatPhoneForFedapay(rawPhone);
      
      console.log('📱 Formatage du téléphone:', {
        raw: rawPhone,
        formatted: formattedPhone,
        isValid: /^\+229[0-9]{8}$/.test(formattedPhone)
      });

      if (!/^\+229[0-9]{8}$/.test(formattedPhone)) {
        setError(`Format de téléphone invalide: ${formattedPhone}`);
        toast.error('❌ Numéro de téléphone invalide');
        setLoading(false);
        return;
      }

      const bookingDataPayload = {
        property_id: localBookingData.property_id,
        check_in: localBookingData.check_in,
        check_out: localBookingData.check_out,
        guests_count: localBookingData.guests || 1,
        adults: localBookingData.adults || localBookingData.guests || 1,
        children: localBookingData.children || 0,
        babies: localBookingData.babies || 0,
        pets: localBookingData.pets || 0,
        payment_method: 'fedapay' as const,
        guest_details: guestDetails,
        payment_option: '100' as const,
        total_amount: totalAmount,
        payment_amount: totalAmount,
        nights: localBookingData.nights || 1,
        special_requests: localBookingData.special_requests || undefined,
        property_title: localBookingData.property_title || undefined,
      };

      const paymentData = {
        amount: Math.round(totalAmount),
        currency: 'XAF' as const,
        customer: {
          firstname: guestDetails.full_name.split(' ')[0] || 'Client',
          lastname: guestDetails.full_name.split(' ').slice(1).join(' ') || 'Client',
          email: guestDetails.email || 'client@email.com',
          phone: formattedPhone,
        },
        description: `Réservation - ${localBookingData?.property_title || 'Logement'}`,
        reference: `BOOK-${Date.now()}`,
        booking_data: bookingDataPayload,
        callback_url: `${window.location.origin}/fedapay-callback`,
        cancel_url: `${window.location.origin}/fedapay-cancel`
      };

      console.log('📤 Données Fedapay:', paymentData);

      const paymentResponse = await v1Api.post('/payments/fedapay/initiate', paymentData);
      console.log('📥 Réponse paiement:', paymentResponse.data);

      const paymentResult = paymentResponse.data;

      if (paymentResult.success && paymentResult.data?.payment_url) {
        setTransactionId(paymentResult.data.id);
        setStatus('pending');
        toast.success('✅ Redirection vers Fedapay...');
        
        sessionStorage.setItem('fedapay_transaction_id', paymentResult.data.id);
        sessionStorage.setItem('fedapay_booking_data', JSON.stringify(bookingDataPayload));
        
        const redirectUrl = paymentResult.data.payment_url;
        console.log('🔗 URL de redirection:', redirectUrl);
        
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 1500);
      } else {
        throw new Error(paymentResult.data?.message || 'URL de paiement non reçue');
      }

    } catch (error: any) {
      console.error('❌ Erreur paiement:', error);
      
      let errorMessage = 'Erreur lors du paiement';
      
      // ✅ Gestion des erreurs 401 (Unauthorized)
      if (error.response?.status === 401) {
        errorMessage = 'Session expirée. Veuillez vous reconnecter.';
        toast.error('❌ Session expirée');
        
        localStorage.removeItem('user');
        localStorage.removeItem('userType');
        
        setTimeout(() => {
          if (onNavigate) {
            onNavigate({ name: 'auth', search: 'redirect=payment&session_expired=true' });
          } else {
            window.location.href = '/auth?redirect=payment&session_expired=true';
          }
        }, 1000);
        return;
      }
      
      // ✅ Gestion des erreurs 419 (CSRF)
      if (error.response?.status === 419 || error.message?.includes('419') || error.message?.includes('CSRF')) {
        errorMessage = 'Erreur de sécurité (CSRF). Veuillez rafraîchir la page et réessayer.';
        toast.error('🔄 Erreur CSRF, tentative de récupération...');
        
        await refreshCsrfToken();
        
        setTimeout(() => {
          setLoading(false);
          setStatus('idle');
          initiatePayment();
        }, 2000);
        return;
      }
      
      // ✅ Gestion des erreurs de validation
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        if (typeof errors === 'object') {
          const messages = Object.values(errors).flat();
          errorMessage = messages.join(', ');
        } else {
          errorMessage = errors;
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setStatus('failed');
      setError(errorMessage);
      toast.error('❌ ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // ✅ RENDU DES STATUTS
  // ============================================
  const renderStatus = () => {
    if (status === 'processing') {
      return (
        <div className="text-center py-8">
          <Loader2 className="w-16 h-16 text-[#00c9a7] animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-[#0F2940] mb-2">Préparation du paiement...</h3>
          <p className="text-gray-500 text-sm">Nous sécurisons votre transaction</p>
        </div>
      );
    }

    if (status === 'pending') {
      return (
        <div className="text-center py-8">
          <Loader2 className="w-16 h-16 text-[#00c9a7] animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-[#0F2940] mb-2">Redirection vers Fedapay...</h3>
          <p className="text-gray-500 text-sm">Vous allez être redirigé vers la page de paiement sécurisée</p>
        </div>
      );
    }

    if (status === 'success') {
      return (
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-[#0F2940] mb-2">✅ Paiement réussi !</h3>
          <p className="text-gray-600 mb-2">Votre réservation est confirmée.</p>
          <p className="text-gray-400 text-sm">Redirection vers l'accueil dans quelques secondes...</p>
          <button
            onClick={() => {
              if (onNavigate) {
                onNavigate({ name: 'home' });
              } else {
                navigate('/');
              }
            }}
            className="mt-4 px-6 py-2 bg-[#00c9a7] text-white rounded-xl hover:bg-[#00b892] transition flex items-center gap-2 mx-auto"
          >
            <Home className="w-4 h-4" />
            Accueil
          </button>
        </div>
      );
    }

    if (status === 'failed') {
      return (
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-[#0F2940] mb-2">❌ Paiement échoué</h3>
          <p className="text-gray-600 mb-4">{error || 'Une erreur est survenue'}</p>
          <button
            onClick={() => {
              setStatus('idle');
              setError('');
            }}
            className="px-6 py-2 bg-[#00c9a7] text-white rounded-xl hover:bg-[#00b892] transition"
          >
            Réessayer
          </button>
        </div>
      );
    }

    return null;
  };

  // ============================================
  // ✅ RENDU DU FORMULAIRE DE PAIEMENT
  // ============================================
  const renderPaymentForm = () => {
    if (status !== 'idle') return null;

    const pricePerNight = propertyPrice || localBookingData?.price_per_night || 0;
    const nights = localBookingData?.nights || 1;
    const subtotal = pricePerNight * nights;
    const serviceFee = Math.round(subtotal * 0.10);
    const totalAmount = subtotal + serviceFee;

    return (
      <div className="space-y-6">
        {/* Résumé de la réservation */}
        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="font-semibold text-[#0F2940] mb-3 text-sm">📋 Résumé de votre réservation</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Propriété</span>
              <span className="font-medium">{localBookingData?.property_title || 'Non spécifié'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Nuits</span>
              <span className="font-medium">{nights} nuits</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Prix par nuit</span>
              <span className="font-medium">{pricePerNight.toLocaleString()} FCFA</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Frais de service (10%)</span>
              <span className="font-medium">{serviceFee.toLocaleString()} FCFA</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold text-[#0F2940]">
              <span>Total</span>
              <span className="text-[#00c9a7] text-lg">{totalAmount.toLocaleString()} FCFA</span>
            </div>
          </div>
        </div>

        {/* Indicateur de disponibilité */}
        <div className="flex items-center gap-2 text-sm bg-gray-50 p-3 rounded-xl">
          <Calendar className="w-4 h-4 text-[#00c9a7]" />
          <span className="text-gray-600">Dates sélectionnées :</span>
          <span className="font-medium">
            {localBookingData?.check_in ? new Date(localBookingData.check_in).toLocaleDateString('fr-FR') : '-'}
            {' → '}
            {localBookingData?.check_out ? new Date(localBookingData.check_out).toLocaleDateString('fr-FR') : '-'}
          </span>
          {availabilityStatus === 'available' && (
            <span className="text-green-600 text-xs bg-green-50 px-2 py-0.5 rounded-full">✓ Disponible</span>
          )}
          {availabilityStatus === 'unavailable' && (
            <span className="text-red-600 text-xs bg-red-50 px-2 py-0.5 rounded-full">✗ Non disponible</span>
          )}
        </div>

        {/* Informations utilisateur */}
        {user && (
          <div className="bg-blue-50 rounded-xl p-3 text-sm">
            <p className="font-medium text-[#0F2940] mb-1">👤 Vous payez en tant que :</p>
            <p className="text-gray-600">{user.first_name} {user.last_name}</p>
            <p className="text-gray-500 text-xs">{user.email}</p>
          </div>
        )}

        {/* Méthode de paiement */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Méthode de paiement
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setPaymentMethod('mobile_money');
                setError('');
              }}
              className={`p-3 rounded-xl border-2 transition ${
                paymentMethod === 'mobile_money'
                  ? 'border-[#00c9a7] bg-[#00c9a7]/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Smartphone className={`w-5 h-5 ${paymentMethod === 'mobile_money' ? 'text-[#00c9a7]' : 'text-gray-400'}`} />
                <span className="text-sm font-medium">Mobile Money</span>
              </div>
            </button>
            <button
              onClick={() => {
                setPaymentMethod('card');
                setError('');
              }}
              className={`p-3 rounded-xl border-2 transition ${
                paymentMethod === 'card'
                  ? 'border-[#00c9a7] bg-[#00c9a7]/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <CreditCard className={`w-5 h-5 ${paymentMethod === 'card' ? 'text-[#00c9a7]' : 'text-gray-400'}`} />
                <span className="text-sm font-medium">Carte bancaire</span>
              </div>
            </button>
          </div>
        </div>

        {/* Numéro de téléphone pour Mobile Money */}
        {paymentMethod === 'mobile_money' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numéro de téléphone (Mobile Money)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">+229</span>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  setError('');
                }}
                placeholder="90 00 00 00"
                className="w-full pl-14 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#00c9a7] focus:border-transparent text-sm"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Vous recevrez un code de confirmation sur ce numéro
            </p>
          </div>
        )}

        {/* Message d'erreur */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Bouton de paiement */}
        <button
          onClick={initiatePayment}
          disabled={loading || availabilityStatus === 'unavailable' || propertyPrice <= 0 || !isAuthenticated}
          className={`w-full py-3 rounded-xl font-semibold transition transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
            availabilityStatus === 'unavailable' || propertyPrice <= 0 || !isAuthenticated
              ? 'bg-gray-300 text-gray-500' 
              : 'bg-gradient-to-r from-[#00c9a7] to-[#00a887] text-white hover:shadow-lg'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Chargement...
            </>
          ) : !isAuthenticated ? (
            'Veuillez vous connecter'
          ) : availabilityStatus === 'unavailable' ? (
            'Dates non disponibles'
          ) : propertyPrice <= 0 ? (
            'Prix non disponible'
          ) : (
            <>
              <Banknote className="w-5 h-5" />
              Payer maintenant
            </>
          )}
        </button>

        <p className="text-xs text-center text-gray-400">
          En cliquant sur "Payer maintenant", vous acceptez nos conditions générales
        </p>
      </div>
    );
  };

  // ============================================
  // ✅ RENDU PRINCIPAL
  // ============================================
  return (
    <div className="min-h-screen bg-[#f4fffe] py-10">
      <div className="max-w-lg mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => {
              if (onNavigate) {
                onNavigate({ name: 'booking', id: localBookingData?.property_id?.toString() });
              } else {
                navigate(-1);
              }
            }}
            className="p-2 rounded-full hover:bg-gray-100 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-[#0F2940]">Paiement sécurisé</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#e2f5f2]">
          {/* Sécurité */}
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-6 bg-gray-50 px-4 py-2 rounded-lg">
            <Lock className="w-4 h-4 text-[#00c9a7]" />
            <span>Paiement sécurisé par Fedapay</span>
            <span className="mx-1">·</span>
            <Shield className="w-4 h-4 text-[#00c9a7]" />
            <span>Transaction cryptée</span>
          </div>

          {/* Formulaire ou statut */}
          {renderPaymentForm()}
          {status !== 'idle' && renderStatus()}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Sécurisé
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Garanti
            </span>
            <span>·</span>
            <button
              onClick={() => {
                if (onNavigate) {
                  onNavigate({ name: 'home' });
                } else {
                  navigate('/');
                }
              }}
              className="flex items-center gap-1 hover:text-[#00c9a7] transition"
            >
              <Home className="w-3 h-3" />
              Accueil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
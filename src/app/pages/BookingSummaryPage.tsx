// src/app/pages/BookingSummaryPage.tsx
import React, { useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, Calendar, User, MessageCircle, Lock, Shield, 
  Smartphone, CreditCard, Eye, EyeOff, AlertCircle, 
  CheckCircle, Home, Users, Info, Star, Receipt
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import propertyService from '../../services/property.service';
import bookingService from '../../services/booking.service';
import { BookingData } from '../types/booking';
import toast from 'react-hot-toast';

interface BookingSummaryPageProps {
    onNavigate?: (route: any) => void;
    id?: string;
    search?: string;
}

export function BookingSummaryPage({ onNavigate, id, search }: BookingSummaryPageProps) {
    const params = useParams<{ id: string }>();
    const propertyId = id || params.id;
    const location = useLocation();
    const { user } = useAuth();
    const [showPaymentStep, setShowPaymentStep] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'mobile_money' | 'card'>('mobile_money');
    const [mobileProvider, setMobileProvider] = useState<'MTN' | 'Moov' | 'Orange'>('MTN');
    const [mobileMoneyNumber, setMobileMoneyNumber] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvv, setCardCvv] = useState('');
    const [cardName, setCardName] = useState('');
    const [showCvv, setShowCvv] = useState(false);
    const [paymentError, setPaymentError] = useState('');
    const [isPaying, setIsPaying] = useState(false);

    const queryString = search || location.search;
    const searchParams = new URLSearchParams(queryString.startsWith('?') ? queryString.substring(1) : queryString);
    
    const checkIn = searchParams.get('check_in') || '';
    const checkOut = searchParams.get('check_out') || '';
    const guestsParam = searchParams.get('guests') || '1';
    const guests = parseInt(guestsParam);
    const nightsParam = searchParams.get('nights') || '1';
    const nights = parseInt(nightsParam);
    const totalParam = searchParams.get('total') || '0';
    const total = parseFloat(totalParam);

    const { data: propertyData, isLoading } = useQuery({
        queryKey: ['property', propertyId],
        queryFn: () => propertyService.getById(parseInt(propertyId || '0')),
        enabled: !!propertyId,
    });

    const property = propertyData?.data || propertyData;
    const pricePerNight = property?.price_per_night || 0;

    const formatCardNumber = (value: string) => {
        const cleaned = value.replace(/\s/g, '');
        const groups = cleaned.match(/.{1,4}/g);
        return groups ? groups.join(' ') : cleaned;
    };

    const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatCardNumber(e.target.value);
        setCardNumber(formatted);
    };

    const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.slice(0, 2) + '/' + value.slice(2, 4);
        }
        setCardExpiry(value);
    };

    const validatePaymentInfo = () => {
        if (paymentMethod === 'mobile_money') {
            if (!mobileProvider) {
                setPaymentError('Veuillez sélectionner votre opérateur');
                return false;
            }
            if (!mobileMoneyNumber || mobileMoneyNumber.length < 8) {
                setPaymentError('Numéro Mobile Money invalide');
                return false;
            }
        } else {
            const cleanCardNumber = cardNumber.replace(/\s/g, '');
            if (!cardNumber || cleanCardNumber.length < 16) {
                setPaymentError('Numéro de carte invalide');
                return false;
            }
            if (!cardExpiry || !cardExpiry.includes('/')) {
                setPaymentError('Date d\'expiration invalide');
                return false;
            }
            if (!cardCvv || cardCvv.length < 3) {
                setPaymentError('CVV invalide');
                return false;
            }
            if (!cardName) {
                setPaymentError('Nom sur la carte requis');
                return false;
            }
        }
        return true;
    };

    const handleConfirmPayment = async () => {
        if (!validatePaymentInfo()) return;
        
        setIsPaying(true);
        setPaymentError('');
        
        // Simuler le traitement du paiement
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const bookingData = {
            property_id: parseInt(propertyId || '0'),
            check_in: checkIn,
            check_out: checkOut,
            guests_count: guests,
            payment_method: paymentMethod,
            mobile_money_provider: paymentMethod === 'mobile_money' ? mobileProvider : undefined,
            mobile_money_number: paymentMethod === 'mobile_money' ? mobileMoneyNumber : undefined,
            guest_details: {
                full_name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'Voyageur',
                email: user?.email || '',
                phone: user?.phone || '',
                address: null
            },
            payment_option: '100',
            total_amount: total,
            payment_amount: total,
            nights: nights
        };
        
        try {
            const response = await bookingService.create(bookingData);
            const bookingId = response?.booking?.id || response?.data?.booking?.id || response?.id;
            
            if (bookingId) {
                toast.success('Réservation confirmée !');
                setTimeout(() => {
                    setIsPaying(false);
                    onNavigate?.({ name: 'confirmation', id: bookingId.toString() });
                }, 1500);
            } else {
                setPaymentError('Erreur lors de la création de la réservation');
                setIsPaying(false);
            }
        } catch (err: any) {
            console.error('Erreur:', err);
            setPaymentError(err.response?.data?.message || 'Une erreur est survenue');
            setIsPaying(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-[#f4fffe]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00c9a7]"></div>
            </div>
        );
    }

    if (!property) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-[#f4fffe] p-4">
                <div className="text-center bg-white rounded-2xl p-8 max-w-md">
                    <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-red-500 mb-4">Propriété introuvable</p>
                    <button onClick={() => onNavigate?.({ name: 'home' })} className="text-[#00c9a7] underline">Retour à l'accueil</button>
                </div>
            </div>
        );
    }

    const subtotal = pricePerNight * nights;
    const serviceFee = subtotal * 0.10;

    return (
        <div className="bg-[#f4fffe] min-h-screen pb-32 md:pb-12">
            <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3 shadow-sm">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => onNavigate?.({ name: 'listing', id: propertyId })} 
                        className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition active:bg-gray-200"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="font-semibold text-[#0F2940] text-base sm:text-lg">
                            {!showPaymentStep ? 'Résumé de votre réservation' : 'Paiement sécurisé'}
                        </h1>
                        <p className="text-xs text-gray-500">
                            {!showPaymentStep ? 'Vérifiez vos informations' : 'Finalisez votre réservation'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-[1200px] mx-auto px-4 py-4 md:py-6">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Colonne gauche - Récapitulatif */}
                    <div className="flex-1 space-y-4">
                        {/* Logement */}
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                            <div className="flex gap-4">
                                <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                                    <img 
                                        src={property.images?.[0] || property.image} 
                                        alt={property.title}
                                        className="w-full h-full object-cover"
                                        onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.jpg'; }}
                                    />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-[#0F2940]">{property.title}</h3>
                                    <p className="text-sm text-gray-500 mt-0.5">{property.district}, {property.city}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                                        <span className="text-sm">{property.average_rating || 4.5}</span>
                                        <span className="text-gray-400 text-sm">({property.reviews_count || 0} avis)</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Dates et voyageurs */}
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1">
                                        <Calendar className="w-4 h-4" /> Arrivée
                                    </h4>
                                    <p className="font-semibold">{new Date(checkIn).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1">
                                        <Calendar className="w-4 h-4" /> Départ
                                    </h4>
                                    <p className="font-semibold">{new Date(checkOut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                </div>
                            </div>
                            <div className="mt-3 pt-3 border-t">
                                <h4 className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1">
                                    <Users className="w-4 h-4" /> Voyageurs
                                </h4>
                                <p className="font-semibold">{guests} personne{guests > 1 ? 's' : ''}</p>
                            </div>
                        </div>

                        {/* Détail des prix */}
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                            <h4 className="font-semibold text-[#0F2940] mb-3 flex items-center gap-2">
                                <Receipt className="w-4 h-4 text-[#00c9a7]" />
                                Détail des prix
                            </h4>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">{pricePerNight.toLocaleString()} FCFA × {nights} nuits</span>
                                    <span>{subtotal.toLocaleString()} FCFA</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Frais de service (10%)</span>
                                    <span>{serviceFee.toLocaleString()} FCFA</span>
                                </div>
                                <div className="border-t pt-2 mt-2">
                                    <div className="flex justify-between font-bold">
                                        <span>Total</span>
                                        <span className="text-[#00c9a7] text-lg">{total.toLocaleString()} FCFA</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Colonne droite */}
                    <div className="lg:w-96 space-y-4">
                        {!showPaymentStep ? (
                            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 sticky top-20">
                                <h2 className="text-xl font-bold text-[#0F2940] mb-4">Récapitulatif</h2>
                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Logement</span>
                                        <span className="font-medium">{property.title}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Dates</span>
                                        <span className="font-medium">{new Date(checkIn).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} → {new Date(checkOut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Durée</span>
                                        <span className="font-medium">{nights} nuit{nights > 1 ? 's' : ''}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Voyageurs</span>
                                        <span className="font-medium">{guests} personne{guests > 1 ? 's' : ''}</span>
                                    </div>
                                </div>
                                <div className="border-t pt-3 mb-6">
                                    <div className="flex justify-between font-bold">
                                        <span>Total à payer</span>
                                        <span className="text-[#00c9a7] text-xl">{total.toLocaleString()} FCFA</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setShowPaymentStep(true)}
                                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00c9a7] to-[#00a887] text-white font-semibold hover:shadow-lg transition-all"
                                >
                                    Confirmer et payer
                                </button>
                                <div className="flex items-center justify-center gap-4 text-xs text-gray-400 mt-3">
                                    <div className="flex items-center gap-1"><Lock className="w-3 h-3" /><span>Paiement sécurisé</span></div>
                                    <div className="flex items-center gap-1"><Shield className="w-3 h-3" /><span>Garantie BF-Immo</span></div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 sticky top-20">
                                <div className="flex items-center gap-2 mb-4">
                                    <button onClick={() => setShowPaymentStep(false)} className="text-[#00c9a7] hover:underline text-sm">← Retour</button>
                                </div>
                                <h2 className="text-xl font-bold text-[#0F2940] mb-4">Paiement</h2>
                                
                                <div className="bg-gradient-to-r from-[#00c9a7]/10 to-[#0F2940]/10 rounded-xl p-4 text-center mb-4">
                                    <p className="text-sm text-gray-600">Montant à payer</p>
                                    <p className="text-2xl font-bold text-[#00c9a7]">{total.toLocaleString()} FCFA</p>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Méthode de paiement</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={() => { setPaymentMethod('mobile_money'); setPaymentError(''); }} className={`flex flex-col items-center gap-2 p-3 border-2 rounded-xl transition-all ${paymentMethod === 'mobile_money' ? 'border-[#00c9a7] bg-[#00c9a7]/5' : 'border-gray-200'}`}>
                                            <Smartphone className={`w-5 h-5 ${paymentMethod === 'mobile_money' ? 'text-[#00c9a7]' : 'text-gray-400'}`} />
                                            <span className="text-xs">Mobile Money</span>
                                        </button>
                                        <button onClick={() => { setPaymentMethod('card'); setPaymentError(''); }} className={`flex flex-col items-center gap-2 p-3 border-2 rounded-xl transition-all ${paymentMethod === 'card' ? 'border-[#00c9a7] bg-[#00c9a7]/5' : 'border-gray-200'}`}>
                                            <CreditCard className={`w-5 h-5 ${paymentMethod === 'card' ? 'text-[#00c9a7]' : 'text-gray-400'}`} />
                                            <span className="text-xs">Carte bancaire</span>
                                        </button>
                                    </div>
                                </div>

                                {paymentMethod === 'mobile_money' && (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Opérateur</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {(['MTN', 'Moov', 'Orange'] as const).map((provider) => (
                                                    <button key={provider} onClick={() => { setMobileProvider(provider); setPaymentError(''); }} className={`py-2 rounded-xl border transition-all text-sm ${mobileProvider === provider ? 'border-[#00c9a7] bg-[#00c9a7]/5 text-[#00c9a7]' : 'border-gray-200'}`}>
                                                        {provider}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Numéro Mobile Money</label>
                                            <input type="tel" value={mobileMoneyNumber} onChange={(e) => { setMobileMoneyNumber(e.target.value); setPaymentError(''); }} placeholder="97 00 00 00" className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#00c9a7]" />
                                        </div>
                                    </div>
                                )}

                                {paymentMethod === 'card' && (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de carte</label>
                                            <input type="text" value={cardNumber} onChange={handleCardNumberChange} placeholder="1234 5678 9012 3456" maxLength={19} className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#00c9a7]" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Expiration</label>
                                                <input type="text" value={cardExpiry} onChange={handleExpiryChange} placeholder="MM/AA" maxLength={5} className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#00c9a7]" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                                                <div className="relative">
                                                    <input type={showCvv ? 'text' : 'password'} value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} placeholder="123" maxLength={4} className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#00c9a7] pr-8" />
                                                    <button type="button" onClick={() => setShowCvv(!showCvv)} className="absolute right-2 top-1/2 -translate-y-1/2">{showCvv ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Nom sur la carte</label>
                                            <input type="text" value={cardName} onChange={(e) => setCardName(e.target.value.toUpperCase())} placeholder="JEAN DUPONT" className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#00c9a7] uppercase" />
                                        </div>
                                    </div>
                                )}

                                {paymentError && <div className="p-2 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 text-center">{paymentError}</div>}

                                <button onClick={handleConfirmPayment} disabled={isPaying} className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-[#00c9a7] to-[#00a887] text-white font-semibold disabled:opacity-50">
                                    {isPaying ? <div className="flex justify-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Paiement...</div> : `Payer ${total.toLocaleString()} FCFA`}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
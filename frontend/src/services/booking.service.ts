// services/booking.service.ts
import { v1Api } from './api';

export interface BookingData {
    property_id: number;
    check_in: string;
    check_out: string;
    guests_count: number;
    guests?: number;
    payment_method: 'mobile_money' | 'card' | 'bank_transfer' | 'fedapay';
    mobile_money_provider?: 'MTN' | 'Moov' | 'Orange';
    mobile_money_number?: string;
    guest_details: {
        full_name: string;
        email: string;
        phone: string;
        address?: string;
        nationality?: string;
        id_type?: string;
        id_number?: string;
    };
    payment_option?: '50' | '100';
    total_amount?: number;
    payment_amount?: number;
    nights?: number;
    special_requests?: string;
    adults?: number;
    children?: number;
    babies?: number;
    pets?: number;
}

class BookingService {
    /**
     * Créer une réservation (logement)
     */
    async create(data: BookingData) {
        const payload: any = {
            property_id: data.property_id,
            check_in: data.check_in,
            check_out: data.check_out,
            guests_count: data.guests_count || data.guests || 1,
            payment_method: data.payment_method || 'fedapay',
            guest_details: data.guest_details,
            payment_option: data.payment_option || '100',
        };

        if (data.mobile_money_provider) payload.mobile_money_provider = data.mobile_money_provider;
        if (data.mobile_money_number) payload.mobile_money_number = data.mobile_money_number;
        if (data.total_amount) payload.total_amount = data.total_amount;
        if (data.payment_amount) payload.payment_amount = data.payment_amount;
        if (data.nights) payload.nights = data.nights;
        if (data.special_requests) payload.special_requests = data.special_requests;
        if (data.adults !== undefined) payload.adults = data.adults;
        if (data.children !== undefined) payload.children = data.children;
        if (data.babies !== undefined) payload.babies = data.babies;
        if (data.pets !== undefined) payload.pets = data.pets;
        
        console.log('📤 Envoi de la réservation:', payload);
        
        try {
            const response = await v1Api.post('/bookings', payload);
            console.log('📥 Réponse de la réservation:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Erreur création réservation:', error);
            
            if (error.response?.status === 422) {
                const errors = error.response?.data?.errors;
                let errorMessage = 'Erreur de validation';
                if (errors) {
                    if (typeof errors === 'object') {
                        const messages = Object.values(errors).flat();
                        errorMessage = messages.join(', ');
                    } else {
                        errorMessage = errors;
                    }
                } else if (error.response?.data?.message) {
                    errorMessage = error.response.data.message;
                }
                throw new Error(errorMessage);
            }
            
            if (error.response?.status === 401) {
                console.error('🔒 Token invalide - Redirection vers login');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                throw new Error('Session expirée, veuillez vous reconnecter');
            }
            
            throw new Error(error.response?.data?.message || error.message || 'Erreur lors de la création de la réservation');
        }
    }

    /**
     * Récupérer mes réservations (voyageur)
     */
    async getMyBookings(status?: string) {
        const url = status ? `/traveler/bookings?status=${status}` : '/traveler/bookings';
        try {
            const response = await v1Api.get(url);
            return response.data;
        } catch (error: any) {
            console.error('❌ Erreur récupération réservations:', error);
            throw new Error(error.response?.data?.message || 'Impossible de récupérer vos réservations');
        }
    }

    /**
     * Récupérer une réservation par ID
     */
    async getById(id: number) {
        try {
            const response = await v1Api.get(`/bookings/${id}`);
            return response.data;
        } catch (error: any) {
            console.error(`❌ Erreur récupération réservation ${id}:`, error);
            throw new Error(error.response?.data?.message || 'Réservation introuvable');
        }
    }

    /**
     * Annuler une réservation
     */
    async cancel(id: number, reason?: string) {
        try {
            const payload = reason ? { cancellation_reason: reason } : {};
            const response = await v1Api.post(`/bookings/${id}/cancel`, payload);
            return response.data;
        } catch (error: any) {
            console.error('❌ Erreur annulation:', error);
            if (error.response?.status === 422) {
                const errors = error.response?.data?.errors;
                if (errors && typeof errors === 'object') {
                    const messages = Object.values(errors).flat();
                    throw new Error(messages.join(', '));
                }
                throw new Error(error.response?.data?.message || 'La réservation ne peut pas être annulée');
            }
            throw new Error(error.response?.data?.message || 'Impossible d\'annuler la réservation');
        }
    }

    /**
     * Confirmer le paiement
     */
    async confirmPayment(id: number) {
        try {
            const response = await v1Api.post(`/bookings/${id}/confirm-payment`, {});
            return response.data;
        } catch (error: any) {
            console.error('❌ Erreur confirmation paiement:', error);
            throw new Error(error.response?.data?.message || 'Erreur lors de la confirmation du paiement');
        }
    }

    /**
     * Mettre à jour les informations de la réservation
     */
    async update(id: number, data: Partial<BookingData>) {
        try {
            const response = await v1Api.put(`/bookings/${id}`, data);
            return response.data;
        } catch (error: any) {
            console.error(`❌ Erreur mise à jour réservation ${id}:`, error);
            throw new Error(error.response?.data?.message || 'Impossible de mettre à jour la réservation');
        }
    }

    /**
     * Récupérer les réservations d'une propriété (pour hôte)
     */
    async getPropertyBookings(propertyId: number) {
        try {
            const response = await v1Api.get(`/properties/${propertyId}/bookings`);
            return response.data;
        } catch (error: any) {
            console.error(`❌ Erreur récupération réservations propriété ${propertyId}:`, error);
            throw new Error(error.response?.data?.message || 'Impossible de récupérer les réservations');
        }
    }

    /**
     * Récupérer les statistiques des réservations
     */
    async getBookingStats() {
        try {
            const response = await v1Api.get('/traveler/bookings/stats');
            return response.data;
        } catch (error: any) {
            console.error('❌ Erreur récupération statistiques:', error);
            throw new Error(error.response?.data?.message || 'Impossible de récupérer les statistiques');
        }
    }

    /**
     * Confirmer le paiement Fedapay
     */
    async confirmFedapayPayment(transactionId: string, bookingId: number) {
        try {
            const response = await v1Api.post('/payments/fedapay/confirm', {
                transaction_id: transactionId,
                booking_id: bookingId
            });
            return response.data;
        } catch (error: any) {
            console.error('❌ Erreur confirmation Fedapay:', error);
            throw new Error(error.response?.data?.message || 'Erreur lors de la confirmation du paiement Fedapay');
        }
    }

    /**
     * Vérifier le statut d'une transaction Fedapay
     */
    async getFedapayTransactionStatus(transactionId: string) {
        try {
            const response = await v1Api.get(`/payments/fedapay/status/${transactionId}`);
            return response.data;
        } catch (error: any) {
            console.error(`❌ Erreur vérification statut Fedapay ${transactionId}:`, error);
            throw new Error(error.response?.data?.message || 'Impossible de vérifier le statut du paiement');
        }
    }

    /**
     * Créer une réservation d'expérience
     */
    async createExperienceBooking(data: any) {
        const payload: any = {
            reservation_date: data.check_in || data.date,
            guests_count: data.total_guests || data.guests || 1,
            payment_method: data.payment_method || 'fedapay',
            guest_details: data.guest_details || {},
            special_requests: data.special_requests || '',
            transaction_id: data.transaction_id || null,
        };

        if (data.mobile_money_provider) payload.mobile_money_provider = data.mobile_money_provider;
        if (data.mobile_money_number) payload.mobile_money_number = data.mobile_money_number;

        console.log('📤 Envoi de la réservation expérience:', payload);
        console.log('📤 Experience ID:', data.experience_id);

        try {
            const response = await v1Api.post(`/traveler/experiences/${data.experience_id}/book`, payload);
            console.log('📥 Réponse de la réservation expérience:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Erreur création réservation expérience:', error);
            
            if (error.response?.status === 422) {
                const errors = error.response?.data?.errors;
                let errorMessage = 'Erreur de validation';
                if (errors) {
                    if (typeof errors === 'object') {
                        const messages = Object.values(errors).flat();
                        errorMessage = messages.join(', ');
                    } else {
                        errorMessage = errors;
                    }
                }
                throw new Error(errorMessage);
            }
            
            throw new Error(error.response?.data?.message || 'Erreur lors de la création de la réservation');
        }
    }

    /**
     * Créer une réservation de service
     */
    async createServiceBooking(data: any) {
        // ✅ Utiliser date comme check_in (pour les services)
        const reservationDate = data.date || data.check_in;
        
        if (!reservationDate) {
            throw new Error('La date de réservation est requise');
        }

        const payload: any = {
            reservation_date: reservationDate,
            guests_count: data.total_guests || data.guests || 1,
            payment_method: data.payment_method || 'fedapay',
            guest_details: data.guest_details || {},
            special_requests: data.special_requests || '',
            transaction_id: data.transaction_id || null,
            service_id: data.service_id,
        };

        if (data.mobile_money_provider) payload.mobile_money_provider = data.mobile_money_provider;
        if (data.mobile_money_number) payload.mobile_money_number = data.mobile_money_number;

        console.log('📤 Envoi de la réservation service:', payload);
        console.log('📤 Service ID:', data.service_id);

        try {
            const response = await v1Api.post(`/traveler/services/${data.service_id}/book`, payload);
            console.log('📥 Réponse de la réservation service:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Erreur création réservation service:', error);
            
            if (error.response?.status === 422) {
                const errors = error.response?.data?.errors;
                let errorMessage = 'Erreur de validation';
                if (errors) {
                    if (typeof errors === 'object') {
                        const messages = Object.values(errors).flat();
                        errorMessage = messages.join(', ');
                    } else {
                        errorMessage = errors;
                    }
                }
                throw new Error(errorMessage);
            }
            
            throw new Error(error.response?.data?.message || 'Erreur lors de la création de la réservation');
        }
    }
}

export default new BookingService();
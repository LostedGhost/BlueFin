// services/host.service.ts
import { v1Api } from './api'; // ✅ Utiliser v1Api pour toutes les routes protégées

export interface HostPropertyData {
    title: string;
    description: string;
    property_type: string;
    city: string;
    district: string;
    address?: string;
    bedrooms: number;
    beds: number;
    bathrooms: number;
    max_guests: number;
    price_per_night: number;
    cleaning_fee?: number;
    min_stay?: number;
}

export interface AmenitiesData {
    has_generator?: boolean;
    has_water_tank?: boolean;
    has_air_conditioning?: boolean;
    has_wifi?: boolean;
    has_parking?: boolean;
    has_pool?: boolean;
    has_kitchen?: boolean;
    has_tv?: boolean;
    has_security_guard?: boolean;
    has_breakfast?: boolean;
}

export interface HostExperienceFormData {
    name: string;
    description: string;
    location: string;
    price: number;
    total_places: number;
    images: File[];
    steps: string[];
    step_images: File[];
    availability?: any[];
    status?: 'draft' | 'pending' | 'active' | 'inactive' | 'rejected' | 'suspended';
}

export interface HostExperience {
    id: number;
    host_id: number;
    host_type: 'experience';
    name: string;
    description: string;
    location: string;
    price: string | number;
    total_places?: number;
    steps?: string[] | null;
    availability?: any[] | null;
    status: 'draft' | 'pending' | 'active' | 'inactive' | 'rejected' | 'suspended';
    is_published: boolean;
    published_at?: string | null;
    moderated_at?: string | null;
    moderation_notes?: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface HostExperienceConversation {
    experience: {
        id: number | null;
        name: string | null;
        location: string | null;
    };
    guest: {
        id: number | null;
        name: string | null;
        phone: string | null;
        photo: string | null;
    };
    last_message: {
        message: string;
        preview?: string;
        sent_at: string;
    } | null;
    unread_count: number;
}

class HostService {
    private normalizeExperienceMediaUrl(url?: string | null): string {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        if (url.startsWith('/storage/')) return `https://api.bluefin-immo.com${url}`;
        if (url.startsWith('storage/')) return `https://api.bluefin-immo.com/${url}`;
        return url;
    }

    private normalizeExperienceItem(experience: any): any {
        const rawAvailability = Array.isArray(experience?.availability) ? experience.availability : [];
        const rawSteps = Array.isArray(experience?.steps) ? experience.steps : [];
        const rawImages = Array.isArray(experience?.images) ? experience.images : [];

        const normalizedSteps: string[] = [];
        const stepImagesFromSteps: string[] = [];

        rawSteps.forEach((step: any) => {
            if (typeof step === 'string') {
                normalizedSteps.push(step);
                return;
            }

            if (step && typeof step === 'object') {
                normalizedSteps.push(String(step.description || ''));
                const imageCandidate = step.image_url || step.image_path || step.image;
                const resolved = this.normalizeExperienceMediaUrl(imageCandidate);
                if (resolved) {
                    stepImagesFromSteps.push(resolved);
                }
            }
        });

        const gallery = rawImages
            .map((image: any) => {
                if (typeof image === 'string') return this.normalizeExperienceMediaUrl(image);
                if (image && typeof image === 'object') {
                    return this.normalizeExperienceMediaUrl(image.url || image.image_url || image.path);
                }
                return '';
            })
            .filter(Boolean);

        const existingMeta =
            rawAvailability.find((item: any) => item && typeof item === 'object' && item.type === 'experience_meta') ||
            {};

        const mergedMeta = {
            ...existingMeta,
            type: 'experience_meta',
            capacity: existingMeta.capacity ?? experience?.total_places ?? 0,
            gallery: Array.isArray(existingMeta.gallery) && existingMeta.gallery.length > 0 ? existingMeta.gallery : gallery,
            step_images:
                Array.isArray(existingMeta.step_images) && existingMeta.step_images.length > 0
                    ? existingMeta.step_images
                    : stepImagesFromSteps,
        };

        const availabilityWithoutMeta = rawAvailability.filter(
            (item: any) => !(item && typeof item === 'object' && item.type === 'experience_meta')
        );

        return {
            ...experience,
            steps: normalizedSteps,
            availability: [mergedMeta, ...availabilityWithoutMeta],
        };
    }

    private appendFormDataValue(formData: FormData, key: string, value: any) {
        if (value === undefined || value === null) return;

        if (value instanceof File) {
            formData.append(key, value);
            return;
        }

        if (Array.isArray(value)) {
            value.forEach((item, index) => {
                this.appendFormDataValue(formData, `${key}[${index}]`, item);
            });
            return;
        }

        if (typeof value === 'object') {
            Object.entries(value).forEach(([childKey, childValue]) => {
                this.appendFormDataValue(formData, `${key}[${childKey}]`, childValue);
            });
            return;
        }

        formData.append(key, String(value));
    }

    // ==================== DASHBOARD ====================
    async getDashboard() {
        const response = await v1Api.get('/host/dashboard');
        return response.data;
    }

    // ==================== SERVICES ====================
    async getServices() {
        try {
            console.log('📤 Appel API: /host/services');
            const response = await v1Api.get('/host/services');
            console.log('📥 Réponse services:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Erreur getServices:', error);
            throw error;
        }
    }

    async createService(payload: any) {
        try {
            console.log('📤 Création service - payload:', payload);
            
            const formData = new FormData();
            formData.append('title', payload.title || '');
            formData.append('service_type', payload.service_type || '');
            formData.append('category', payload.category || '');
            formData.append('location', payload.location || '');
            formData.append('description', payload.description || '');
            formData.append('price', String(payload.price || 0));
            formData.append('duration_minutes', String(payload.duration_minutes || 60));
            formData.append('status', payload.status || 'draft');
            
            if (payload.availability) {
                formData.append('availability', JSON.stringify(payload.availability));
            }
            
            if (payload.images && payload.images.length > 0) {
                payload.images.forEach((file: File) => {
                    formData.append('images[]', file);
                });
            }
            
            const response = await v1Api.post('/host/services', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            
            console.log('✅ Réponse création:', response.data);
            return response.data;
            
        } catch (error: any) {
            console.error('❌ Erreur création service:', error);
            throw error;
        }
    }

    async updateService(id: number, payload: any) {
        try {
            const formData = new FormData();
            formData.append('_method', 'PUT');
            formData.append('title', payload.title || '');
            formData.append('service_type', payload.service_type || '');
            formData.append('category', payload.category || '');
            formData.append('location', payload.location || '');
            formData.append('description', payload.description || '');
            formData.append('price', String(payload.price || 0));
            formData.append('duration_minutes', String(payload.duration_minutes || 60));
            formData.append('status', payload.status || 'draft');
            
            if (payload.availability) {
                formData.append('availability', JSON.stringify(payload.availability));
            }
            
            if (payload.images && payload.images.length > 0) {
                payload.images.forEach((file: File) => {
                    formData.append('images[]', file);
                });
            }
            
            const response = await v1Api.post(`/host/services/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            
            return response.data;
            
        } catch (error: any) {
            console.error('❌ Erreur mise à jour:', error);
            throw error;
        }
    }

    async deleteService(id: number) {
        try {
            const response = await v1Api.delete(`/host/services/${id}`);
            return response.data;
        } catch (error: any) {
            console.error('❌ Erreur suppression:', error);
            throw error;
        }
    }

    async getServiceDashboard() {
        try {
            console.log('📤 Appel API: /host/services/dashboard');
            const response = await v1Api.get('/host/services/dashboard');
            console.log('📥 Réponse dashboard:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Erreur getServiceDashboard:', error);
            return {
                success: true,
                data: [],
                stats: {
                    total: 0,
                    active: 0,
                    pending: 0,
                    completed: 0,
                    cancelled: 0,
                    total_revenue: 0,
                    monthly_revenue: 0,
                    total_bookings: 0,
                    average_rating: 0,
                    total_reviews: 0
                }
            };
        }
    }

    // ==================== EXPÉRIENCES ====================
    async getExperiences() {
        const response = await v1Api.get('/host/experiences');
        const payload = response.data;
        const list = payload?.data?.data;

        if (Array.isArray(list)) {
            payload.data.data = list.map((item: any) => this.normalizeExperienceItem(item));
        }

        return payload;
    }

    async getExperience(id: number) {
        const response = await v1Api.get(`/host/experiences/${id}`);
        const payload = response.data;

        if (payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
            payload.data = this.normalizeExperienceItem(payload.data);
        }

        return payload;
    }

    async createExperience(data: any) {
        console.log('📥 createExperience reçu:', {
            hasImages: !!data.images,
            imagesCount: data.images?.length,
            hasStepImages: !!data.step_images,
            stepImagesCount: data.step_images?.length
        });

        const formData = new FormData();
        
        // Champs texte
        formData.append('name', data.name);
        formData.append('description', data.description);
        formData.append('location', data.location);
        formData.append('price', String(data.price));
        formData.append('total_places', String(data.total_places));
        if (data.status) formData.append('status', data.status);
        
        // Images de l'expérience
        if (data.images && Array.isArray(data.images) && data.images.length > 0) {
            console.log('📤 Ajout des images de l\'expérience:', data.images.length);
            data.images.forEach((image: File, index: number) => {
                if (image instanceof File) {
                    formData.append('images[]', image);
                    console.log(`  ✅ Image ${index}: ${image.name}`);
                }
            });
        }
        
        // Étapes
        if (data.steps && Array.isArray(data.steps) && data.steps.length > 0) {
            data.steps.forEach((step: string, index: number) => {
                formData.append(`steps[${index}]`, step);
            });
        }
        
        // Images des étapes
        if (data.step_images && Array.isArray(data.step_images) && data.step_images.length > 0) {
            console.log('📤 Ajout des images d\'étapes:', data.step_images.length);
            data.step_images.forEach((image: File, index: number) => {
                if (image instanceof File) {
                    formData.append('step_images[]', image);
                    console.log(`  ✅ Step image ${index}: ${image.name}`);
                }
            });
        }
        
        // Disponibilité
        if (Array.isArray(data.availability) && data.availability.length > 0) {
            data.availability.forEach((item: any, index: number) => {
                formData.append(`availability[${index}]`, JSON.stringify(item));
            });
        }
        
        console.log('📦 FormData final:');
        for (let pair of formData.entries()) {
            if (pair[1] instanceof File) {
                console.log(`  ${pair[0]}: File(${pair[1].name}, ${pair[1].size} bytes)`);
            } else {
                console.log(`  ${pair[0]}: ${pair[1]}`);
            }
        }
        
        const response = await v1Api.post('/host/experiences', formData);
        return response.data;
    }

    async updateExperience(id: number, payload: any): Promise<any> {
        const formData = new FormData();
        
        const textFields = ['name', 'description', 'location', 'price', 'total_places', 'status'];
        textFields.forEach(field => {
            if (payload[field] !== undefined && payload[field] !== null && payload[field] !== '') {
                formData.append(field, String(payload[field]));
            }
        });

        if (payload.images && Array.isArray(payload.images) && payload.images.length > 0) {
            payload.images.forEach((file: File) => {
                if (file instanceof File) {
                    formData.append('images[]', file);
                }
            });
        }

        if (payload.steps && Array.isArray(payload.steps) && payload.steps.length > 0) {
            payload.steps.forEach((step: string) => {
                formData.append('steps[]', step);
            });
        }

        if (payload.step_images && Array.isArray(payload.step_images) && payload.step_images.length > 0) {
            payload.step_images.forEach((file: File) => {
                if (file instanceof File) {
                    formData.append('step_images[]', file);
                }
            });
        }

        if (payload.availability !== undefined && payload.availability !== null) {
            let availabilityData = payload.availability;
            
            if (Array.isArray(availabilityData)) {
                const cleanAvailability = availabilityData
                    .map(item => {
                        if (typeof item === 'string') {
                            try {
                                return JSON.parse(item);
                            } catch {
                                return null;
                            }
                        }
                        return item;
                    })
                    .filter(item => item !== null);
                
                cleanAvailability.forEach((item, index) => {
                    if (typeof item === 'object') {
                        formData.append(`availability[${index}]`, JSON.stringify(item));
                    } else {
                        formData.append(`availability[${index}]`, String(item));
                    }
                });
            } else if (typeof availabilityData === 'object') {
                formData.append('availability', JSON.stringify(availabilityData));
            } else {
                formData.append('availability', String(availabilityData));
            }
        }

        formData.append('_method', 'PUT');

        console.log('📦 FormData envoyé:');
        for (let [key, value] of formData.entries()) {
            if (value instanceof File) {
                console.log(`  ${key}: File(${value.name}, ${value.size} bytes)`);
            } else {
                console.log(`  ${key}: ${String(value).substring(0, 100)}...`);
            }
        }

        try {
            const response = await v1Api.post(`/host/experiences/${id}`, formData);
            return response.data;
        } catch (error: any) {
            console.error('❌ Erreur updateExperience:', error.response?.data || error.message);
            throw error;
        }
    }

    async deleteExperience(id: number) {
        const response = await v1Api.delete(`/host/experiences/${id}`);
        return response.data;
    }

    async getExperienceAvailability(experienceId: number) {
        const response = await v1Api.get(`/host/experiences/${experienceId}/availability`);
        return response.data;
    }

    async setExperienceAvailability(experienceId: number, availability: Array<{ date: string; slots: string[] }>) {
        const response = await v1Api.put(`/host/experiences/${experienceId}/availability`, { availability });
        return response.data;
    }

    // ==================== MESSAGES EXPÉRIENCES ====================
    async getExperienceConversations() {
        try {
            console.log('📥 Récupération des conversations expériences...');
            const response = await v1Api.get('/host/experiences/messages');
            console.log('✅ Conversations récupérées:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Erreur getExperienceConversations:', error.response?.data || error.message);
            throw error;
        }
    }

    async getExperienceMessages(experienceId: number, guestId: number) {
        const response = await v1Api.get(`/host/experiences/messages/${experienceId}/${guestId}`);
        return response.data;
    }

    async sendExperienceMessage(experienceId: number, guestId: number, data: { message: string }) {
        const response = await v1Api.post(`/host/experiences/messages/${experienceId}/${guestId}`, data);
        return response.data;
    }

    // ==================== STATISTIQUES ====================
    async getStatistics() {
        const response = await v1Api.get('/host/statistics');
        return response.data;
    }

    async getDailyStats(days: number = 30) {
        const response = await v1Api.get(`/host/statistics/daily?days=${days}`);
        return response.data;
    }

    async getPropertyStats() {
        const response = await v1Api.get('/host/statistics/properties');
        return response.data;
    }

    async getViewsDetails(propertyId: number) {
        const response = await v1Api.get(`/host/statistics/properties/${propertyId}/views`);
        return response.data;
    }

    async exportStats(startDate: string, endDate: string) {
        const response = await v1Api.get(`/host/statistics/export?start_date=${startDate}&end_date=${endDate}`, {
            responseType: 'blob'
        });
        return response.data;
    }

    // ==================== GESTION DES PROPRIÉTÉS ====================
    async getProperties() {
        const response = await v1Api.get('/host/properties');
        return response.data;
    }

    async createProperty(data: HostPropertyData) {
        const response = await v1Api.post('/host/properties', data);
        return response.data;
    }

    async getProperty(id: number) {
        const response = await v1Api.get(`/host/properties/${id}`);
        return response.data;
    }

    async updateProperty(id: number, data: Partial<HostPropertyData>) {
        const response = await v1Api.put(`/host/properties/${id}`, data);
        return response.data;
    }

    async deleteProperty(id: number) {
        const response = await v1Api.delete(`/host/properties/${id}`);
        return response.data;
    }

    // ==================== PHOTOS ====================
    async addPhotos(propertyId: number, photos: File[]) {
        const formData = new FormData();
        photos.forEach(photo => {
            formData.append('photos[]', photo);
        });
        const response = await v1Api.post(`/host/properties/${propertyId}/photos`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }

    async deletePhoto(propertyId: number, photoId: number) {
        const response = await v1Api.delete(`/host/properties/${propertyId}/photos/${photoId}`);
        return response.data;
    }

    async setCoverPhoto(propertyId: number, photoId: number) {
        const response = await v1Api.put(`/host/properties/${propertyId}/photos/${photoId}/cover`);
        return response.data;
    }

    // ==================== ÉQUIPEMENTS ====================
    async updateAmenities(propertyId: number, data: AmenitiesData) {
        const response = await v1Api.put(`/host/properties/${propertyId}/amenities`, data);
        return response.data;
    }

    // ==================== SOUMISSION POUR VALIDATION ====================
    async submitForReview(propertyId: number) {
        const response = await v1Api.post(`/host/properties/${propertyId}/submit`);
        return response.data;
    }

    // ==================== VÉRIFICATION D'IDENTITÉ ====================
    async checkVerificationRequired(): Promise<boolean> {
        try {
            const status = await this.getVerificationStatus();
            return status.verification_status !== 'verified';
        } catch (error) {
            return true;
        }
    }

    async uploadIdentity(document: File, documentType: string) {
        const formData = new FormData();
        formData.append('identity_document', document);
        formData.append('document_type', documentType);
        const response = await v1Api.post('/host/upload-identity', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }

    async getVerificationStatus() {
        const response = await v1Api.get('/host/verification-status');
        return response.data;
    }

    // ==================== MESSAGES GÉNÉRAUX ====================
    async getInquiryMessages(guestId: number) {
        const response = await v1Api.get(`/host/messages/inquiry/${guestId}`);
        return response.data;
    }

    async sendInquiryReply(guestId: number, data: { message: string }) {
        const response = await v1Api.post(`/host/messages/inquiry/${guestId}`, data);
        return response.data;
    }

    // ==================== PROFIL HÔTE ====================
    async getProfile() {
        const response = await v1Api.get('/host/profile');
        return response.data;
    }

    async updateProfile(data: any) {
        const response = await v1Api.put('/host/profile', data);
        return response.data;
    }

    async uploadProfilePhoto(photo: File) {
        const formData = new FormData();
        formData.append('photo', photo);
        const response = await v1Api.post('/host/profile/photo', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }

    async changePassword(currentPassword: string, newPassword: string) {
        const response = await v1Api.post('/host/profile/change-password', {
            current_password: currentPassword,
            new_password: newPassword,
            new_password_confirmation: newPassword
        });
        return response.data;
    }

    async getPaymentInfo() {
        const response = await v1Api.get('/host/profile/payment-info');
        return response.data;
    }

    async getMyPaymentInfo() {
        const response = await v1Api.get('/host/payments/info');
        return response.data;
    }

    async updateMyPaymentInfo(data: {
        paymentMethod: 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'PAYPAL';
        fullName: string;
        phoneNumber?: string;
        mobileProvider?: 'ORANGE' | 'MTN' | 'MOOV' | 'WAVE';
        bankName?: string;
        accountHolder?: string;
        iban?: string;
        bic?: string;
        paypalEmail?: string;
    }) {
        const response = await v1Api.post('/host/payments/info', data);
        return response.data;
    }

    async getMyPaymentHistory(limit?: number) {
        const params = new URLSearchParams();
        if (limit) params.append('limit', limit.toString());
        const response = await v1Api.get(`/host/payments/history?${params.toString()}`);
        return response.data;
    }

    async getMyPaymentStats() {
        const response = await v1Api.get('/host/payments/stats');
        return response.data;
    }

    async updatePaymentInfo(data: any) {
        const response = await v1Api.put('/host/profile/payment-info', data);
        return response.data;
    }

    // ==================== RÉSERVATIONS HÔTE ====================
    async getHostBookings() {
        const response = await v1Api.get('/host/bookings');
        return response.data;
    }

    async getBookingDetails(bookingId: number) {
        const response = await v1Api.get(`/host/bookings/${bookingId}`);
        return response.data;
    }

    async confirmBooking(bookingId: number, notes?: string) {
        const response = await v1Api.post(`/host/bookings/${bookingId}/confirm`, { notes });
        return response.data;
    }

    async declineBooking(bookingId: number, reason?: string) {
        const response = await v1Api.post(`/host/bookings/${bookingId}/decline`, { reason });
        return response.data;
    }

    async checkIn(bookingId: number) {
        const response = await v1Api.post(`/host/bookings/${bookingId}/checkin`);
        return response.data;
    }

    async checkOut(bookingId: number) {
        const response = await v1Api.post(`/host/bookings/${bookingId}/checkout`);
        return response.data;
    }

    // ==================== PAIEMENTS (PAYOUTS) ====================
    async getBalance() {
        const response = await v1Api.get('/host/payouts/balance');
        return response.data;
    }

    async requestPayout(amount: number, method: string, details: any) {
        const response = await v1Api.post('/host/payouts/request', {
            amount,
            payout_method: method,
            ...details
        });
        return response.data;
    }

    async getPayouts() {
        const response = await v1Api.get('/host/payouts');
        return response.data;
    }

    // ==================== CALENDRIER ====================
    async getCalendar(propertyId: number, year: number, month: number) {
        const response = await v1Api.get(`/host/calendar/${propertyId}`, {
            params: { year, month }
        });
        return response.data;
    }

    async updateAvailability(propertyId: number, startDate: string, endDate: string, status: string, specialPrice?: number | null, reason?: string) {
        const response = await v1Api.post(`/host/calendar/${propertyId}/availability`, {
            start_date: startDate,
            end_date: endDate,
            status: status,
            special_price: specialPrice,
            reason: reason
        });
        return response.data;
    }

    async updateSpecialPrice(propertyId: number, startDate: string, endDate: string, price: number) {
        const response = await v1Api.post(`/host/calendar/${propertyId}/special-price`, {
            start_date: startDate,
            end_date: endDate,
            price: price
        });
        return response.data;
    }

    async blockDates(propertyId: number, startDate: string, endDate: string, reason?: string) {
        return this.updateAvailability(propertyId, startDate, endDate, 'blocked', null, reason);
    }

    async unblockDates(propertyId: number, startDate: string, endDate: string) {
        return this.updateAvailability(propertyId, startDate, endDate, 'available', null);
    }

    // ==================== MESSAGERIE HÔTE ====================
    async getHostConversations() {
        const response = await v1Api.get('/host/messages/conversations');
        return response.data;
    }

    async getHostMessages(bookingId: string) {
        const response = await v1Api.get(`/host/messages/booking/${bookingId}`);
        return response.data;
    }

    async sendHostMessage(bookingId: string, data: { message: string }) {
        const response = await v1Api.post(`/host/messages/booking/${bookingId}`, data);
        return response.data;
    }

    async markConversationAsRead(bookingId: string) {
        const response = await v1Api.post(`/host/messages/conversation/${bookingId}/read`);
        return response.data;
    }

    async getHostUnreadCount() {
        const response = await v1Api.get('/host/messages/unread/count');
        return response.data;
    }

    async getQuickReplies() {
        const response = await v1Api.get('/host/messages/quick-replies');
        return response.data;
    }

    // ==================== FAVORIS HÔTE ====================
    async getHostFavorites(page: number = 1) {
        const response = await v1Api.get(`/host/favorites?page=${page}`);
        return response.data;
    }

    async getHostFavoritesGroupedByProperty() {
        const response = await v1Api.get('/host/favorites/grouped-by-property');
        return response.data;
    }

    async getPropertyFavorites(propertyId: number) {
        const response = await v1Api.get(`/host/favorites/property/${propertyId}`);
        return response.data;
    }

    async getHostFavoritesStatistics() {
        const response = await v1Api.get('/host/favorites/statistics');
        return response.data;
    }

    async exportHostFavorites() {
        const response = await v1Api.get('/host/favorites/export', {
            responseType: 'blob'
        });
        return response.data;
    }

    // ==================== LOGOUT ====================
    async logout() {
        const response = await v1Api.post('/host/logout');
        return response.data;
    }

    // ==================== UPLOAD IMAGES ====================
    async uploadImages(files: File[], type: 'experience' | 'step'): Promise<string[]> {
        const formData = new FormData();
        files.forEach((file, index) => {
            formData.append(`images[${index}]`, file);
        });
        formData.append('type', type);
        
        const response = await v1Api.post('/host/upload-images', formData);
        return response.data.urls;
    }

    async downloadImage(url: string): Promise<File> {
        const response = await fetch(url);
        const blob = await response.blob();
        const filename = url.split('/').pop() || 'image.jpg';
        return new File([blob], filename, { type: blob.type });
    }
}

export default new HostService();
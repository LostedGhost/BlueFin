// services/property.service.ts
import { publicApi, v1Api } from './api';

export interface PropertyFilters {
    destination?: string;
    check_in?: string;
    check_out?: string;
    guests?: number;
    min_price?: number;
    max_price?: number;
    property_type?: string;
    bedrooms?: number;
    min_rating?: number;
    has_wifi?: boolean;
    has_air_conditioning?: boolean;
    has_generator?: boolean;
    sort_by?: string;
    page?: number;
    per_page?: number;
    search?: string;
    city?: string;
    district?: string;
    is_hotel_promoted?: boolean;
}

export interface PropertyData {
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

class PropertyService {
    // ==================== ROUTES PUBLIQUES ====================
    
    async getAll(filters: PropertyFilters = {}) {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params.append(key, value.toString());
            }
        });
        if (!params.has('include')) {
            params.append('include', 'photos,cover_photo,photo_urls,images,media');
        }
        const response = await v1Api.get(`/properties?${params.toString()}`);
        return response.data;
    }

   async getById(id: number) {
    try {
        const response = await v1Api.get(`/properties/${id}?include=photos,cover_photo`);
        return response.data;
    } catch (error: any) {
        console.error('❌ Erreur getById:', error);
        try {
            const response = await v1Api.get(`/properties/${id}`);
            return response.data;
        } catch (fallbackError) {
            throw fallbackError;
        }
    }
}

    // ==================== VÉRIFICATION DE DISPONIBILITÉ ====================
    
    async checkAvailability(propertyId: number, checkIn: string, checkOut: string, guests: number = 1) {
        try {
            const cleanCheckIn = checkIn.split('T')[0];
            const cleanCheckOut = checkOut.split('T')[0];
            
            console.log('📤 checkAvailability:', {
                propertyId,
                checkIn: cleanCheckIn,
                checkOut: cleanCheckOut,
                guests
            });

            const response = await v1Api.post(`/properties/${propertyId}/availability`, {
                check_in: cleanCheckIn,
                check_out: cleanCheckOut,
                guests_count: guests
            });

            console.log('📥 Réponse checkAvailability:', response.data);
            
            const data = response.data;
            const isAvailable = data.available === true || 
                               data.data?.available === true || 
                               data.availability === true ||
                               data.is_available === true;
            
            return {
                success: data.success !== false,
                available: isAvailable,
                price_details: data.price_details || data.data?.price_details || null,
                unavailable_dates: data.unavailable_dates || data.data?.unavailable_dates || [],
                property: data.property || data.data?.property || null,
                message: data.message || (isAvailable ? 'Dates disponibles' : 'Dates non disponibles')
            };
        } catch (error: any) {
            console.error('❌ Erreur checkAvailability:', error);
            console.error('❌ Détails:', error.response?.data);
            
            return {
                success: false,
                available: false,
                price_details: null,
                unavailable_dates: [],
                property: null,
                message: error.response?.data?.message || error.message || 'Erreur de vérification'
            };
        }
    }

    // ==================== RÉCUPÉRATION DES DISPONIBILITÉS POUR LE CALENDRIER ====================
    
    /**
     * Disponibilités d'un mois pour le calendrier : UNE requête par mois.
     *
     * L'ancienne version envoyait une requête par jour (≈30 par mois, et le
     * calendrier se monte deux fois) : l'ouverture d'une annonce épuisait le
     * quota de 60 requêtes/minute de l'utilisateur, et tout le reste du site
     * (messagerie, favoris…) répondait ensuite 429 pendant une minute. Le
     * dernier jour du mois produisait en plus une date invalide (« 2026-09-31 »).
     * Le serveur renvoie déjà la liste des dates indisponibles de la période :
     * c'est la même source que son contrôle de disponibilité.
     *
     * En cas d'échec, l'erreur remonte : le calendrier n'affiche alors aucun
     * statut, plutôt que des dates réservées inventées (ancien repli aléatoire).
     */
    async getAvailability(propertyId: number, year: number, month: number) {
        const pad = (n: number) => String(n).padStart(2, '0');
        const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const firstDay = new Date(year, month - 1, 1);
        const nextMonth = new Date(year, month, 1);
        const daysInMonth = new Date(year, month, 0).getDate();

        let unavailable = new Set<string>();
        if (nextMonth > today) {
            const from = firstDay < today ? today : firstDay;
            const response = await v1Api.post(`/properties/${propertyId}/availability`, {
                check_in: iso(from),
                check_out: iso(nextMonth),
                guests_count: 1,
            });
            const dates: string[] = response.data?.unavailable_dates || response.data?.data?.unavailable_dates || [];
            unavailable = new Set(dates.map((d) => String(d).slice(0, 10)));
        }

        const availability = [];
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month - 1, day);
            const dateStr = iso(date);
            const isAvailable = date >= today && !unavailable.has(dateStr);
            availability.push({
                date: dateStr,
                status: isAvailable ? 'available' : 'booked',
                is_available: isAvailable,
                special_price: null,
            });
        }
        return { data: availability };
    }

    // ==================== RECHERCHE AVANCÉE ====================
    
    async searchWithFilters(filters: {
        destination?: string;
        check_in?: string;
        check_out?: string;
        guests?: number;
        min_price?: number;
        max_price?: number;
        property_type?: string;
        bedrooms?: number;
        min_rating?: number;
        has_wifi?: boolean;
        has_air_conditioning?: boolean;
        has_generator?: boolean;
        city?: string;
        district?: string;
    }) {
        const params = new URLSearchParams();
        
        if (filters.destination) {
            params.append('search', filters.destination);
            params.append('city', filters.destination);
        }
        if (filters.city) params.append('city', filters.city);
        if (filters.district) params.append('district', filters.district);
        
        if (filters.check_in) params.append('check_in', filters.check_in);
        if (filters.check_out) params.append('check_out', filters.check_out);
        
        if (filters.guests) params.append('max_guests', filters.guests.toString());
        if (filters.bedrooms) params.append('bedrooms', filters.bedrooms.toString());
        
        if (filters.min_price) params.append('min_price', filters.min_price.toString());
        if (filters.max_price) params.append('max_price', filters.max_price.toString());
        
        if (filters.property_type) params.append('property_type', filters.property_type);
        if (filters.min_rating) params.append('min_rating', filters.min_rating.toString());
        
        if (filters.has_wifi) params.append('has_wifi', 'true');
        if (filters.has_air_conditioning) params.append('has_air_conditioning', 'true');
        if (filters.has_generator) params.append('has_generator', 'true');
        
        params.append('per_page', '50');
        params.append('include', 'photos,cover_photo,photo_urls,images,media');
        
        try {
            const response = await v1Api.get(`/properties/search?${params.toString()}`);
            return response.data;
        } catch (error) {
            console.error('Erreur recherche avancée:', error);
            return this.getAll(filters);
        }
    }

    async advancedSearch(filters: PropertyFilters) {
        const response = await v1Api.post('/search/advanced', filters);
        return response.data;
    }

    async autocomplete(query: string) {
        const response = await v1Api.get(`/search/autocomplete?q=${query}`);
        return response.data;
    }

    async getPopularDestinations() {
        const response = await v1Api.get('/search/popular-destinations');
        return response.data;
    }

    async getPopularDistricts(city: string) {
        const response = await v1Api.get(`/search/popular-districts/${city}`);
        return response.data;
    }

    async searchMap(filters: PropertyFilters) {
        const response = await v1Api.post('/search/map', filters);
        return response.data;
    }

    // ==================== ROUTES ADMIN ====================
    
    async getAdminPendingProperties() {
        const response = await v1Api.get('/admin/properties/pending');
        return response.data;
    }

    async approveProperty(id: number, notes?: string, featured?: boolean) {
        const response = await v1Api.post(`/admin/properties/${id}/approve`, { notes, featured });
        return response.data;
    }

    async rejectProperty(id: number, reason: string, notes?: string) {
        const response = await v1Api.post(`/admin/properties/${id}/reject`, { reason, notes });
        return response.data;
    }

    // ==================== ROUTES HÔTE ====================
    
    async createProperty(data: PropertyData) {
        try {
            console.log('📤 Création propriété - Données envoyées:', data);
            
            const response = await v1Api.post('/host/properties', data);
            
            let propertyId = null;
            let responseData = response.data;
            
            if (typeof responseData === 'string') {
                const cleanedData = responseData.replace(/^\/\/.*\n/, '');
                try {
                    responseData = JSON.parse(cleanedData);
                } catch (e) {
                    console.error('❌ Impossible de parser le JSON:', e);
                }
            }
            
            propertyId = responseData.id || 
                        responseData.property?.id || 
                        responseData.data?.id || 
                        responseData.property_id;
            
            if (!propertyId) {
                throw new Error('Impossible de récupérer l\'ID de la propriété.');
            }
            
            return {
                success: true,
                id: propertyId,
                data: responseData
            };
            
        } catch (error: any) {
            console.error('❌ Erreur création propriété:', error);
            throw error;
        }
    }

    async updateProperty(id: number, data: Partial<PropertyData>) {
        const response = await v1Api.put(`/host/properties/${id}`, data);
        return response.data;
    }

    async deleteProperty(id: number) {
        const response = await v1Api.delete(`/host/properties/${id}`);
        return response.data;
    }

    async submitForReview(propertyId: number) {
        const response = await v1Api.post(`/host/properties/${propertyId}/submit`);
        return response.data;
    }

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

    async updateAmenities(propertyId: number, amenities: any) {
        const response = await v1Api.put(`/host/properties/${propertyId}/amenities`, amenities);
        return response.data;
    }

    async getMyProperties() {
        const response = await v1Api.get('/host/properties');
        return response.data;
    }

    async getMyProperty(id: number) {
        const response = await v1Api.get(`/host/properties/${id}`);
        return response.data;
    }
}

export default new PropertyService();
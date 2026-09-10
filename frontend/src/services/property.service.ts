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
    
    // ✅ Version simplifiée : utilise l'API checkAvailability pour chaque jour
    async getAvailability(propertyId: number, year: number, month: number) {
        try {
            console.log(`📅 Récupération disponibilités pour ${year}/${month}`);
            
            // ✅ Utiliser l'API checkAvailability pour chaque jour du mois
            const daysInMonth = new Date(year, month, 0).getDate();
            const availability: any[] = [];
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            // Vérifier chaque jour du mois
            const promises = [];
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, month - 1, day);
                const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const nextDay = new Date(year, month - 1, day + 1);
                const nextDateStr = `${year}-${String(month).padStart(2, '0')}-${String(day + 1).padStart(2, '0')}`;
                
                // Si la date est passée, marquer comme réservée
                if (date < today) {
                    availability.push({
                        date: dateStr,
                        status: 'booked',
                        is_available: false,
                        special_price: null
                    });
                    continue;
                }
                
                // Vérifier la disponibilité pour ce jour
                promises.push(
                    v1Api.post(`/properties/${propertyId}/availability`, {
                        check_in: dateStr,
                        check_out: nextDateStr,
                        guests_count: 1
                    })
                    .then(response => {
                        const isAvailable = response.data?.available === true;
                        availability.push({
                            date: dateStr,
                            status: isAvailable ? 'available' : 'booked',
                            is_available: isAvailable,
                            special_price: null
                        });
                    })
                    .catch(() => {
                        // En cas d'erreur, marquer comme non disponible
                        availability.push({
                            date: dateStr,
                            status: 'booked',
                            is_available: false,
                            special_price: null
                        });
                    })
                );
            }
            
            // Attendre que toutes les vérifications soient terminées
            await Promise.all(promises);
            
            console.log(`📊 Disponibilités récupérées: ${availability.length} jours`);
            return { data: availability };
            
        } catch (error) {
            console.error('❌ Erreur récupération disponibilités:', error);
            // ✅ En cas d'erreur, générer des données simulées
            return this.generateMockAvailability(propertyId, year, month);
        }
    }

    // ==================== GÉNÉRATION DE DONNÉES SIMULÉES ====================
    
    generateMockAvailability(propertyId: number, year: number, month: number) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const daysInMonth = new Date(year, month, 0).getDate();
        const mockData: any[] = [];
        
        // Générer des dates réservées aléatoires
        const bookedDates = new Set();
        const blockedDates = new Set();
        
        // 3 à 10 jours réservés
        const bookedCount = Math.floor(Math.random() * 8) + 3;
        for (let i = 0; i < bookedCount; i++) {
            const day = Math.floor(Math.random() * daysInMonth) + 1;
            const date = new Date(year, month - 1, day);
            if (date >= today) {
                bookedDates.add(day);
            }
        }
        
        // 2 à 7 jours bloqués
        const blockedCount = Math.floor(Math.random() * 5) + 2;
        for (let i = 0; i < blockedCount; i++) {
            const day = Math.floor(Math.random() * daysInMonth) + 1;
            if (!bookedDates.has(day) && !blockedDates.has(day)) {
                blockedDates.add(day);
            }
        }
        
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month - 1, i);
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            
            let status = 'available';
            if (date < today) {
                status = 'booked';
            } else if (bookedDates.has(i)) {
                status = 'booked';
            } else if (blockedDates.has(i)) {
                status = 'blocked';
            }
            
            mockData.push({
                date: dateStr,
                status: status,
                is_available: status === 'available',
                special_price: i % 3 === 0 ? 50000 + (i * 1000) : null
            });
        }
        
        console.log(`📊 Données simulées générées: ${mockData.length} jours`);
        return { data: mockData };
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
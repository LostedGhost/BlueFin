// services/service.service.ts
import { v1Api } from './api';

export interface Service {
    id: number;
    host_id: number;
    title: string;
    description: string;
    location: string;
    price: number;
    service_type: string;
    category: string;
    duration_minutes: number;
    status: 'draft' | 'pending' | 'active' | 'inactive' | 'rejected' | 'suspended';
    is_published: boolean;
    images?: string[];
    availability?: any[];
    host?: {
        id: number;
        first_name: string;
        last_name: string;
        email: string;
        phone?: string;
    };
    average_rating?: number;
    reviews_count?: number;
    created_at?: string;
    updated_at?: string;
}

export interface ServiceFormData {
    title: string;
    description: string;
    location: string;
    price: number;
    service_type: string;
    category: string;
    duration_minutes: number;
    images: File[];
    availability?: any[];
    status?: 'draft' | 'pending' | 'active' | 'inactive' | 'rejected' | 'suspended';
}

class ServiceService {
    // ==================== PUBLIC ====================
    async getAll(): Promise<{ success: boolean; data: { data: Service[] } }> {
        const response = await v1Api.get('/services');
        return response.data;
    }

    async getFeatured(): Promise<{ success: boolean; data: { data: Service[] } }> {
        const response = await v1Api.get('/services/featured');
        return response.data;
    }

    async getById(id: number): Promise<{ success: boolean; data: Service }> {
        const response = await v1Api.get(`/services/${id}`);
        return response.data;
    }

    async getByCategory(category: string): Promise<{ success: boolean; data: { data: Service[] } }> {
        const response = await v1Api.get(`/services/category/${category}`);
        return response.data;
    }

    async getByServiceType(serviceType: string): Promise<{ success: boolean; data: { data: Service[] } }> {
        const response = await v1Api.get(`/services/type/${serviceType}`);
        return response.data;
    }

    // ==================== HÔTE ====================
    async getHostServices(): Promise<{ success: boolean; data: { data: Service[] } }> {
        try {
            console.log('📤 Appel API: /host/services');
            const response = await v1Api.get('/host/services');
            console.log('📥 Réponse services:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Erreur getHostServices:', error);
            throw error;
        }
    }

    async getHostService(id: number): Promise<{ success: boolean; data: Service }> {
        const response = await v1Api.get(`/host/services/${id}`);
        return response.data;
    }

    async create(data: ServiceFormData): Promise<{ success: boolean; data: Service }> {
        try {
            console.log('📤 Création service - payload:', data);
            
            const formData = new FormData();
            formData.append('title', data.title || '');
            formData.append('service_type', data.service_type || '');
            formData.append('category', data.category || '');
            formData.append('location', data.location || '');
            formData.append('description', data.description || '');
            formData.append('price', String(data.price || 0));
            formData.append('duration_minutes', String(data.duration_minutes || 60));
            formData.append('status', data.status || 'draft');
            
            if (data.availability) {
                formData.append('availability', JSON.stringify(data.availability));
            }
            
            if (data.images && data.images.length > 0) {
                data.images.forEach((file: File) => {
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

    async update(id: number, data: Partial<ServiceFormData>): Promise<{ success: boolean; data: Service }> {
        try {
            const formData = new FormData();
            formData.append('_method', 'PUT');
            formData.append('title', data.title || '');
            formData.append('service_type', data.service_type || '');
            formData.append('category', data.category || '');
            formData.append('location', data.location || '');
            formData.append('description', data.description || '');
            formData.append('price', String(data.price || 0));
            formData.append('duration_minutes', String(data.duration_minutes || 60));
            formData.append('status', data.status || 'draft');
            
            if (data.availability) {
                formData.append('availability', JSON.stringify(data.availability));
            }
            
            if (data.images && data.images.length > 0) {
                data.images.forEach((file: File) => {
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

    async delete(id: number): Promise<{ success: boolean }> {
        try {
            const response = await v1Api.delete(`/host/services/${id}`);
            return response.data;
        } catch (error: any) {
            console.error('❌ Erreur suppression:', error);
            throw error;
        }
    }

    async getDashboard(): Promise<{ success: boolean; data: any; stats: any }> {
        try {
            console.log('📤 Appel API: /host/services/dashboard');
            const response = await v1Api.get('/host/services/dashboard');
            console.log('📥 Réponse dashboard:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Erreur getDashboard:', error);
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
}

export default new ServiceService();
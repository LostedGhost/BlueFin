// services/experience.service.ts
import { v1Api } from './api';

export interface Experience {
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
    images?: string[];
    host?: {
        id: number;
        first_name: string;
        last_name: string;
        email: string;
        phone?: string;
    };
    average_rating?: number;
    reviews_count?: number;
    duration?: string;
}

export interface ExperienceFormData {
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

export interface ExperienceConversation {
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

class ExperienceService {
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

    // ==================== PUBLIC ====================
    async getAll(): Promise<{ success: boolean; data: { data: Experience[] } }> {
        const response = await v1Api.get('/experiences');
        const payload = response.data;
        const list = payload?.data?.data;

        if (Array.isArray(list)) {
            payload.data.data = list.map((item: any) => this.normalizeExperienceItem(item));
        }

        return payload;
    }

    async getFeatured(): Promise<{ success: boolean; data: { data: Experience[] } }> {
        const response = await v1Api.get('/experiences/featured');
        const payload = response.data;
        const list = payload?.data?.data;

        if (Array.isArray(list)) {
            payload.data.data = list.map((item: any) => this.normalizeExperienceItem(item));
        }

        return payload;
    }

    async getById(id: number): Promise<{ success: boolean; data: Experience }> {
        const response = await v1Api.get(`/experiences/${id}`);
        const payload = response.data;

        if (payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
            payload.data = this.normalizeExperienceItem(payload.data);
        }

        return payload;
    }

    // ==================== HÔTE ====================
    async getHostExperiences(): Promise<{ success: boolean; data: { data: Experience[] } }> {
        const response = await v1Api.get('/host/experiences');
        const payload = response.data;
        const list = payload?.data?.data;

        if (Array.isArray(list)) {
            payload.data.data = list.map((item: any) => this.normalizeExperienceItem(item));
        }

        return payload;
    }

    async getHostExperience(id: number): Promise<{ success: boolean; data: Experience }> {
        const response = await v1Api.get(`/host/experiences/${id}`);
        const payload = response.data;

        if (payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
            payload.data = this.normalizeExperienceItem(payload.data);
        }

        return payload;
    }

    async create(data: ExperienceFormData): Promise<{ success: boolean; data: Experience }> {
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

    async update(id: number, payload: Partial<ExperienceFormData>): Promise<{ success: boolean; data: Experience }> {
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

    async delete(id: number): Promise<{ success: boolean }> {
        const response = await v1Api.delete(`/host/experiences/${id}`);
        return response.data;
    }

    async getAvailability(experienceId: number): Promise<{ success: boolean; data: any }> {
        const response = await v1Api.get(`/host/experiences/${experienceId}/availability`);
        return response.data;
    }

    async setAvailability(experienceId: number, availability: Array<{ date: string; slots: string[] }>): Promise<{ success: boolean }> {
        const response = await v1Api.put(`/host/experiences/${experienceId}/availability`, { availability });
        return response.data;
    }

    // ==================== MESSAGES ====================
    async getConversations(): Promise<{ success: boolean; data: ExperienceConversation[] }> {
        try {
            console.log('📥 Récupération des conversations expériences...');
            const response = await v1Api.get('/host/experiences/messages');
            console.log('✅ Conversations récupérées:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Erreur getConversations:', error.response?.data || error.message);
            throw error;
        }
    }

    async getMessages(experienceId: number, guestId: number): Promise<{ success: boolean; data: any }> {
        const response = await v1Api.get(`/host/experiences/messages/${experienceId}/${guestId}`);
        return response.data;
    }

    async sendMessage(experienceId: number, guestId: number, data: { message: string }): Promise<{ success: boolean }> {
        const response = await v1Api.post(`/host/experiences/messages/${experienceId}/${guestId}`, data);
        return response.data;
    }

    // ==================== UPLOAD ====================
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

export default new ExperienceService();
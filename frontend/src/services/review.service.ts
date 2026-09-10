// services/review.service.ts
import { v1Api } from './api';

export interface ReviewData {
    booking_id: number;
    rating: number;
    cleanliness_rating: number;
    communication_rating: number;
    checkin_rating: number;
    accuracy_rating: number;
    location_rating: number;
    value_rating: number;
    comment: string;
}

class ReviewService {
    // Récupérer les avis d'une propriété
    async getPropertyReviews(propertyId: number) {
        // ✅ CORRECTION : Utiliser v1Api
        const response = await v1Api.get(`/reviews/property/${propertyId}`);
        return response.data;
    }

    // Laisser un avis
    async create(data: ReviewData) {
        // ✅ CORRECTION : Utiliser v1Api
        const response = await v1Api.post('/reviews', data);
        return response.data;
    }

    // Mes avis
    async getMyReviews() {
        // ✅ CORRECTION : Utiliser v1Api
        const response = await v1Api.get('/reviews/my');
        return response.data;
    }
}

export default new ReviewService();
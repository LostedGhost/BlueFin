// services/temporaryBooking.service.ts
export interface TemporaryBookingData {
    propertyId: number;
    checkIn: string;
    checkOut: string;
    guests: number;
    nights: number;
    bookingFormData: {
        fullName: string;
        email: string;
        phone: string;
        address: string;
        nationality: string;
        idType: string;
        idNumber: string;
        paymentOption: '50' | '100';
        totalAmount: number;
        paymentAmount: number;
    };
    timestamp: number;
}

class TemporaryBookingService {
    private readonly STORAGE_KEY = 'temp_booking_data';
    private readonly EXPIRY_HOURS = 24; // 24 heures

    // Sauvegarder les données temporaires
    saveBookingData(data: Omit<TemporaryBookingData, 'timestamp'>) {
        const bookingData: TemporaryBookingData = {
            ...data,
            timestamp: Date.now()
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(bookingData));
    }

    // Récupérer les données temporaires
    getBookingData(): TemporaryBookingData | null {
        const data = localStorage.getItem(this.STORAGE_KEY);
        if (!data) return null;
        
        try {
            const parsed = JSON.parse(data) as TemporaryBookingData;
            
            // Vérifier si les données sont encore valides (pas expirées)
            const age = Date.now() - parsed.timestamp;
            const maxAge = this.EXPIRY_HOURS * 60 * 60 * 1000;
            
            if (age > maxAge) {
                this.clearBookingData();
                return null;
            }
            
            return parsed;
        } catch (e) {
            this.clearBookingData();
            return null;
        }
    }

    // Effacer les données temporaires
    clearBookingData() {
        localStorage.removeItem(this.STORAGE_KEY);
    }

    // Vérifier si des données existent
    hasBookingData(): boolean {
        return this.getBookingData() !== null;
    }
}

export default new TemporaryBookingService();
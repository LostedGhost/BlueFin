// src/types/booking.ts

export interface GuestDetails {
    full_name: string;
    email: string;
    phone: string;
    address?: string | null;
    nationality?: string | null;
    id_type?: string | null;
    id_number?: string | null;
}

export interface BookingData {
    property_id: number;
    check_in: string;
    check_out: string;
    guests_count: number;
    guests?: number;
    payment_method: 'mobile_money' | 'card' | 'bank_transfer';
    mobile_money_provider?: 'MTN' | 'Moov' | 'Orange';
    mobile_money_number?: string;
    guest_details: GuestDetails;
    payment_option?: '50' | '100';
    total_amount?: number;
    payment_amount?: number;
    nights?: number;
    special_requests?: string;
}

export interface BookingResponse {
    success: boolean;
    data: {
        booking: Booking;
        message?: string;
    };
}

export interface Booking {
    id: number;
    booking_reference: string;
    user_id: number;
    property_id: number;
    check_in: string;
    check_out: string;
    guests_count: number;
    nights_count: number;
    subtotal: string;
    service_fee: string;
    cleaning_fee: string;
    total_amount: string;
    payment_method: string;
    payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
    booking_status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    guest_notes: string | null;
    host_notes: string | null;
    cancelled_at: string | null;
    cancellation_reason: string | null;
    guest_details: GuestDetails;
    created_at: string;
    updated_at: string;
    property?: {
        id: number;
        title: string;
        city: string;
        district: string;
        photo: string | null;
    };
    host?: {
        id: number;
        name: string;
        photo: string | null;
    };
}

export interface BookingStats {
    total: number;
    pending: number;
    confirmed: number;
    cancelled: number;
    completed: number;
}

export interface BookingsResponse {
    success: boolean;
    data: {
        data: Booking[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    stats?: BookingStats;
}

export interface CancelBookingData {
    reason?: string;
}

export interface PaymentDetails {
    payment_method: 'mobile_money' | 'card';
    mobile_money_provider?: 'MTN' | 'Moov' | 'Orange';
    mobile_money_number?: string;
    card_details?: {
        card_number: string;
        expiry_date: string;
        cvv: string;
        cardholder_name: string;
    };
}

export interface PriceDetails {
    price_per_night: number;
    nights: number;
    subtotal: number;
    service_fee_percentage: number;
    service_fee: number;
    cleaning_fee: number;
    total: number;
    currency: string;
}

export interface TemporaryBookingData {
    propertyId: number;
    checkIn: string;
    checkOut: string;
    guests: number;
    nights: number;
    bookingFormData?: {
        fullName?: string;
        email?: string;
        phone?: string;
        address?: string;
        paymentOption?: string;
        totalAmount?: number;
        paymentAmount?: number;
    };
}

// Fonction utilitaire pour formater les dates
export const formatBookingDate = (date: string): string => {
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

// Fonction utilitaire pour obtenir le statut en français
export const getBookingStatusLabel = (status: string): string => {
    const statusMap: Record<string, string> = {
        'pending': 'En attente',
        'confirmed': 'Confirmée',
        'cancelled': 'Annulée',
        'completed': 'Terminée'
    };
    return statusMap[status] || status;
};

// Fonction utilitaire pour obtenir la couleur du statut
export const getBookingStatusColor = (status: string): string => {
    const colorMap: Record<string, string> = {
        'pending': 'bg-yellow-100 text-yellow-800',
        'confirmed': 'bg-green-100 text-green-800',
        'cancelled': 'bg-red-100 text-red-800',
        'completed': 'bg-blue-100 text-blue-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
};

// Fonction utilitaire pour calculer les prix
export const calculatePriceDetails = (
    pricePerNight: number,
    nights: number,
    serviceFeePercentage: number = 10,
    cleaningFee: number = 0
): PriceDetails => {
    const subtotal = pricePerNight * nights;
    const serviceFee = (subtotal * serviceFeePercentage) / 100;
    const total = subtotal + serviceFee + cleaningFee;
    
    return {
        price_per_night: pricePerNight,
        nights: nights,
        subtotal: subtotal,
        service_fee_percentage: serviceFeePercentage,
        service_fee: serviceFee,
        cleaning_fee: cleaningFee,
        total: total,
        currency: 'FCFA'
    };
};
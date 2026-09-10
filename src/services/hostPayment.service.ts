// services/hostPayment.service.ts
import { v1Api } from './api';

export interface HostPaymentInfo {
  id: number;
  host_id: string;
  payment_method: 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'PAYPAL';
  full_name: string;
  phone_number?: string;
  mobile_provider?: 'ORANGE' | 'MTN' | 'MOOV' | 'WAVE';
  bank_name?: string;
  account_holder?: string;
  iban?: string;
  bic?: string;
  paypal_email?: string;
  total_week_amount: number;
  total_month_amount: number;
  total_all_time: number;
  weekly_reservations: number;
  monthly_reservations: number;
  is_paid: boolean;
  host?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  histories: HostPaymentHistory[];
}

export interface HostPaymentHistory {
  id: number;
  week_start_date: string;
  week_end_date: string;
  amount: number;
  reservations_count: number;
  is_paid: boolean;
  paid_at?: string;
  paid_by?: string;
  payment_reference?: string;
}

class HostPaymentService {
  // Récupérer tous les paiements
  async getAllPayments(params?: {
    status?: 'paid' | 'unpaid' | 'all';
    start_date?: string;
    end_date?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);

    const response = await v1Api.get(`/admin/hosts/payments?${queryParams.toString()}`);
    return response.data;
  }

  // Récupérer les infos d'un hôte
  async getHostPaymentInfo(hostId: string) {
    const response = await v1Api.get(`/admin/hosts/${hostId}/payment-info`);
    return response.data;
  }

  // Sauvegarder les infos d'un hôte
  async saveHostPaymentInfo(hostId: string, data: any) {
    const response = await v1Api.post(`/admin/hosts/${hostId}/payment-info`, data);
    return response.data;
  }

  // Mettre à jour les paiements hebdomadaires
  async updateWeeklyPayments() {
    const response = await v1Api.post('/admin/hosts/payments/update-weekly');
    return response.data;
  }

  // Marquer un paiement comme payé
  async markPaymentAsPaid(historyId: number, paymentReference: string) {
    const response = await v1Api.put(`/admin/hosts/payments/${historyId}/mark-paid`, {
      payment_reference: paymentReference,
    });
    return response.data;
  }

  // Récupérer les statistiques
  async getStats() {
    const response = await v1Api.get('/admin/hosts/payments/stats');
    return response.data;
  }

  // Exporter les paiements
  async exportPayments(params?: {
    status?: 'paid' | 'unpaid' | 'all';
    start_date?: string;
    end_date?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);

    const response = await v1Api.get(`/admin/hosts/payments/export?${queryParams.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  }

  // Envoyer des rappels
  async sendReminders() {
    const response = await v1Api.post('/admin/hosts/payments/send-reminders');
    return response.data;
  }
}

export default new HostPaymentService();
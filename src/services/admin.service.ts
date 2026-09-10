// services/admin.service.ts - Version améliorée

import { v1Api } from './api';

export interface DashboardStats {
  users: { total: number; new_today: number };
  properties: { total: number; pending: number };
  payments: { total_amount: number; today_amount: number };
  bookings: { confirmed: number; pending_payment: number };
}

export interface RecentActivity {
  type: 'property_submitted' | 'payment_received' | 'user_registered';
  title: string;
  time: string;
}

export interface PendingProperty {
  id: number;
  title: string;
  description: string;
  city: string;
  district: string;
  price_per_night: number;
  user: { full_name: string; phone: string };
  created_at: string;
  photos?: any[];
  cover_photo?: any;
}

// ✅ INTERFACE UTILISATEUR AMÉLIORÉE AVEC HOST_TYPE
export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  user_type: 'voyageur' | 'hote' | 'admin';
  host_type?: 'logement' | 'experience' | 'service' | null; // ✅ NOUVEAU
  is_active: boolean;
  verification_status: 'pending' | 'verified' | 'rejected';
  created_at: string;
  updated_at: string;
  last_login_at?: string;
  profile_photo?: string;
  profile_photo_url?: string;
  total_properties?: number;
  total_bookings?: number;
  total_reviews?: number;
  average_rating?: number;
  suspended_until?: string;
  suspension_reason?: string;
}

// ✅ INTERFACE POUR LES STATISTIQUES DES HÔTES
export interface HostStats {
  total_hosts: number;
  hosts_by_type: {
    logement: number;
    experience: number;
    service: number;
    undefined: number;
  };
  verified_hosts: number;
  pending_hosts: number;
  active_hosts: number;
  inactive_hosts: number;
}

export interface Booking {
  id: number;
  booking_reference: string;
  property: { title: string };
  user: { full_name: string };
  check_in: string;
  check_out: string;
  total_amount: number;
  booking_status: string;
}

export interface Payment {
  id: number;
  transaction_id: string;
  booking: { booking_reference: string };
  amount: number;
  payment_method: string;
  status: string;
  created_at: string;
}

export interface Message {
  id: number;
  sender: { full_name: string };
  receiver: { full_name: string };
  message: string;
  created_at: string;
}

export interface SummaryReport {
  new_users: number;
  new_properties: number;
  bookings_count: number;
  revenue: number;
  total_users: number;
  total_properties: number;
  total_bookings: number;
  total_revenue: number;
}

export interface AdminModerationStats {
  total: number;
  draft: number;
  pending: number;
  active: number;
  rejected: number;
}

// ==================== INTERFACES PAIEMENTS HÔTES ====================
export interface HostPaymentInfo {
  id: string;
  hostId: string;
  host?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    host_type?: 'logement' | 'experience' | 'service'; // ✅ NOUVEAU
  };
  paymentMethod: 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'PAYPAL';
  fullName: string;
  phoneNumber?: string;
  mobileProvider?: 'ORANGE' | 'MTN' | 'MOOV' | 'WAVE';
  bankName?: string;
  accountHolder?: string;
  iban?: string;
  bic?: string;
  paypalEmail?: string;
  totalWeekAmount: number;
  totalMonthAmount: number;
  totalAllTime: number;
  weeklyReservations: number;
  monthlyReservations: number;
  lastPayoutDate?: string;
  nextPayoutDate?: string;
  isPaid: boolean;
  paidAt?: string;
  paidBy?: string;
  paymentReference?: string;
  createdAt: string;
  updatedAt: string;
  payments: HostPaymentHistory[];
}

export interface HostPaymentHistory {
  id: string;
  weekStartDate: string;
  weekEndDate: string;
  amount: number;
  reservationsCount: number;
  isPaid: boolean;
  paidAt?: string;
  paidBy?: string;
  paymentReference?: string;
}

export interface HostPaymentStats {
  total_pending: number;
  total_paid_this_month: number;
  total_hosts: number;
  active_hosts: number;
  total_revenue: number;
  overdue_hosts: number;
  weekly_stats: Array<{
    week: string;
    total_amount: number;
    total_reservations: number;
    paid_count: number;
    unpaid_count: number;
  }>;
  recent_payments: Array<{
    host_name: string;
    amount: number;
    payment_method: string;
    reservations_count: number;
    week: string;
    is_paid: boolean;
  }>;
}

export interface HostPaymentListResponse {
  data: HostPaymentInfo[];
  stats: HostPaymentStats;
}


// ============================================
// SERVICE ADMIN
// ============================================

class AdminService {
 
  private api = v1Api;

  // ==================== AUTHENTIFICATION ====================
  
  async login(email: string, password: string) {
    const response = await this.api.post('/admin/login', { email, password });
    return response.data;
  }

  async logout() {
    const response = await this.api.post('/admin/logout');
    return response.data;
  }

  // ==================== DASHBOARD ====================
  
  async getDashboard(): Promise<{ data: { stats: DashboardStats; recent_activities: RecentActivity[] } }> {
    const response = await this.api.get('/admin/dashboard');
    return response.data;
  }

  async getNotifications() {
    const response = await this.api.get('/admin/notifications');
    return response.data;
  }

  async markNotificationRead(id: number) {
    const response = await this.api.post(`/admin/notifications/${id}/read`);
    return response.data;
  }

  async markAllNotificationsRead() {
    const response = await this.api.post('/admin/notifications/read-all');
    return response.data;
  }

  // ==================== MODÉRATION DES PROPRIÉTÉS ====================
  
  async getPendingProperties() {
    console.log('🔍 Appel API: /admin/properties/pending');
    
    try {
      const response = await this.api.get('/admin/properties/pending');
      
      console.log('✅ Réponse API complète:', response.data);
      
      let properties: any[] = [];
      let stats = { total_pending: 0, pending_today: 0 };
      
      if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
        properties = response.data.data.data;
        stats = response.data.stats || response.data.data?.stats || { total_pending: 0, pending_today: 0 };
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        properties = response.data.data;
        stats = response.data.stats || { total_pending: 0, pending_today: 0 };
      } else if (Array.isArray(response.data)) {
        properties = response.data;
      } else if (response.data?.data && typeof response.data.data === 'object') {
        if (response.data.data.data && Array.isArray(response.data.data.data)) {
          properties = response.data.data.data;
        }
        stats = response.data.stats || response.data.data?.stats || { total_pending: 0, pending_today: 0 };
      }
      
      console.log('✅ Propriétés extraites:', properties.length);
      
      return { data: properties, stats };
      
    } catch (error) {
      console.error('❌ Erreur getPendingProperties:', error);
      return { data: [], stats: { total_pending: 0, pending_today: 0 } };
    }
  }

  async getPropertyForModeration(id: number) {
    const response = await this.api.get(`/admin/properties/${id}/moderate`);
    return response.data;
  }

  async approveProperty(id: number, notes?: string, featured?: boolean, isHotelPromoted?: boolean) {
    const response = await this.api.post(`/admin/properties/${id}/approve`, { 
      notes, 
      featured,
      is_hotel_promoted: isHotelPromoted 
    });
    return response.data;
  }

  async toggleHotelPromotion(id: number, isHotelPromoted: boolean) {
    const response = await this.api.patch(`/admin/properties/${id}/promote-hotel`, { 
      is_hotel_promoted: isHotelPromoted 
    });
    return response.data;
  }

  async rejectProperty(id: number, reason: string, notes?: string) {
    const response = await this.api.post(`/admin/properties/${id}/reject`, { reason, notes });
    return response.data;
  }

  async requestModifications(id: number, feedback: string, changesNeeded: string[]) {
    const response = await this.api.post(`/admin/properties/${id}/request-modifications`, {
      feedback,
      changes_needed: changesNeeded,
    });
    return response.data;
  }

  async bulkApprove(propertyIds: number[]) {
    const response = await this.api.post('/admin/properties/bulk-approve', { property_ids: propertyIds });
    return response.data;
  }

  async getModerationStats() {
    const response = await this.api.get('/admin/properties/moderation/stats');
    return response.data;
  }

  async reassignHost(propertyId: number, newHostId: number) {
    const response = await this.api.post(`/admin/properties/${propertyId}/reassign-host`, { new_host_id: newHostId });
    return response.data;
  }

  async fixPublishedStatus(propertyId: number) {
    const response = await this.api.post(`/admin/properties/${propertyId}/fix-publish`);
    return response.data;
  }

  // ==================== MODÉRATION DES EXPÉRIENCES ====================
  
  async getExperiencesModeration(status?: string) {
    const params = new URLSearchParams();
    if (status && status !== 'all') {
      params.set('status', status);
    }

    const response = await this.api.get(`/admin/experiences${params.toString() ? `?${params.toString()}` : ''}`);
    return response.data;
  }

  async getExperienceForModeration(id: number) {
    const response = await this.api.get(`/admin/experiences/${id}`);
    return response.data;
  }

  async approveExperience(id: number, notes?: string) {
    const response = await this.api.post(`/admin/experiences/${id}/approve`, { notes });
    return response.data;
  }

  async rejectExperience(id: number, reason: string, notes?: string) {
    const response = await this.api.post(`/admin/experiences/${id}/reject`, { reason, notes });
    return response.data;
  }

  // ==================== MODÉRATION DES SERVICES ====================
  
  async getServicesModeration(status?: string) {
    const params = new URLSearchParams();
    if (status && status !== 'all') {
      params.set('status', status);
    }

    const response = await this.api.get(`/admin/services${params.toString() ? `?${params.toString()}` : ''}`);
    return response.data;
  }

  async getServiceForModeration(id: number) {
    const response = await this.api.get(`/admin/services/${id}`);
    return response.data;
  }

  async approveService(id: number, notes?: string) {
    const response = await this.api.post(`/admin/services/${id}/approve`, { notes });
    return response.data;
  }

  async rejectService(id: number, reason: string, notes?: string) {
    const response = await this.api.post(`/admin/services/${id}/reject`, { reason, notes });
    return response.data;
  }

  // ==================== GESTION DES UTILISATEURS ====================
  
  async getUsers() {
    const response = await this.api.get('/admin/users');
    return response.data;
  }

  async getUser(id: number) {
    const response = await this.api.get(`/admin/users/${id}`);
    return response.data;
  }

  async getHostsByType(hostType?: 'logement' | 'experience' | 'service') {
    const params = hostType ? `?host_type=${hostType}` : '';
    const response = await this.api.get(`/admin/hosts${params}`);
    return response.data;
  }

  async getHostStats(): Promise<HostStats> {
    const response = await this.api.get('/admin/hosts/stats');
    return response.data;
  }

  async verifyUser(id: number) {
    const response = await this.api.post(`/admin/users/${id}/verify`);
    return response.data;
  }

  async suspendUser(id: number, durationDays: number, reason?: string) {
    const response = await this.api.post(`/admin/users/${id}/suspend`, {
      duration_days: durationDays,
      reason,
    });
    return response.data;
  }

  async activateUser(id: number) {
    const response = await this.api.post(`/admin/users/${id}/activate`);
    return response.data;
  }

  async deleteUser(id: number) {
    const response = await this.api.delete(`/admin/users/${id}`);
    return response.data;
  }

  async updateUserHostType(userId: number, hostType: 'logement' | 'experience' | 'service') {
    const response = await this.api.patch(`/admin/users/${userId}/host-type`, {
      host_type: hostType
    });
    return response.data;
  }

  // ==================== SURVEILLANCE DES RÉSERVATIONS ====================
  
  async getBookings(filters?: { status?: string; start_date?: string; end_date?: string }) {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    
    const response = await this.api.get(`/admin/bookings?${params.toString()}`);
    return response.data;
  }

  async getBooking(id: number) {
    const response = await this.api.get(`/admin/bookings/${id}`);
    return response.data;
  }

  async cancelBooking(id: number, reason?: string) {
    const response = await this.api.post(`/admin/bookings/${id}/cancel`, { reason });
    return response.data;
  }

  // ==================== SURVEILLANCE DES PAIEMENTS ====================
  
  async getPayments() {
    const response = await this.api.get('/admin/payments');
    return response.data;
  }

  async getPayment(id: number) {
    const response = await this.api.get(`/admin/payments/${id}`);
    return response.data;
  }

  async refundPayment(id: number) {
    const response = await this.api.post(`/admin/payments/${id}/refund`);
    return response.data;
  }

  // ==================== SURVEILLANCE DES MESSAGES ====================
  
  async getMessages() {
    const response = await this.api.get('/admin/messages');
    return response.data;
  }

  async getConversation(user1Id: number, user2Id: number) {
    const response = await this.api.get(`/admin/messages/conversation/${user1Id}/${user2Id}`);
    return response.data;
  }

  async getSuspiciousConversations() {
    const response = await this.api.get('/admin/messages/suspicious');
    return response.data;
  }

  // ==================== RAPPORTS ====================
  
  async getSummaryReport(params: { period: string; start_date?: string; end_date?: string }) {
    console.log('📤 getSummaryReport - Paramètres:', params);
    try {
      const response = await this.api.get('/admin/reports/summary', { params });
      console.log('📥 getSummaryReport - Réponse:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ getSummaryReport - Erreur:', error);
      throw error;
    }
  }

  async getPropertiesReport(params: { period: string; start_date?: string; end_date?: string }) {
    console.log('📤 Appel API properties report');
    const response = await this.api.get('/admin/reports/properties', { params });
    console.log('📥 Réponse properties:', response.data);
    return response.data;
  }

  async getUsersReport(params: { period: string; start_date?: string; end_date?: string }) {
    console.log('📤 Appel API users report');
    const response = await this.api.get('/admin/reports/users', { params });
    console.log('📥 Réponse users:', response.data);
    return response.data;
  }

  async getBookingsReport(params: { period: string; start_date?: string; end_date?: string }) {
    console.log('📤 Appel API bookings report');
    const response = await this.api.get('/admin/reports/bookings', { params });
    console.log('📥 Réponse bookings:', response.data);
    return response.data;
  }

  async exportReport(period: string, format: string, dates?: { start_date?: string; end_date?: string }) {
    const response = await this.api.post(`/admin/reports/export/${format}`, {
      period,
      ...dates
    }, { responseType: 'blob' });
    return response.data;
  }

  // ==================== PARAMÈTRES ====================
  
  async getSettings() {
    const response = await this.api.get('/admin/settings');
    return response.data;
  }

  async updateSettings(settings: any) {
    const response = await this.api.put('/admin/settings', settings);
    return response.data;
  }

  async updatePropertyPromotion(id: number, isHotelPromoted: boolean) {
    const response = await this.api.patch(`/admin/properties/${id}/promote-hotel`, { 
      is_hotel_promoted: isHotelPromoted 
    });
    return response.data;
  }

  // ==================== PAIEMENTS HÔTES ====================

  async getHostPaymentStats(): Promise<{ data: HostPaymentStats }> {
    const response = await this.api.get('/admin/hosts/payments/stats');
    return response.data;
  }

  async getAllHostPayments(params?: {
    status?: 'all' | 'paid' | 'unpaid';
    search?: string;
    start_date?: string;
    end_date?: string;
    per_page?: number;
  }): Promise<{ data: { data: HostPaymentInfo[]; stats: HostPaymentStats } }> {
    const queryParams = new URLSearchParams();
    if (params?.status && params.status !== 'all') {
      queryParams.append('status', params.status);
    }
    if (params?.search) {
      queryParams.append('search', params.search);
    }
    if (params?.start_date) {
      queryParams.append('start_date', params.start_date);
    }
    if (params?.end_date) {
      queryParams.append('end_date', params.end_date);
    }
    if (params?.per_page) {
      queryParams.append('per_page', params.per_page.toString());
    }
    
    const response = await this.api.get(`/admin/hosts/payments?${queryParams.toString()}`);
    return response.data;
  }

  async getHostPaymentInfo(hostId: string): Promise<{ data: HostPaymentInfo }> {
    const response = await this.api.get(`/admin/hosts/${hostId}/payment-info`);
    return response.data;
  }

  async saveHostPaymentInfo(hostId: string, data: {
    paymentMethod: 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'PAYPAL';
    fullName: string;
    phoneNumber?: string;
    mobileProvider?: 'ORANGE' | 'MTN' | 'MOOV' | 'WAVE';
    bankName?: string;
    accountHolder?: string;
    iban?: string;
    bic?: string;
    paypalEmail?: string;
  }): Promise<{ success: boolean; data: HostPaymentInfo; message: string }> {
    const response = await this.api.post(`/admin/hosts/${hostId}/payment-info`, data);
    return response.data;
  }

  async updateAllWeeklyPayments(): Promise<{ 
    success: boolean; 
    updated: number; 
    total_amount: number;
    message: string;
    week_start: string;
    week_end: string;
  }> {
    const response = await this.api.post('/admin/hosts/payments/update-weekly');
    return response.data;
  }

  async updateHostWeeklyPayments(hostId: string): Promise<{ success: boolean; data: HostPaymentInfo }> {
    const response = await this.api.post(`/admin/hosts/${hostId}/payments/update-weekly`);
    return response.data;
  }

  async markPaymentAsPaid(historyId: string, paymentReference: string): Promise<{ 
    success: boolean; 
    data: HostPaymentHistory; 
    message: string 
  }> {
    const response = await this.api.put(`/admin/hosts/payments/${historyId}/mark-paid`, {
      payment_reference: paymentReference
    });
    return response.data;
  }

  async markAllPaymentsAsPaid(hostId: string, weekStartDate: string, paymentReference: string): Promise<{ 
    success: boolean; 
    message: string 
  }> {
    const response = await this.api.put(`/admin/hosts/${hostId}/payments/mark-all-paid`, {
      week_start_date: weekStartDate,
      payment_reference: paymentReference
    });
    return response.data;
  }

  async undoHostPayment(historyId: string, reason: string): Promise<{ success: boolean; message: string }> {
    const response = await this.api.post(`/admin/hosts/payments/${historyId}/undo`, { reason });
    return response.data;
  }

  async getHostPaymentHistory(hostId: string, limit?: number): Promise<{ data: HostPaymentHistory[] }> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    const response = await this.api.get(`/admin/hosts/${hostId}/payments/history?${params.toString()}`);
    return response.data;
  }

  async getOverduePayments(): Promise<{ data: HostPaymentInfo[] }> {
    const response = await this.api.get('/admin/hosts/payments/overdue');
    return response.data;
  }

  async sendPaymentReminder(hostId: string): Promise<{ success: boolean; message: string }> {
    const response = await this.api.post(`/admin/hosts/${hostId}/payments/reminder`);
    return response.data;
  }

  async sendBulkPaymentReminders(): Promise<{ success: boolean; sent: number; message: string }> {
    const response = await this.api.post('/admin/hosts/payments/send-reminders');
    return response.data;
  }

  async exportHostPayments(params?: {
    status?: 'all' | 'paid' | 'unpaid';
    start_date?: string;
    end_date?: string;
  }): Promise<Blob> {
    const queryParams = new URLSearchParams();
    if (params?.status && params.status !== 'all') {
      queryParams.append('status', params.status);
    }
    if (params?.start_date) {
      queryParams.append('start_date', params.start_date);
    }
    if (params?.end_date) {
      queryParams.append('end_date', params.end_date);
    }
    
    const response = await this.api.get(`/admin/hosts/payments/export?${queryParams.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async getHostPaymentSummary(hostId: string): Promise<{ 
    data: {
      total_all_time: number;
      total_week_amount: number;
      total_month_amount: number;
      weekly_reservations: number;
      monthly_reservations: number;
      is_paid: boolean;
      next_payout_date: string | null;
      last_payout_date: string | null;
    }
  }> {
    const response = await this.api.get(`/admin/hosts/${hostId}/payments/summary`);
    return response.data;
  }
}



export default new AdminService();
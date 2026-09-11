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

// ==================== VERSEMENTS AUX HÔTES ====================
// Contrat de Admin\HostPayoutController (routes /admin/host-payouts/*).

export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type PayoutMethod = 'mobile_money' | 'bank_transfer';

export interface HostPayout {
  id: number;
  reference: string;
  amount: number;
  method: PayoutMethod;
  destination: string;
  beneficiary: string | null;
  status: PayoutStatus;
  status_label: string;
  is_overdue: boolean;
  origin: 'host_request' | 'admin_generated';
  payment_reference: string | null;
  paid_by: string | null;
  failure_reason: string | null;
  undo_count: number;
  created_at: string;
  processed_at: string | null;
  host: { id: number; name: string; email: string; phone: string } | null;
}

export interface HostPayoutAccount {
  payment_method: PayoutMethod;
  full_name: string;
  phone_number: string | null;
  mobile_provider: 'MTN' | 'Moov' | 'Celtiis' | null;
  bank_name: string | null;
  account_holder: string | null;
  iban: string | null;
  bic: string | null;
  destination?: string;
  updated_at?: string;
}

export interface HostBalance {
  gross: number;
  commission_rate: number;
  commission: number;
  net: number;
  paid: number;
  open: number;
  owed: number;
}

export interface HostWithBalance {
  id: number;
  name: string;
  email: string;
  phone: string;
  host_type?: string | null;
  balance: HostBalance;
  account: HostPayoutAccount | null;
  last_paid_at: string | null;
}

export interface HostPayoutStats {
  owed_total: number;
  hosts_owed: number;
  open_total: number;
  open_count: number;
  overdue_count: number;
  paid_this_month: number;
  commission_total: number;
  hosts_count: number;
  hosts_without_account: number;
  commission_rate: number;
  min_payout_amount: number;
  overdue_days: number;
}

export interface PlatformSettingItem {
  key: 'commission_rate' | 'min_payout_amount' | 'payout_overdue_days';
  label: string;
  value: number;
  default: number;
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

  /**
   * Récupère la pièce d'identité d'un hôte pour consultation.
   *
   * L'endpoint diffuse le fichier lui-même — il ne renvoie aucune URL du
   * document. On en fait donc une URL d'objet locale, à révoquer après usage
   * (`revokeIdentityDocument`) pour ne pas laisser le contenu en mémoire.
   *
   * Chaque appel est journalisé côté serveur : consulter la pièce d'identité
   * de quelqu'un est un accès à une donnée personnelle.
   */
  async getIdentityDocument(id: number): Promise<{ objectUrl: string; contentType: string }> {
    const response = await this.api.get(`/admin/users/${id}/identity-document`, {
      responseType: 'blob',
    });
    return {
      objectUrl: URL.createObjectURL(response.data),
      contentType: response.data.type || 'application/octet-stream',
    };
  }

  revokeIdentityDocument(objectUrl: string) {
    URL.revokeObjectURL(objectUrl);
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

  // ==================== RÉGLAGES ====================

  async getSettings(): Promise<{ success: boolean; data: PlatformSettingItem[] }> {
    const response = await this.api.get('/admin/settings');
    return response.data;
  }

  async updateSettings(settings: Partial<Record<PlatformSettingItem['key'], number>>): Promise<{
    success: boolean; message: string; data: PlatformSettingItem[];
  }> {
    const response = await this.api.put('/admin/settings', settings);
    return response.data;
  }

  async updatePropertyPromotion(id: number, isHotelPromoted: boolean) {
    const response = await this.api.patch(`/admin/properties/${id}/promote-hotel`, { 
      is_hotel_promoted: isHotelPromoted 
    });
    return response.data;
  }

  // ==================== VERSEMENTS AUX HÔTES ====================

  async getHostPayoutStats(): Promise<{ success: boolean; data: HostPayoutStats }> {
    const response = await this.api.get('/admin/host-payouts/stats');
    return response.data;
  }

  async getHostPayouts(params?: {
    status?: 'open' | 'completed' | 'failed';
    search?: string;
    host_id?: number;
    per_page?: number;
    page?: number;
  }): Promise<{ success: boolean; data: { data: HostPayout[]; total: number; current_page: number; last_page: number } }> {
    const response = await this.api.get('/admin/host-payouts', { params });
    return response.data;
  }

  async getHostsWithBalance(params?: { search?: string; owed_only?: boolean }): Promise<{ success: boolean; data: HostWithBalance[] }> {
    const response = await this.api.get('/admin/host-payouts/hosts', {
      params: { search: params?.search || undefined, owed_only: params?.owed_only ? 1 : undefined },
    });
    return response.data;
  }

  async saveHostPayoutAccount(hostId: number, data: HostPayoutAccount): Promise<{ success: boolean; message: string; data: HostPayoutAccount }> {
    const response = await this.api.put(`/admin/host-payouts/hosts/${hostId}/account`, data);
    return response.data;
  }

  /** Crée les versements pour tous les hôtes (ou un seul) dont le solde dû atteint le minimum. */
  async generateHostPayouts(hostId?: number): Promise<{
    success: boolean; message: string;
    data: { created: number; total_amount: number; skipped_no_account: string[] };
  }> {
    const response = await this.api.post('/admin/host-payouts/generate', hostId ? { host_id: hostId } : {});
    return response.data;
  }

  async markHostPayoutPaid(payoutId: number, paymentReference: string): Promise<{ success: boolean; message: string; data: HostPayout }> {
    const response = await this.api.put(`/admin/host-payouts/${payoutId}/mark-paid`, { payment_reference: paymentReference });
    return response.data;
  }

  async cancelHostPayout(payoutId: number, reason: string): Promise<{ success: boolean; message: string; data: HostPayout }> {
    const response = await this.api.post(`/admin/host-payouts/${payoutId}/cancel`, { reason });
    return response.data;
  }

  async undoHostPayout(payoutId: number, reason: string): Promise<{ success: boolean; message: string; data: HostPayout }> {
    const response = await this.api.post(`/admin/host-payouts/${payoutId}/undo`, { reason });
    return response.data;
  }

  async exportHostPayouts(params?: { status?: 'open' | 'completed' | 'failed'; search?: string }): Promise<Blob> {
    const response = await this.api.get('/admin/host-payouts/export', { params, responseType: 'blob' });
    return response.data;
  }
}



export default new AdminService();
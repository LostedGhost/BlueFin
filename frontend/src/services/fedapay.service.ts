// services/fedapay.service.ts

import { v1Api } from './api';

interface FedapayCustomer {
  firstname: string;
  lastname: string;
  email: string;
  phone?: string;
}

interface FedapayPaymentData {
  amount: number;
  currency: 'XAF' | 'EUR' | 'USD';
  customer: FedapayCustomer;
  description: string;
  reference?: string;
  callback_url?: string;
  cancel_url?: string;
  booking_id?: string | number;
  booking_data?: Record<string, any>;
  booking_type?: 'experience' | 'service' | 'property';
}

class FedapayService {
  // ✅ Clé publique Fedapay (à mettre dans .env)
  private publicKey = 'pk_live_Or1ICljkG96OG4n797pBQvlD';
  private apiUrl = 'https://api.fedapay.com/v1';

  constructor() {
    console.log('🔧 Fedapay service - utilisation directe');
  }

  // ✅ Version directe - Appelle Fedapay directement sans passer par le backend
  async initiatePayment(data: FedapayPaymentData) {
    try {
      console.log('📤 Envoi direct à Fedapay API');

      // ✅ Formater le payload pour Fedapay
      const payload = {
        amount: data.amount,
        currency: data.currency,
        customer: {
          firstname: data.customer.firstname,
          lastname: data.customer.lastname,
          email: data.customer.email,
          phone: data.customer.phone || ''
        },
        description: data.description,
        reference: data.reference || `EXP-${Date.now()}`,
        callback_url: data.callback_url || `${window.location.origin}/payment/fedapay/callback`,
        cancel_url: data.cancel_url || `${window.location.origin}/payment/fedapay/cancel`,
        metadata: {
          booking_type: 'experience',
          booking_data: data.booking_data || {}
        }
      };

      console.log('📤 Payload envoyé à Fedapay:', JSON.stringify(payload, null, 2));

      // ✅ Appel direct à l'API Fedapay
      const response = await fetch(`${this.apiUrl}/transactions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.publicKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      // ✅ Lire la réponse
      const responseData = await response.json();
      console.log('📥 Réponse Fedapay:', responseData);

      if (!response.ok) {
        throw new Error(responseData.message || 'Erreur Fedapay');
      }

      // ✅ Extraire les données
      const transactionData = responseData;
      
      // ✅ Construire l'URL de paiement
      let paymentUrl = transactionData.payment_url;
      
      // Si pas d'URL de paiement, utiliser l'URL de base avec l'ID
      if (!paymentUrl && transactionData.id) {
        paymentUrl = `https://me.fedapay.com/bf-immo/${transactionData.id}`;
      }
      
      // Dernier fallback
      if (!paymentUrl) {
        paymentUrl = 'https://me.fedapay.com/bf-immo';
      }

      // ✅ Sauvegarder pour le callback
      sessionStorage.setItem('fedapay_transaction_id', transactionData.id || '');
      sessionStorage.setItem('fedapay_token', transactionData.token || '');
      if (data.booking_data) {
        sessionStorage.setItem('fedapay_booking_data', JSON.stringify(data.booking_data));
      }
      sessionStorage.setItem('fedapay_payment_url', paymentUrl);

      console.log('✅ Transaction créée, URL de paiement:', paymentUrl);

      return {
        success: true,
        data: transactionData,
        payment_url: paymentUrl,
        transaction_id: transactionData.id
      };

    } catch (error: any) {
      console.error('❌ Erreur Fedapay:', error);
      
      let errorMessage = 'Erreur lors de l\'initiation du paiement';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  }

  async getTransactionStatus(transactionId: string) {
    try {
      const response = await fetch(`${this.apiUrl}/transactions/${transactionId}`, {
        headers: {
          'Authorization': `Bearer ${this.publicKey}`,
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Erreur récupération transaction');
      }
      
      return await response.json();
    } catch (error) {
      console.error('❌ Erreur getTransactionStatus:', error);
      throw error;
    }
  }

  async confirmPayment(transactionId: string, bookingId: string) {
    try {
      // ✅ Utiliser le backend pour confirmer le paiement
      const response = await v1Api.post(`/payments/fedapay/${transactionId}/confirm`, { booking_id: bookingId });
      return response.data?.data;
    } catch (error) {
      console.error('❌ Erreur confirmPayment:', error);
      throw error;
    }
  }
}

export const fedapayService = new FedapayService();
// services/messageService.ts
import { v1Api } from './api';

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  booking_id: number | null;
  message: string;
  is_read: boolean;
  read_at: string | null;
  message_type: string;
  attachment_url: string | null;
  attachment_name: string | null;
  attachment_size: number | null;
  created_at: string;
  updated_at: string;
  sender?: {
    id: number;
    full_name: string;
    profile_photo_url: string | null;
  };
  receiver?: {
    id: number;
    full_name: string;
    profile_photo_url: string | null;
  };
}

export interface Conversation {
  booking: {
    id: number;
    reference: string;
    property: {
      id: number;
      title: string;
      photo: string | null;
    };
    host: {
      id: number;
      name: string;
      photo: string | null;
    };
    dates: {
      check_in: string;
      check_out: string;
    };
  };
  last_message: {
    message: string;
    sent_at: string;
    is_from_host: boolean;
  } | null;
  unread_count: number;
  type: 'inquiry' | 'experience';
}

export interface InquiryConversation {
  booking: {
    id: null;
    reference: string;
    property: {
      id: number | null;
      title: string;
      photo: string | null;
    };
    host: {
      id: number;
      name: string;
      photo: string | null;
    };
    dates: null;
  };
  last_message: {
    message: string;
    sent_at: string;
    is_from_me: boolean;
  } | null;
  unread_count: number;
  type: 'inquiry';
}

const messageService = {
  // Récupérer toutes les conversations du voyageur (avec réservation)
  getConversations: async (): Promise<{ data: Conversation[] }> => {
    const response = await v1Api.get('/traveler/messages/conversations');
    return response.data;
  },

  
  // Récupérer les messages d'un inquiry (sans réservation) - AVEC FALLBACK
  getInquiryMessages: async (hostId: number): Promise<{ data: { host: any; messages: Message[] } }> => {
    try {
      console.log('📥 Tentative récupération inquiry messages pour hostId:', hostId);
      const response = await v1Api.get(`/traveler/messages/inquiry/${hostId}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erreur getInquiryMessages:', error.response?.status, error.response?.data);
      
      // Si erreur 500, retourner un objet vide au lieu de bloquer
      if (error.response?.status === 500) {
        console.warn('⚠️ API inquiry retourne 500, retour de données vides');
        return {
          data: {
            host: {
              id: hostId,
              name: 'Hôte',
              photo: null
            },
            messages: []
          }
        };
      }
      throw error;
    }
  },

  

  // Récupérer les messages locaux en attente
  getPendingInquiryMessages: (hostId: number): Message[] => {
    try {
      const pendingMessages = JSON.parse(localStorage.getItem('pendingInquiryMessages') || '{}');
      return pendingMessages[hostId] || [];
    } catch {
      return [];
    }
  },

  // Nettoyer les messages locaux après synchronisation réussie
  clearPendingInquiryMessages: (hostId: number): void => {
    try {
      const pendingMessages = JSON.parse(localStorage.getItem('pendingInquiryMessages') || '{}');
      delete pendingMessages[hostId];
      localStorage.setItem('pendingInquiryMessages', JSON.stringify(pendingMessages));
    } catch (error) {
      console.error('Erreur nettoyage messages locaux:', error);
    }
  },

  // Synchroniser les messages locaux avec l'API
  syncPendingMessages: async (hostId: number): Promise<void> => {
    const pendingMessages = messageService.getPendingInquiryMessages(hostId);
    
    for (const msg of pendingMessages) {
      try {
        await messageService.sendInquiryReply(hostId, { message: msg.message });
        console.log('✅ Message local synchronisé:', msg.id);
      } catch (error) {
        console.error('❌ Échec synchronisation message:', msg.id, error);
      }
    }
    
    // Nettoyer après synchronisation
    messageService.clearPendingInquiryMessages(hostId);
  },


  // Récupérer les inquiries (sans booking)
  getInquiries: async (): Promise<{ data: InquiryConversation[] }> => {
    const response = await v1Api.get('/traveler/messages/inquiries');
    return response.data;
  },



  // Récupérer les messages d'une réservation spécifique
  getMessages: async (bookingId: number): Promise<{ data: { booking: any; messages: Message[] } }> => {
    const response = await v1Api.get(`/traveler/messages/booking/${bookingId}`);
    return response.data;
  },

 // services/messageService.ts

// ✅ S'assurer que sendMessage vérifie bookingId
sendMessage: async (bookingId: number, data: { message: string }): Promise<{ data: Message }> => {
  if (!bookingId) {
    throw new Error('Booking ID est requis');
  }
  console.log('📤 sendMessage - bookingId:', bookingId);
  const response = await v1Api.post(`/traveler/messages/booking/${bookingId}`, data);
  return response.data;
},

// ✅ S'assurer que sendInquiryReply vérifie hostId
sendInquiryReply: async (hostId: number, data: { message: string }): Promise<{ data: Message }> => {
  if (!hostId || isNaN(hostId)) {
    throw new Error('ID de l\'hôte invalide');
  }
  console.log('📤 sendInquiryReply - hostId:', hostId);
  
  try {
    const response = await v1Api.post(`/traveler/messages/inquiry/${hostId}`, {
      message: data.message.trim()
    });
    return response.data;
  } catch (error: any) {
    console.error('❌ Erreur sendInquiryReply:', error);
    // Fallback local...
    throw error;
  }
},

  // Envoyer une demande d'information (sans réservation)
  sendInquiry: async (data: { 
    property_id: number; 
    message: string; 
    check_in?: string; 
    check_out?: string; 
    guests?: number 
  }): Promise<{ data: Message }> => {
    const response = await v1Api.post('/traveler/messages/inquiry', data);
    return response.data;
  },

  // Marquer un message comme lu
  markAsRead: async (messageId: number): Promise<void> => {
    const response = await v1Api.post(`/traveler/messages/${messageId}/read`);
    return response.data;
  },

  // Marquer toute une conversation comme lue (pour booking)
  markConversationAsRead: async (bookingId: number): Promise<void> => {
    const response = await v1Api.post(`/traveler/messages/conversation/${bookingId}/read`);
    return response.data;
  },

  // Marquer toute une conversation d'inquiry comme lue
  markInquiryConversationAsRead: async (hostId: number): Promise<void> => {
    const response = await v1Api.post(`/traveler/messages/inquiry/${hostId}/read`);
    return response.data;
  },

  // Récupérer le nombre de messages non lus
  getUnreadCount: async (): Promise<{ data: { count: number } }> => {
    const response = await v1Api.get('/traveler/messages/unread/count');
    return response.data;
  },
};

export default messageService;
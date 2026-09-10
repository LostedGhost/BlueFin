// hooks/useInquiryMessages.ts

import { useState, useEffect, useCallback } from 'react';
import messageService, { Message } from '../../services/message.service';

export const useInquiryMessages = (hostId: number | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // Charger les messages (API + localStorage)
  const loadMessages = useCallback(async () => {
    if (!hostId) return;
    
    console.log('📥 Chargement des messages pour hostId:', hostId);
    setLoading(true);
    setError(null);
    
    try {
      // 1. Récupérer les messages de l'API
      const apiResponse = await messageService.getInquiryMessages(hostId);
      const apiMessages = apiResponse?.data?.messages || [];
      console.log('📥 Messages API:', apiMessages.length);
      
      // 2. Récupérer les messages locaux en attente
      const pendingMessages = messageService.getPendingInquiryMessages(hostId);
      console.log('📥 Messages en attente:', pendingMessages.length);
      
      // 3. Fusionner et trier par date
      const allMessages = [...apiMessages, ...pendingMessages].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      
      console.log('📥 Total messages:', allMessages.length);
      setMessages(allMessages);
    } catch (err: any) {
      console.error('❌ Erreur chargement messages:', err);
      setError(err.message || 'Impossible de charger les messages');
      
      // En cas d'erreur, au moins afficher les messages locaux
      const pendingMessages = messageService.getPendingInquiryMessages(hostId);
      setMessages(pendingMessages);
    } finally {
      setLoading(false);
    }
  }, [hostId]);

  // Envoyer un message
  const sendMessage = useCallback(async (text: string) => {
    if (!hostId || !text.trim()) {
      console.warn('⚠️ hostId manquant ou message vide');
      return false;
    }
    
    console.log('📤 Envoi message à hostId:', hostId);
    setSending(true);
    
    try {
      const response = await messageService.sendInquiryReply(hostId, { message: text.trim() });
      console.log('✅ Message envoyé:', response);
      
      // Ajouter le nouveau message à la liste avec la structure attendue
      const newMessage = {
        id: response.data?.id || Date.now(),
        sender_id: parseInt(localStorage.getItem('userId') || '0'),
        receiver_id: hostId,
        message: text.trim(),
        is_from_me: true,
        created_at: new Date().toISOString(),
        is_read: false,
        sender_name: 'Moi'
      };
      
      setMessages(prev => [...prev, newMessage]);
      
      // Essayer de synchroniser les messages en attente
      await messageService.syncPendingMessages(hostId);
      
      return true;
    } catch (error) {
      console.error('❌ Erreur envoi message:', error);
      
      // Sauvegarder localement en cas d'échec
      const pendingMessage = {
        id: Date.now(),
        sender_id: parseInt(localStorage.getItem('userId') || '0'),
        receiver_id: hostId,
        message: text.trim(),
        is_from_me: true,
        created_at: new Date().toISOString(),
        is_read: false,
        sender_name: 'Moi'
      };
      
      const pendingMessages = JSON.parse(localStorage.getItem('pendingInquiryMessages') || '{}');
      if (!pendingMessages[hostId]) {
        pendingMessages[hostId] = [];
      }
      pendingMessages[hostId].push(pendingMessage);
      localStorage.setItem('pendingInquiryMessages', JSON.stringify(pendingMessages));
      
      setMessages(prev => [...prev, pendingMessage]);
      
      return false;
    } finally {
      setSending(false);
    }
  }, [hostId]);

  // Effacer les messages locaux après synchronisation
  const clearPendingMessages = useCallback(() => {
    if (!hostId) return;
    messageService.clearPendingInquiryMessages(hostId);
  }, [hostId]);

  // Recharger périodiquement
  useEffect(() => {
    if (!hostId) return;
    
    console.log('🔄 Initialisation du hook pour hostId:', hostId);
    loadMessages();
    
    // Recharger toutes les 30 secondes
    const interval = setInterval(() => {
      console.log('🔄 Rechargement automatique des messages...');
      loadMessages();
    }, 30000);
    
    // Vérifier les messages en attente toutes les 10 secondes
    const pendingInterval = setInterval(() => {
      const pending = messageService.getPendingInquiryMessages(hostId);
      if (pending.length > 0) {
        console.log('📤 Synchronisation des messages en attente...');
        for (const msg of pending) {
          messageService.sendInquiryReply(hostId, { message: msg.message })
            .then(() => {
              console.log('✅ Message local synchronisé:', msg.id);
              loadMessages();
            })
            .catch(() => {});
        }
      }
    }, 10000);
    
    return () => {
      clearInterval(interval);
      clearInterval(pendingInterval);
      console.log('🧹 Nettoyage du hook pour hostId:', hostId);
    };
  }, [hostId, loadMessages]);

  return {
    messages,
    loading,
    error,
    sending,
    sendMessage,
    reloadMessages: loadMessages,
    clearPendingMessages
  };
};
// src/app/pages/admin/AdminMessagesPage.tsx
import { useQuery } from '@tanstack/react-query';
import { 
  MessageCircle, User, Mail, Clock, Search, 
  Filter, Eye, ChevronRight, Phone, MapPin,
  Calendar, Star, Reply, Flag, CheckCircle, XCircle,
  ArrowLeft, Send
} from 'lucide-react';
import adminService from '../../../services/admin.service';
import { useState } from 'react';
import toast from 'react-hot-toast';

export function AdminMessagesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [filterType, setFilterType] = useState<'all' | 'flagged' | 'unread'>('all');
  
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-messages'],
    queryFn: () => adminService.getMessages(),
    refetchInterval: 15000,
  });

  if (isLoading) return <LoadingSkeleton />;
  
  // ✅ Extraction correcte des messages depuis la réponse API
  // La structure est: data.data.data (car data contient { success, data: { data: [...] } })
  const allMessages = data?.data?.data || [];
  
  // 🔍 Debug: Afficher la structure du premier message
  if (allMessages.length > 0) {
    console.log('📦 Premier message:', allMessages[0]);
    console.log('📦 Sender:', allMessages[0].sender);
    console.log('📦 Receiver:', allMessages[0].receiver);
  }
  
  // ✅ Fonction pour obtenir le nom complet d'un utilisateur
  const getFullName = (user: any): string => {
    console.log('🔍 getFullName reçoit:', user);
    
    if (!user) {
      console.log('❌ User est null ou undefined');
      return 'Utilisateur inconnu';
    }
    
    // Essayer différentes structures possibles
    if (user.first_name && user.last_name) {
      const name = `${user.first_name} ${user.last_name}`.trim();
      console.log('✅ Nom trouvé via first_name/last_name:', name);
      return name;
    }
    
    if (user.full_name) {
      console.log('✅ Nom trouvé via full_name:', user.full_name);
      return user.full_name;
    }
    
    if (user.name) {
      console.log('✅ Nom trouvé via name:', user.name);
      return user.name;
    }
    
    if (user.email) {
      console.log('⚠️ Utilisation de l\'email comme nom:', user.email);
      return user.email.split('@')[0];
    }
    
    console.log('❌ Aucun nom trouvé pour:', user);
    return 'Utilisateur inconnu';
  };
  
  // ✅ Fonction pour obtenir l'avatar
  const getAvatarUrl = (user: any): string => {
    if (!user) return `https://ui-avatars.com/api/?background=00c9a7&color=fff&name=?&bold=true&size=40`;
    
    if (user.profile_photo) return user.profile_photo;
    
    const name = getFullName(user);
    return `https://ui-avatars.com/api/?background=00c9a7&color=fff&name=${encodeURIComponent(name.charAt(0))}&bold=true&size=40`;
  };
  
  const filteredMessages = allMessages.filter((msg: any) => {
    const senderName = getFullName(msg.sender);
    const receiverName = getFullName(msg.receiver);
    const messageText = msg.message || '';
    
    const matchesSearch = searchTerm === '' || 
      senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receiverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      messageText.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === 'flagged') return matchesSearch && msg.is_flagged;
    if (filterType === 'unread') return matchesSearch && !msg.is_read;
    return matchesSearch;
  });

  const stats = {
    total: allMessages.length,
    unread: allMessages.filter((m: any) => !m.is_read).length,
    flagged: allMessages.filter((m: any) => m.is_flagged).length,
    today: allMessages.filter((m: any) => {
      const today = new Date().toDateString();
      return new Date(m.created_at).toDateString() === today;
    }).length,
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* En-tête */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#0f2940] to-[#00c9a7] bg-clip-text text-transparent">
          Surveillance des messages
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">Analysez et modérez les conversations entre utilisateurs</p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard icon={<MessageCircle className="w-5 h-5" />} label="Total messages" value={stats.total} color="blue" />
        <StatCard icon={<Mail className="w-5 h-5" />} label="Non lus" value={stats.unread} color="yellow" />
        <StatCard icon={<Flag className="w-5 h-5" />} label="Signalés" value={stats.flagged} color="red" />
        <StatCard icon={<Calendar className="w-5 h-5" />} label="Aujourd'hui" value={stats.today} color="green" />
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par expéditeur, destinataire ou contenu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00c9a7]"
            />
          </div>
          <div className="flex gap-2">
            <FilterButton active={filterType === 'all'} onClick={() => setFilterType('all')} label="Tous" />
            <FilterButton active={filterType === 'unread'} onClick={() => setFilterType('unread')} label="Non lus" />
            <FilterButton active={filterType === 'flagged'} onClick={() => setFilterType('flagged')} label="Signalés" />
            <button
              onClick={() => refetch()}
              className="px-3 py-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
            >
              🔄
            </button>
          </div>
        </div>
      </div>

      {/* Liste des messages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Colonne gauche - Liste */}
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
          {filteredMessages.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Aucun message trouvé</p>
            </div>
          ) : (
            filteredMessages.map((msg: any) => (
              <MessageCard
                key={msg.id}
                message={msg}
                isSelected={selectedMessage?.id === msg.id}
                onClick={() => setSelectedMessage(msg)}
                getFullName={getFullName}
                getAvatarUrl={getAvatarUrl}
              />
            ))
          )}
        </div>

        {/* Colonne droite - Détails du message */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden sticky top-4 h-[600px] flex flex-col">
          {selectedMessage ? (
            <MessageDetail 
              message={selectedMessage} 
              onClose={() => setSelectedMessage(null)}
              getFullName={getFullName}
              getAvatarUrl={getAvatarUrl}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-6">
              <MessageCircle className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-center">Sélectionnez un message<br />pour voir les détails</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ✅ Composant de carte message
const MessageCard = ({ message, isSelected, onClick, getFullName, getAvatarUrl }: any) => {
  const isUnread = !message.is_read;
  const isFlagged = message.is_flagged;
  
  // ✅ Récupérer les noms directement depuis message.sender et message.receiver
  const senderName = message.sender 
    ? `${message.sender.first_name || ''} ${message.sender.last_name || ''}`.trim() 
    : 'Expéditeur inconnu';
  
  const receiverName = message.receiver 
    ? `${message.receiver.first_name || ''} ${message.receiver.last_name || ''}`.trim() 
    : 'Destinataire inconnu';
  
  const senderAvatar = message.sender?.profile_photo || 
    `https://ui-avatars.com/api/?background=00c9a7&color=fff&name=${senderName.charAt(0) || '?'}&bold=true&size=40`;
  
  const messagePreview = message.message?.length > 80 
    ? message.message.substring(0, 80) + '...' 
    : message.message;
  
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl p-3 cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-[#00c9a7] shadow-lg' : 'shadow-sm'
      } ${isUnread ? 'border-l-4 border-l-[#00c9a7] bg-[#f4fffe]' : ''}`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <img 
          src={senderAvatar}
          alt={senderName}
          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?background=00c9a7&color=fff&name=${senderName.charAt(0) || '?'}&bold=true&size=40`;
          }}
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1 min-w-0">
              {/* NOM DE L'EXPÉDITEUR */}
              <p className={`text-sm truncate ${isUnread ? 'font-semibold text-[#0F2940]' : 'font-medium text-gray-700'}`}>
                {senderName !== 'Expéditeur inconnu' ? senderName : (message.sender?.email || 'Expéditeur inconnu')}
              </p>
              {/* NOM DU DESTINATAIRE avec flèche */}
              <p className="text-xs text-gray-400 truncate">
                → {receiverName !== 'Destinataire inconnu' ? receiverName : (message.receiver?.email || 'Destinataire inconnu')}
              </p>
            </div>
            <div className="flex gap-1 shrink-0">
              {isFlagged && <Flag className="w-3 h-3 text-red-500 fill-red-500" />}
              {isUnread && <div className="w-2 h-2 rounded-full bg-[#00c9a7] animate-pulse"></div>}
            </div>
          </div>
          {/* Aperçu du message */}
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{messagePreview || 'Aucun contenu'}</p>
          {/* Date */}
          <p className="text-xs text-gray-400 mt-1">{formatDate(message.created_at)}</p>
        </div>
        <ChevronRight className={`w-4 h-4 flex-shrink-0 ${isUnread ? 'text-[#00c9a7]' : 'text-gray-400'}`} />
      </div>
    </div>
  );
};

// ✅ Composant de détail du message
const MessageDetail = ({ message, onClose, getFullName, getAvatarUrl }: any) => {
  const [showFullMessage, setShowFullMessage] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReplyForm, setShowReplyForm] = useState(false);
  
  // ✅ Récupérer les noms directement depuis message.sender et message.receiver
  const senderName = message.sender 
    ? `${message.sender.first_name || ''} ${message.sender.last_name || ''}`.trim() 
    : 'Expéditeur inconnu';
  
  const receiverName = message.receiver 
    ? `${message.receiver.first_name || ''} ${message.receiver.last_name || ''}`.trim() 
    : 'Destinataire inconnu';
  
  const senderAvatar = message.sender?.profile_photo || 
    `https://ui-avatars.com/api/?background=00c9a7&color=fff&name=${senderName.charAt(0) || '?'}&bold=true&size=40`;
  
  const messageContent = message.message || 'Aucun contenu';
  
  const handleReply = () => {
    if (!replyText.trim()) {
      toast.error('Veuillez écrire un message');
      return;
    }
    toast.success('Réponse envoyée');
    setReplyText('');
    setShowReplyForm(false);
  };
  
  return (
    <>
      <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="lg:hidden p-1 hover:bg-gray-200 rounded-lg transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <img 
            src={senderAvatar}
            alt={senderName}
            className="w-10 h-10 rounded-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?background=00c9a7&color=fff&name=${senderName.charAt(0) || '?'}&bold=true&size=40`;
            }}
          />
          <div>
            <p className="font-semibold text-[#0F2940]">{senderName || message.sender?.email || 'Expéditeur'}</p>
            <p className="text-xs text-gray-500">{message.sender?.email || 'Email non disponible'}</p>
          </div>
        </div>
        <button onClick={onClose} className="hidden lg:block p-1 hover:bg-gray-200 rounded-lg transition">
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Informations de l'expéditeur */}
        <div className="bg-gray-50 rounded-xl p-3">
          <div className="flex items-center gap-3 mb-2">
            <User className="w-4 h-4 text-[#00c9a7]" />
            <p className="font-semibold text-sm">Expéditeur</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 w-24">Nom</span>
              <span className="font-medium text-[#0F2940]">{senderName || '-'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 w-24">Email</span>
              <span className="font-medium truncate">{message.sender?.email || '-'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 w-24">Téléphone</span>
              <span className="font-medium">{message.sender?.phone || '-'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 w-24">Type</span>
              <span className={`font-medium capitalize ${
                message.sender?.user_type === 'hote' ? 'text-[#00c9a7]' : 'text-blue-600'
              }`}>
                {message.sender?.user_type === 'hote' ? 'Hôte' : message.sender?.user_type === 'voyageur' ? 'Voyageur' : '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Informations destinataire */}
        <div className="bg-gray-50 rounded-xl p-3">
          <div className="flex items-center gap-3 mb-2">
            <User className="w-4 h-4 text-[#00c9a7]" />
            <p className="font-semibold text-sm">Destinataire</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 w-24">Nom</span>
              <span className="font-medium text-[#0F2940]">{receiverName || '-'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 w-24">Email</span>
              <span className="font-medium truncate">{message.receiver?.email || '-'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 w-24">Type</span>
              <span className={`font-medium capitalize ${
                message.receiver?.user_type === 'hote' ? 'text-[#00c9a7]' : 'text-blue-600'
              }`}>
                {message.receiver?.user_type === 'hote' ? 'Hôte' : message.receiver?.user_type === 'voyageur' ? 'Voyageur' : '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Contenu du message */}
        <div className="bg-gray-50 rounded-xl p-3">
          <div className="flex items-center gap-3 mb-2">
            <MessageCircle className="w-4 h-4 text-[#00c9a7]" />
            <p className="font-semibold text-sm">Contenu du message</p>
          </div>
          <div className={`text-sm text-gray-700 leading-relaxed ${showFullMessage ? '' : 'max-h-32 overflow-hidden relative'}`}>
            <p className="whitespace-pre-wrap break-words">{messageContent}</p>
            {!showFullMessage && messageContent?.length > 200 && (
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-gray-50 to-transparent"></div>
            )}
          </div>
          {messageContent?.length > 200 && (
            <button
              onClick={() => setShowFullMessage(!showFullMessage)}
              className="text-xs text-[#00c9a7] mt-2 hover:underline"
            >
              {showFullMessage ? 'Voir moins' : 'Voir plus'}
            </button>
          )}
        </div>

        {/* Métadonnées */}
        <div className="bg-gray-50 rounded-xl p-3">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-4 h-4 text-[#00c9a7]" />
            <p className="font-semibold text-sm">Métadonnées</p>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Date d'envoi</span>
              <span className="font-medium">{formatDateTime(message.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Lu le</span>
              <span className="font-medium">{message.read_at ? formatDateTime(message.read_at) : 'Non lu'}</span>
            </div>
          </div>
        </div>

        {/* Formulaire de réponse */}
        {showReplyForm && (
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="flex items-center gap-3 mb-2">
              <Reply className="w-4 h-4 text-[#00c9a7]" />
              <p className="font-semibold text-sm">Répondre à {senderName || message.sender?.email?.split('@')[0] || 'l\'utilisateur'}</p>
            </div>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Écrivez votre réponse..."
              className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00c9a7] resize-none"
              rows={4}
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleReply}
                className="flex-1 px-3 py-2 bg-[#00c9a7] text-white rounded-lg text-sm hover:bg-[#00b892] transition flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Envoyer
              </button>
              <button
                onClick={() => setShowReplyForm(false)}
                className="px-3 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-100 transition"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 border-t bg-gray-50 flex gap-2">
        <button
          onClick={() => setShowReplyForm(!showReplyForm)}
          className="flex-1 px-3 py-2 bg-[#00c9a7] text-white rounded-lg text-sm hover:bg-[#00b892] transition flex items-center justify-center gap-2"
        >
          <Reply className="w-4 h-4" />
          Répondre
        </button>
        {!message.is_flagged && (
          <button className="px-3 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50 transition flex items-center gap-2">
            <Flag className="w-4 h-4" />
            Signaler
          </button>
        )}
      </div>
    </>
  );
};

// Composant de carte statistique
const StatCard = ({ icon, label, value, color }: any) => {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    yellow: 'from-yellow-500 to-yellow-600',
    red: 'from-red-500 to-red-600',
    green: 'from-green-500 to-green-600',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-xl p-3 text-white`}>
      <div className="flex justify-between items-center">
        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
          {icon}
        </div>
        <span className="text-xl font-bold">{value}</span>
      </div>
      <p className="text-white/80 text-xs mt-2">{label}</p>
    </div>
  );
};

// Bouton de filtre
const FilterButton = ({ active, onClick, label }: any) => (
  <button
    onClick={onClick}
    className={`px-3 py-2 rounded-xl text-sm transition ${
      active ? 'bg-[#00c9a7] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }`}
  >
    {label}
  </button>
);

// Utilitaires de formatage
const formatDate = (date: string) => {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'À l\'instant';
  if (minutes < 60) return `Il y a ${minutes} min`;
  if (hours < 24) return `Il y a ${hours} h`;
  if (days < 7) return `Il y a ${days} j`;
  return d.toLocaleDateString('fr-FR');
};

const formatDateTime = (date: string) => {
  const d = new Date(date);
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Skeleton de chargement
const LoadingSkeleton = () => (
  <div className="p-3 sm:p-4 md:p-6">
    <div className="animate-pulse">
      <div className="h-6 sm:h-8 bg-gray-200 rounded w-48 mb-4"></div>
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[1, 2, 3, 4].map(i => <div key={i} className="bg-gray-200 rounded-xl h-20"></div>)}
      </div>
      <div className="bg-gray-200 rounded-xl h-12 mb-6"></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="bg-gray-200 rounded-xl h-24"></div>)}
        </div>
        <div className="bg-gray-200 rounded-xl h-[500px]"></div>
      </div>
    </div>
  </div>
);
// src/app/pages/admin/AdminBookingsPage.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Calendar, Users, Home, CreditCard, Search, 
  Filter, XCircle, CheckCircle, Eye, ChevronRight,
  Clock, MapPin, DollarSign, Phone, Mail, Download,
  ChevronDown, ChevronUp
} from 'lucide-react';
import adminService from '../../../services/admin.service';
import toast from 'react-hot-toast';
import { useState } from 'react';

export function AdminBookingsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: () => adminService.getBookings(),
  });
  const queryClient = useQueryClient();

  const cancelMutation = useMutation({
    mutationFn: (id: number) => adminService.cancelBooking(id),
    onSuccess: () => {
      toast.success('Réservation annulée');
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      refetch();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erreur lors de l\'annulation');
    },
  });

  if (isLoading) return <LoadingSkeleton />;
  
  const bookings = data?.data?.data || [];
  
  const filteredBookings = bookings.filter((booking: any) => {
    const matchesSearch = searchTerm === '' || 
      booking.booking_reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.property?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || booking.booking_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: bookings.length,
    confirmed: bookings.filter((b: any) => b.booking_status === 'confirmed').length,
    pending: bookings.filter((b: any) => b.booking_status === 'pending').length,
    completed: bookings.filter((b: any) => b.booking_status === 'completed').length,
    cancelled: bookings.filter((b: any) => b.booking_status === 'cancelled').length,
  };

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-20">
      <div className="p-3 sm:p-4 md:p-6">
        {/* En-tête */}
        <div className="mb-5">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#0f2940] to-[#00c9a7] bg-clip-text text-transparent">
            Réservations
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Gérez toutes les réservations de la plateforme</p>
        </div>

        {/* Statistiques - grille responsive */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3 mb-5">
          <StatBadge label="Total" value={stats.total} color="gray" />
          <StatBadge label="Confirmées" value={stats.confirmed} color="green" />
          <StatBadge label="En attente" value={stats.pending} color="yellow" />
          <StatBadge label="Terminées" value={stats.completed} color="blue" />
          <StatBadge label="Annulées" value={stats.cancelled} color="red" />
        </div>

        {/* Recherche et filtres */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm mb-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par référence, propriété ou voyageur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00c9a7]"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00c9a7] bg-white"
              >
                <option value="all">Tous les statuts</option>
                <option value="confirmed">Confirmées</option>
                <option value="pending">En attente</option>
                <option value="completed">Terminées</option>
                <option value="cancelled">Annulées</option>
              </select>
              <button
                onClick={() => refetch()}
                className="px-3 py-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
                title="Rafraîchir"
              >
                🔄
              </button>
            </div>
          </div>
        </div>

        {/* Liste des réservations */}
        <div className="space-y-3">
          {filteredBookings.length === 0 ? (
            <div className="bg-white rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center">
              <Calendar className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Aucune réservation trouvée</p>
            </div>
          ) : (
            filteredBookings.map((booking: any) => (
              <BookingCard 
                key={booking.id} 
                booking={booking} 
                isExpanded={expandedId === booking.id}
                onToggle={() => toggleExpand(booking.id)}
                onCancel={() => {
                  if (confirm("Êtes-vous sûr de vouloir annuler cette réservation ?")) {
                    cancelMutation.mutate(booking.id);
                  }
                }}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Composant de carte réservation responsive
const BookingCard = ({ booking, isExpanded, onToggle, onCancel }: any) => {
  const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
    confirmed: { color: 'green', icon: CheckCircle, label: 'Confirmée' },
    pending: { color: 'yellow', icon: Clock, label: 'En attente' },
    completed: { color: 'blue', icon: CheckCircle, label: 'Terminée' },
    cancelled: { color: 'red', icon: XCircle, label: 'Annulée' },
  };
  
  const config = statusConfig[booking.booking_status] || statusConfig.pending;
  const StatusIcon = config.icon;

  // Calcul du nombre de nuits
  const nights = (() => {
    if (booking.nights_count) return booking.nights_count;
    if (booking.check_in && booking.check_out) {
      const start = new Date(booking.check_in);
      const end = new Date(booking.check_out);
      const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : 1;
    }
    return 1;
  })();

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden">
      {/* En-tête de la carte - toujours visible */}
      <div 
        className="p-3 sm:p-4 cursor-pointer hover:bg-gray-50 transition"
        onClick={onToggle}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-${config.color}-100 flex items-center justify-center shrink-0`}>
              <StatusIcon className={`w-4 h-4 sm:w-5 sm:h-5 text-${config.color}-600`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10px] sm:text-xs font-semibold bg-gray-100 px-2 py-0.5 rounded">
                  #{booking.booking_reference?.slice(-8) || booking.id}
                </span>
                <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-${config.color}-100 text-${config.color}-700`}>
                  {config.label}
                </span>
              </div>
              <p className="font-semibold text-gray-800 text-xs sm:text-sm mt-1 truncate">{booking.property?.title || 'Propriété'}</p>
              <p className="text-[10px] sm:text-xs text-gray-500">{booking.property?.district || ''}, {booking.property?.city || ''}</p>
            </div>
          </div>
          <div className="flex items-center justify-between w-full sm:w-auto gap-3">
            <div className="text-left sm:text-right">
              <p className="text-base sm:text-lg font-bold text-[#00c9a7]">{booking.total_amount?.toLocaleString()} FCFA</p>
              <p className="text-[10px] sm:text-xs text-gray-400">{nights} nuit{nights > 1 ? 's' : ''}</p>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 shrink-0" />
            )}
          </div>
        </div>
      </div>

      {/* Détails étendus */}
      {isExpanded && (
        <div className="border-t border-gray-100 p-3 sm:p-4 bg-gray-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {/* Voyageur */}
            <div className="bg-white rounded-xl p-3 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-[#00c9a7]" />
                <h4 className="font-semibold text-sm">Voyageur</h4>
              </div>
              <p className="font-medium text-sm">{booking.user?.full_name || 'Non renseigné'}</p>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                <Mail className="w-3 h-3" />
                <span className="truncate">{booking.user?.email || '-'}</span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                <Phone className="w-3 h-3" />
                <span>{booking.user?.phone || 'Non renseigné'}</span>
              </div>
            </div>

            {/* Détails séjour */}
            <div className="bg-white rounded-xl p-3 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-[#00c9a7]" />
                <h4 className="font-semibold text-sm">Séjour</h4>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Arrivée</span>
                  <span className="font-medium">{booking.check_in || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Départ</span>
                  <span className="font-medium">{booking.check_out || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Nuits</span>
                  <span className="font-medium">{nights}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Voyageurs</span>
                  <span className="font-medium">{booking.guests_count || 1}</span>
                </div>
              </div>
            </div>

            {/* Paiement */}
            <div className="bg-white rounded-xl p-3 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-4 h-4 text-[#00c9a7]" />
                <h4 className="font-semibold text-sm">Paiement</h4>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Méthode</span>
                  <span className="font-medium capitalize">{booking.payment_method || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Statut</span>
                  <span className={`font-medium ${booking.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                    {booking.payment_status === 'paid' ? 'Payé' : 'En attente'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total</span>
                  <span className="font-medium text-[#00c9a7]">{booking.total_amount?.toLocaleString()} FCFA</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          {booking.booking_status !== 'cancelled' && booking.booking_status !== 'completed' && (
            <div className="mt-3 flex justify-end">
              <button
                onClick={(e) => { e.stopPropagation(); onCancel(); }}
                className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs hover:bg-red-600 transition"
              >
                Annuler la réservation
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Composant de badge statistique responsive
const StatBadge = ({ label, value, color }: { label: string; value: number; color: string }) => {
  const colorClasses: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-700',
    green: 'bg-green-100 text-green-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    blue: 'bg-blue-100 text-blue-700',
    red: 'bg-red-100 text-red-700',
  };

  return (
    <div className={`rounded-lg sm:rounded-xl p-2 sm:p-3 text-center ${colorClasses[color]}`}>
      <p className="text-lg sm:text-2xl font-bold">{value}</p>
      <p className="text-[10px] sm:text-xs hidden sm:block">{label}</p>
      <p className="text-[8px] sm:hidden">{label.slice(0, 3)}</p>
    </div>
  );
};

// Skeleton de chargement responsive
const LoadingSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
    <div className="p-3 sm:p-4 md:p-6">
      <div className="animate-pulse">
        <div className="h-6 sm:h-8 bg-gray-200 rounded w-32 mb-4"></div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-5">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="bg-gray-200 rounded-lg h-16"></div>)}
        </div>
        <div className="bg-gray-200 rounded-xl h-12 mb-5"></div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="bg-gray-200 rounded-xl h-24"></div>)}
        </div>
      </div>
    </div>
  </div>
);
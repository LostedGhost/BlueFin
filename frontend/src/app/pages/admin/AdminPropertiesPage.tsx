// src/app/pages/admin/AdminPropertiesPage.tsx - Version complète corrigée
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../../contexts/ThemeContext';
import { 
  Home, Users, Calendar as CalendarIcon, Search, Eye, 
  CheckCircle, XCircle, MapPin, User, DollarSign,
  Clock, AlertCircle
} from 'lucide-react';
import adminService from '../../../services/admin.service';
import toast from 'react-hot-toast';
import { PropertyDetailModal } from '../../components/PropertyDetailModal';

// ============================================
// STAT CARD - CORRIGÉ (accepte un composant)
// ============================================
const StatCard = ({ icon: Icon, label, value, color }: any) => {
  const colors = {
    yellow: 'from-yellow-500 to-yellow-600',
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-xl p-3 text-white`}>
      <div className="flex justify-between items-center">
        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-xl font-bold">{value}</span>
      </div>
      <p className="text-white/80 text-xs mt-1">{label}</p>
    </div>
  );
};

// ============================================
// LOADING SKELETON - AVEC MODE SOMBRE
// ============================================
const LoadingSkeleton = ({ isDark }: { isDark: boolean }) => (
  <div className="p-3 sm:p-4 md:p-6">
    <div className="animate-pulse">
      <div className={`h-6 sm:h-8 ${isDark ? 'bg-slate-700' : 'bg-gray-200'} rounded w-48 mb-4`}></div>
      <div className={`${isDark ? 'bg-slate-700' : 'bg-gray-200'} rounded-xl h-12 mb-6`}></div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => <div key={i} className={`${isDark ? 'bg-slate-700' : 'bg-gray-200'} rounded-xl h-20`}></div>)}
      </div>
      <div className={`${isDark ? 'bg-slate-700' : 'bg-gray-200'} rounded-xl h-80 mb-6`}></div>
    </div>
  </div>
);

// ============================================
// ADMIN PROPERTY CARD - AVEC MODE SOMBRE
// ============================================
const AdminPropertyCard = ({ property, isDark, onView, onApprove, onReject }: any) => {
  const getFirstImage = () => {
    if (property.photos && property.photos.length > 0) {
      const photo = property.photos[0];
      return photo.photo_url || photo.url || photo.path || '';
    }
    if (property.cover_photo) {
      if (typeof property.cover_photo === 'string') return property.cover_photo;
      return property.cover_photo.photo_url || property.cover_photo.url || '';
    }
    return '';
  };

  const imageUrl = getFirstImage();

  return (
    <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'} rounded-xl sm:rounded-2xl p-4 shadow-sm hover:shadow-md transition-all border`}>
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Image */}
        <div className="w-full sm:w-32 h-48 sm:h-32 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={property.title} 
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.jpg'; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Home className={`w-8 h-8 ${isDark ? 'text-slate-600' : 'text-gray-400'}`} />
            </div>
          )}
        </div>

        {/* Infos */}
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'} text-lg`}>{property.title}</h3>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-700'}`}>
              En attente
            </span>
            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>• {property.city}, {property.district}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
            <div className={`flex items-center gap-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
              <User className="w-4 h-4" />
              <span>{property.user?.full_name || 'Hôte'}</span>
            </div>
            <div className={`flex items-center gap-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
              <DollarSign className="w-4 h-4" />
              <span>{property.price_per_night?.toLocaleString()} FCFA/nuit</span>
            </div>
            <div className={`flex items-center gap-1 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
              <CalendarIcon className="w-4 h-4" />
              <span>Soumis le {new Date(property.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-row sm:flex-col gap-2 justify-end">
          <button
            onClick={onView}
            className={`p-2 ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'} rounded-lg transition`}
            title="Voir les détails"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={onApprove}
            className="p-2 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg transition"
            title="Approuver"
          >
            <CheckCircle className="w-4 h-4" />
          </button>
          <button
            onClick={onReject}
            className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition"
            title="Rejeter"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// ADMIN PROPERTIES PAGE PRINCIPALE - AVEC MODE SOMBRE
// ============================================
export function AdminPropertiesPage({ onNavigate }: { onNavigate?: (route: any) => void }) {
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-pending-properties'],
    queryFn: () => adminService.getPendingProperties(),
    refetchInterval: 10000,
  });
  const queryClient = useQueryClient();

  const approveMutation = useMutation({
    mutationFn: ({ id, notes, featured }: { id: number; notes?: string; featured?: boolean }) =>
      adminService.approveProperty(id, notes, featured),
    onSuccess: () => {
      toast.success('✅ Propriété approuvée avec succès');
      queryClient.invalidateQueries({ queryKey: ['admin-pending-properties'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      setSelectedProperty(null);
      refetch();
    },
    onError: () => toast.error('❌ Erreur lors de l’approbation'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      adminService.rejectProperty(id, reason),
    onSuccess: () => {
      toast.success('✅ Propriété rejetée');
      queryClient.invalidateQueries({ queryKey: ['admin-pending-properties'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      setSelectedProperty(null);
      refetch();
    },
    onError: () => toast.error('❌ Erreur lors du rejet'),
  });

  if (isLoading) return <LoadingSkeleton isDark={isDark} />;
  
  const payload = data ?? {};
  const properties = Array.isArray(payload) ? payload : payload.data ?? payload.data?.data ?? [];
  const stats = payload.stats ?? payload.data?.stats ?? { total_pending: 0, pending_today: 0 };
  
  const filteredProperties = properties.filter((property: any) => {
    return searchTerm === '' || 
      property.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleApprove = (property: any) => {
    const notes = prompt("Ajouter une note (optionnelle) :");
    approveMutation.mutate({ id: property.id, notes: notes || undefined, featured: false });
  };

  const handleReject = (property: any) => {
    const reason = prompt("Raison du rejet (requise) :");
    if (reason && reason.length >= 10) {
      rejectMutation.mutate({ id: property.id, reason });
    } else if (reason) {
      toast.error('❌ La raison doit contenir au moins 10 caractères');
    }
  };

  return (
    <div className={`p-3 sm:p-4 md:p-6 ${isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-gray-50 to-gray-100'} min-h-screen transition-colors duration-300`}>
      {/* En-tête */}
      <div className="mb-6">
        <h1 className={`text-xl sm:text-2xl md:text-3xl font-bold ${isDark ? 'text-white' : 'bg-gradient-to-r from-[#0f2940] to-[#00c9a7] bg-clip-text text-transparent'}`}>
          Modération des propriétés
        </h1>
        <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
          Validez ou rejetez les annonces en attente
        </p>
      </div>

      {/* Statistiques - ✅ CORRECTION : passage des composants, pas des éléments JSX */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard 
          icon={Home} 
          label="En attente" 
          value={stats.total_pending || 0} 
          color="yellow"
        />
        <StatCard 
          icon={CalendarIcon} 
          label="Aujourd'hui" 
          value={stats.pending_today || 0} 
          color="blue"
        />
        <StatCard 
          icon={Users} 
          label="Hôtes" 
          value={new Set(properties.map((p: any) => p.user_id)).size} 
          color="green"
        />
        <StatCard 
          icon={MapPin} 
          label="Villes" 
          value={new Set(properties.map((p: any) => p.city)).size} 
          color="purple"
        />
      </div>

      {/* Barre de recherche */}
      <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'} rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border mb-6 transition-colors duration-300`}>
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
          <input
            type="text"
            placeholder="Rechercher par titre, ville ou hôte..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-9 pr-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00c9a7] transition-colors duration-300 ${
              isDark 
                ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400'
            }`}
          />
        </div>
      </div>

      {/* Liste des propriétés */}
      <div className="space-y-4">
        {filteredProperties.length === 0 ? (
          <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'} rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center border transition-colors duration-300`}>
            <Home className={`w-12 h-12 sm:w-16 sm:h-16 ${isDark ? 'text-slate-600' : 'text-gray-300'} mx-auto mb-3`} />
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Aucune propriété en attente de modération</p>
          </div>
        ) : (
          filteredProperties.map((property: any) => (
            <AdminPropertyCard
              key={property.id}
              property={property}
              isDark={isDark}
              onView={() => setSelectedProperty(property)}
              onApprove={() => handleApprove(property)}
              onReject={() => handleReject(property)}
            />
          ))
        )}
      </div>

      {/* Modal de détail */}
      {selectedProperty && (
        <PropertyDetailModal
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
          onApprove={() => handleApprove(selectedProperty)}
          onReject={() => handleReject(selectedProperty)}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
}
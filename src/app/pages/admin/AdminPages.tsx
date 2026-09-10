// src/app/pages/admin/AdminPages.tsx - Version complète avec mode sombre
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../contexts/ThemeContext';
import adminService from '../../../services/admin.service';
import { 
  Home, Users, Calendar, CreditCard, MessageCircle, 
  Search, Eye, ChevronRight, CheckCircle, XCircle, 
  Clock, DollarSign, Smartphone, Mail, Phone, MapPin,
  User, Ban, UserCheck, AlertCircle, Calendar as CalendarIcon,
  FileText, Download, Printer, RefreshCw, Share2,
  TrendingUp, Zap, PieChart, Activity, Star, Wallet,
  Sparkles, LogOut, Flag, Reply, MoreVertical, Trash2,
  X, ChevronLeft, Filter, Building2, UserPlus
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart as RePieChart, Pie, Cell, ComposedChart } from 'recharts';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { PropertyDetailModal } from '../components/PropertyDetailModal';

// ============================================
// COMPOSANT STATCARD AVEC MODE SOMBRE
// ============================================
const StatCard = ({ icon: Icon, label, value, color, subValue, isDark }: any) => {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-yellow-600',
    red: 'from-red-500 to-red-600',
    emerald: 'from-emerald-500 to-emerald-600',
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
      {subValue && <p className="text-white/60 text-[10px]">{subValue}</p>}
    </div>
  );
};

// ============================================
// COMPOSANT LOADING SKELETON AVEC MODE SOMBRE
// ============================================
const LoadingSkeleton = ({ isDark }: { isDark: boolean }) => (
  <div className="p-3 sm:p-4 md:p-6">
    <div className="animate-pulse">
      <div className={`h-6 sm:h-8 ${isDark ? 'bg-slate-700' : 'bg-gray-200'} rounded w-48 mb-4`}></div>
      <div className={`${isDark ? 'bg-slate-700' : 'bg-gray-200'} rounded-xl h-16 mb-6`}></div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => <div key={i} className={`${isDark ? 'bg-slate-700' : 'bg-gray-200'} rounded-xl h-28`}></div>)}
      </div>
      <div className={`${isDark ? 'bg-slate-700' : 'bg-gray-200'} rounded-xl h-80 mb-6`}></div>
    </div>
  </div>
);

// ============================================
// ADMIN PROPERTIES PAGE - MODE SOMBRE
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
      toast.success('Propriété approuvée avec succès');
      queryClient.invalidateQueries({ queryKey: ['admin-pending-properties'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      setSelectedProperty(null);
      refetch();
    },
    onError: () => toast.error('Erreur lors de l’approbation'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      adminService.rejectProperty(id, reason),
    onSuccess: () => {
      toast.success('Propriété rejetée');
      queryClient.invalidateQueries({ queryKey: ['admin-pending-properties'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      setSelectedProperty(null);
      refetch();
    },
    onError: () => toast.error('Erreur lors du rejet'),
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
      toast.error('La raison doit contenir au moins 10 caractères');
    }
  };

  return (
    <div className={`p-3 sm:p-4 md:p-6 ${isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-gray-50 to-gray-100'} min-h-screen transition-colors duration-300`}>
      <div className="mb-6">
        <h1 className={`text-xl sm:text-2xl md:text-3xl font-bold ${isDark ? 'text-white' : 'bg-gradient-to-r from-[#0f2940] to-[#00c9a7] bg-clip-text text-transparent'}`}>
          Modération des propriétés
        </h1>
        <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
          Validez ou rejetez les annonces en attente
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard icon={<Home className="w-5 h-5" />} label="En attente" value={stats.total_pending || 0} color="yellow" isDark={isDark} />
        <StatCard icon={<CalendarIcon className="w-5 h-5" />} label="Aujourd'hui" value={stats.pending_today || 0} color="blue" isDark={isDark} />
        <StatCard icon={<Users className="w-5 h-5" />} label="Hôtes" value={new Set(properties.map((p: any) => p.user_id)).size} color="green" isDark={isDark} />
        <StatCard icon={<MapPin className="w-5 h-5" />} label="Villes" value={new Set(properties.map((p: any) => p.city)).size} color="purple" isDark={isDark} />
      </div>

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
              onNavigate={onNavigate}
            />
          ))
        )}
      </div>

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

// ============================================
// ADMIN PROPERTY CARD - MODE SOMBRE
// ============================================
const AdminPropertyCard = ({ property, isDark, onView, onApprove, onReject, onNavigate }: any) => {
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
// ADMIN USERS PAGE - MODE SOMBRE
// ============================================
export function AdminUsersPage() {
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminService.getUsers(),
    refetchInterval: 30000,
  });
  const queryClient = useQueryClient();

  const suspendMutation = useMutation({
    mutationFn: ({ id, days }: { id: number; days: number }) => adminService.suspendUser(id, days),
    onSuccess: () => {
      toast.success('Utilisateur suspendu');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      refetch();
    },
    onError: () => toast.error('Erreur'),
  });

  const activateMutation = useMutation({
    mutationFn: (id: number) => adminService.activateUser(id),
    onSuccess: () => {
      toast.success('Utilisateur activé');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      refetch();
    },
    onError: () => toast.error('Erreur'),
  });

  if (isLoading) return <LoadingSkeleton isDark={isDark} />;
  
  const users = data?.data || data || [];
  
  const filteredUsers = users.filter((user: any) => {
    const matchesSearch = searchTerm === '' || 
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.user_type === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.is_active) ||
      (statusFilter === 'inactive' && !user.is_active);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const stats = {
    total: users.length,
    active: users.filter((u: any) => u.is_active).length,
    inactive: users.filter((u: any) => !u.is_active).length,
    hosts: users.filter((u: any) => u.user_type === 'hote').length,
    travelers: users.filter((u: any) => u.user_type === 'voyageur').length,
    admins: users.filter((u: any) => u.user_type === 'admin').length,
    newThisWeek: users.filter((u: any) => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(u.created_at) > weekAgo;
    }).length,
  };

  return (
    <div className={`p-3 sm:p-4 md:p-6 ${isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-gray-50 to-gray-100'} min-h-screen transition-colors duration-300`}>
      <div className="mb-6">
        <h1 className={`text-xl sm:text-2xl md:text-3xl font-bold ${isDark ? 'text-white' : 'bg-gradient-to-r from-[#0f2940] to-[#00c9a7] bg-clip-text text-transparent'}`}>
          Gestion des utilisateurs
        </h1>
        <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
          Gérez et modérez les utilisateurs de la plateforme
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 mb-6">
        <StatBadge label="Total" value={stats.total} color="gray" isDark={isDark} />
        <StatBadge label="Actifs" value={stats.active} color="green" isDark={isDark} />
        <StatBadge label="Inactifs" value={stats.inactive} color="red" isDark={isDark} />
        <StatBadge label="Hôtes" value={stats.hosts} color="blue" isDark={isDark} />
        <StatBadge label="Voyageurs" value={stats.travelers} color="purple" isDark={isDark} />
        <StatBadge label="Admins" value={stats.admins} color="orange" isDark={isDark} />
        <StatBadge label="Nouveaux" value={stats.newThisWeek} color="emerald" icon={<UserPlus className="w-3 h-3" />} isDark={isDark} />
      </div>

      <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'} rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border mb-6 transition-colors duration-300`}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Rechercher par nom, email ou téléphone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-9 pr-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00c9a7] transition-colors duration-300 ${
                isDark 
                  ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                  : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400'
              }`}
            />
          </div>
          <div className="flex gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className={`px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00c9a7] transition-colors duration-300 ${
                isDark 
                  ? 'bg-slate-700 border-slate-600 text-white' 
                  : 'bg-white border-gray-200 text-gray-800'
              }`}
            >
              <option value="all">Tous les rôles</option>
              <option value="voyageur">Voyageurs</option>
              <option value="hote">Hôtes</option>
              <option value="admin">Administrateurs</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00c9a7] transition-colors duration-300 ${
                isDark 
                  ? 'bg-slate-700 border-slate-600 text-white' 
                  : 'bg-white border-gray-200 text-gray-800'
              }`}
            >
              <option value="all">Tous statuts</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
            </select>
            <button
              onClick={() => refetch()}
              className={`px-3 py-2 ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'} rounded-xl transition`}
            >
              🔄
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {filteredUsers.length === 0 ? (
          <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'} rounded-xl p-8 text-center border transition-colors duration-300`}>
            <Users className={`w-12 h-12 ${isDark ? 'text-slate-600' : 'text-gray-300'} mx-auto mb-3`} />
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Aucun utilisateur trouvé</p>
          </div>
        ) : (
          filteredUsers.map((user: any) => (
            <UserCard
              key={user.id}
              user={user}
              isDark={isDark}
              onView={() => setSelectedUser(user)}
              onSuspend={() => {
                const days = parseInt(prompt("Durée de suspension (jours) :", "30") || "30");
                if (!isNaN(days) && days > 0) suspendMutation.mutate({ id: user.id, days });
              }}
              onActivate={() => activateMutation.mutate(user.id)}
            />
          ))
        )}
      </div>

      {selectedUser && (
        <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} isDark={isDark} />
      )}
    </div>
  );
}

// ============================================
// USER CARD - MODE SOMBRE
// ============================================
const UserCard = ({ user, isDark, onView, onSuspend, onActivate }: any) => {
  const getInitials = () => {
    return `${(user.first_name || '')?.charAt(0) || ''}${(user.last_name || '')?.charAt(0) || ''}`.toUpperCase() || '?';
  };

  return (
    <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'} rounded-xl sm:rounded-2xl p-4 shadow-sm hover:shadow-md transition-all border`}>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00c9a7] to-[#0f2940] flex items-center justify-center text-white font-bold text-lg shrink-0">
            {getInitials()}
          </div>
          <div className="sm:hidden">
            <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>{user.first_name} {user.last_name}</p>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{user.user_type}</p>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="hidden sm:block">
            <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>{user.first_name} {user.last_name}</p>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{user.user_type}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 text-sm">
            <div className={`flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
              <Mail className="w-3 h-3" />
              <span className="text-xs truncate">{user.email}</span>
            </div>
            <div className={`flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
              <Phone className="w-3 h-3" />
              <span className="text-xs">{user.phone || 'Non renseigné'}</span>
            </div>
            <div className={`flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
              <CalendarIcon className="w-3 h-3" />
              <span className="text-xs">Inscrit le {new Date(user.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'} hidden sm:inline`}>{user.is_active ? 'Actif' : 'Suspendu'}</span>
          </div>
          
          <button
            onClick={onView}
            className={`p-2 ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'} rounded-lg transition`}
          >
            <Eye className="w-4 h-4" />
          </button>
          
          {user.is_active ? (
            <button
              onClick={onSuspend}
              className="p-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition"
              title="Suspendre"
            >
              <Ban className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onActivate}
              className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition"
              title="Activer"
            >
              <UserCheck className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// STAT BADGE - MODE SOMBRE
// ============================================
const StatBadge = ({ label, value, color, icon, isDark }: any) => {
  const colorClasses: any = {
    gray: isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-700',
    green: isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700',
    yellow: isDark ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-700',
    blue: isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700',
    red: isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700',
    purple: isDark ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-700',
    orange: isDark ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-100 text-orange-700',
    emerald: isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-100 text-emerald-700',
  };

  return (
    <div className={`rounded-lg sm:rounded-xl p-2 sm:p-3 text-center ${colorClasses[color]}`}>
      {icon && <span className="mr-1">{icon}</span>}
      <p className="text-lg sm:text-2xl font-bold">{value}</p>
      <p className="text-xs hidden sm:block">{label}</p>
      <p className="text-[10px] sm:hidden">{label.slice(0, 3)}</p>
    </div>
  );
};

// ============================================
// USER DETAIL MODAL - MODE SOMBRE
// ============================================
const UserDetailModal = ({ user, onClose, isDark }: any) => {
  const getInitials = () => {
    return `${(user.first_name || '')?.charAt(0) || ''}${(user.last_name || '')?.charAt(0) || ''}`.toUpperCase() || '?';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-colors duration-300`} onClick={(e) => e.stopPropagation()}>
        <div className={`sticky top-0 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'} p-4 border-b flex justify-between items-center`}>
          <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-800'}`}>Détails de l'utilisateur</h3>
          <button onClick={onClose} className={`p-1 rounded-lg ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}>✕</button>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#00c9a7] to-[#0f2940] flex items-center justify-center text-white font-bold text-2xl">
              {getInitials()}
            </div>
            <div>
              <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{user.first_name} {user.last_name}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  user.user_type === 'hote' ? 'bg-green-100 text-green-700' :
                  user.user_type === 'voyageur' ? 'bg-blue-100 text-blue-700' :
                  'bg-purple-100 text-purple-700'
                }`}>
                  {user.user_type === 'hote' ? 'Hôte' : user.user_type === 'voyageur' ? 'Voyageur' : 'Admin'}
                </span>
                <div className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{user.is_active ? 'Actif' : 'Suspendu'}</span>
              </div>
            </div>
          </div>

          <div className={`${isDark ? 'bg-slate-700' : 'bg-gray-50'} rounded-xl p-4 transition-colors duration-300`}>
            <p className={`font-semibold text-sm mb-3 ${isDark ? 'text-white' : 'text-gray-800'}`}>👤 Informations personnelles</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className={`flex justify-between ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                <span>Nom complet</span>
                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{user.first_name} {user.last_name}</span>
              </div>
              <div className={`flex justify-between ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                <span>Email</span>
                <span className={`font-mono text-xs ${isDark ? 'text-white' : 'text-gray-800'}`}>{user.email}</span>
              </div>
              <div className={`flex justify-between ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                <span>Téléphone</span>
                <span className={isDark ? 'text-white' : 'text-gray-800'}>{user.phone || 'Non renseigné'}</span>
              </div>
              <div className={`flex justify-between ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                <span>Inscrit le</span>
                <span className={isDark ? 'text-white' : 'text-gray-800'}>{new Date(user.created_at).toLocaleDateString()}</span>
              </div>
              <div className={`flex justify-between ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                <span>Dernière connexion</span>
                <span className={isDark ? 'text-white' : 'text-gray-800'}>{user.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Jamais'}</span>
              </div>
              <div className={`flex justify-between ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                <span>Vérifié</span>
                <span className={isDark ? 'text-white' : 'text-gray-800'}>{user.verification_status === 'verified' ? '✅ Oui' : '❌ Non'}</span>
              </div>
            </div>
          </div>

          <div className={`${isDark ? 'bg-slate-700' : 'bg-gray-50'} rounded-xl p-4 transition-colors duration-300`}>
            <p className={`font-semibold text-sm mb-3 ${isDark ? 'text-white' : 'text-gray-800'}`}>📊 Statistiques</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-lg p-2`}>
                <p className="text-lg font-bold text-[#00c9a7]">{user.total_properties || 0}</p>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Propriétés</p>
              </div>
              <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-lg p-2`}>
                <p className="text-lg font-bold text-[#00c9a7]">{user.total_bookings || 0}</p>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Réservations</p>
              </div>
              <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-lg p-2`}>
                <p className="text-lg font-bold text-[#00c9a7]">{user.total_reviews || 0}</p>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Avis</p>
              </div>
              <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-lg p-2`}>
                <p className="text-lg font-bold text-[#00c9a7]">{user.average_rating || 0}★</p>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Note moyenne</p>
              </div>
            </div>
          </div>

          {user.suspended_until && (
            <div className={`${isDark ? 'bg-yellow-900/30 border-yellow-700' : 'bg-yellow-50 border-yellow-200'} rounded-xl p-4 border`}>
              <div className="flex items-center gap-2 text-yellow-700">
                <AlertCircle className="w-4 h-4" />
                <p className={`text-sm font-medium ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}>
                  Compte suspendu jusqu'au {new Date(user.suspended_until).toLocaleDateString()}
                </p>
              </div>
              {user.suspension_reason && (
                <p className={`text-xs mt-2 ${isDark ? 'text-yellow-400/70' : 'text-yellow-600'}`}>
                  Raison : {user.suspension_reason}
                </p>
              )}
            </div>
          )}
        </div>

        <div className={`sticky bottom-0 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'} p-4 border-t flex gap-3`}>
          {user.is_active ? (
            <button
              onClick={() => {
                const days = parseInt(prompt("Durée de suspension (jours) :", "30") || "30");
                if (!isNaN(days) && days > 0) {
                  window.location.reload();
                }
              }}
              className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition"
            >
              <Ban className="w-5 h-5 inline mr-2" />
              Suspendre
            </button>
          ) : (
            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-green-500 text-white py-3 rounded-xl font-semibold hover:bg-green-600 transition"
            >
              <UserCheck className="w-5 h-5 inline mr-2" />
              Activer
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// ADMIN BOOKINGS PAGE - MODE SOMBRE
// ============================================
export function AdminBookingsPage() {
  const { isDark } = useTheme();
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
    onError: () => toast.error('Erreur'),
  });

  if (isLoading) return <LoadingSkeleton isDark={isDark} />;
  
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
    <div className={`p-3 sm:p-4 md:p-6 ${isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-gray-50 to-gray-100'} min-h-screen transition-colors duration-300`}>
      <div className="mb-5">
        <h1 className={`text-xl sm:text-2xl md:text-3xl font-bold ${isDark ? 'text-white' : 'bg-gradient-to-r from-[#0f2940] to-[#00c9a7] bg-clip-text text-transparent'}`}>
          Réservations
        </h1>
        <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
          Gérez toutes les réservations de la plateforme
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3 mb-5">
        <StatBadge label="Total" value={stats.total} color="gray" isDark={isDark} />
        <StatBadge label="Confirmées" value={stats.confirmed} color="green" isDark={isDark} />
        <StatBadge label="En attente" value={stats.pending} color="yellow" isDark={isDark} />
        <StatBadge label="Terminées" value={stats.completed} color="blue" isDark={isDark} />
        <StatBadge label="Annulées" value={stats.cancelled} color="red" isDark={isDark} />
      </div>

      <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'} rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border mb-5 transition-colors duration-300`}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-9 pr-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00c9a7] transition-colors duration-300 ${
                isDark 
                  ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                  : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400'
              }`}
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00c9a7] transition-colors duration-300 ${
                isDark 
                  ? 'bg-slate-700 border-slate-600 text-white' 
                  : 'bg-white border-gray-200 text-gray-800'
              }`}
            >
              <option value="all">Tous</option>
              <option value="confirmed">Confirmées</option>
              <option value="pending">En attente</option>
              <option value="completed">Terminées</option>
              <option value="cancelled">Annulées</option>
            </select>
            <button
              onClick={() => refetch()}
              className={`px-3 py-2 ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'} rounded-xl transition`}
            >
              🔄
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {filteredBookings.length === 0 ? (
          <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'} rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center border transition-colors duration-300`}>
            <CalendarIcon className={`w-12 h-12 sm:w-16 sm:h-16 ${isDark ? 'text-slate-600' : 'text-gray-300'} mx-auto mb-3`} />
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Aucune réservation trouvée</p>
          </div>
        ) : (
          filteredBookings.map((booking: any) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              isDark={isDark}
              isExpanded={expandedId === booking.id}
              onToggle={() => toggleExpand(booking.id)}
              onCancel={() => {
                if (confirm("Annuler cette réservation ?")) cancelMutation.mutate(booking.id);
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ============================================
// BOOKING CARD - MODE SOMBRE
// ============================================
const BookingCard = ({ booking, isDark, isExpanded, onToggle, onCancel }: any) => {
  const statusConfig: any = {
    confirmed: { color: 'green', icon: CheckCircle, label: 'Confirmée' },
    pending: { color: 'yellow', icon: Clock, label: 'En attente' },
    completed: { color: 'blue', icon: CheckCircle, label: 'Terminée' },
    cancelled: { color: 'red', icon: XCircle, label: 'Annulée' },
  };
  
  const config = statusConfig[booking.booking_status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'} rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden border`}>
      <div 
        className={`p-3 sm:p-4 cursor-pointer ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-50'} transition`}
        onClick={onToggle}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-slate-700' : 'bg-gray-100'} flex items-center justify-center shrink-0`}>
              <StatusIcon className={`w-5 h-5 text-${config.color}-600`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`font-mono text-xs font-semibold ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-800'} px-2 py-0.5 rounded`}>
                  #{booking.booking_reference?.slice(-8)}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full bg-${config.color}-100 text-${config.color}-700`}>
                  {config.label}
                </span>
              </div>
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'} text-sm mt-1 truncate`}>{booking.property?.title}</p>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{booking.property?.district}</p>
            </div>
          </div>
          <div className="flex items-center justify-between w-full sm:w-auto gap-3">
            <div className="text-left sm:text-right">
              <p className="text-base sm:text-lg font-bold text-[#00c9a7]">{booking.total_amount?.toLocaleString()} FCFA</p>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>{booking.check_in} → {booking.check_out}</p>
            </div>
            <ChevronRight className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-gray-400'} transition-transform shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className={`border-t ${isDark ? 'border-slate-700' : 'border-gray-100'} p-3 sm:p-4 ${isDark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-xl p-3 shadow-sm`}>
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-[#00c9a7]" />
                <h4 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>Voyageur</h4>
              </div>
              <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>{booking.user?.full_name}</p>
              <div className={`flex items-center gap-2 mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                <Mail className="w-3 h-3" />
                <span className="truncate">{booking.user?.email}</span>
              </div>
              <div className={`flex items-center gap-2 mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                <Phone className="w-3 h-3" />
                <span>{booking.user?.phone || 'Non renseigné'}</span>
              </div>
            </div>

            <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-xl p-3 shadow-sm`}>
              <div className="flex items-center gap-2 mb-2">
                <CalendarIcon className="w-4 h-4 text-[#00c9a7]" />
                <h4 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>Séjour</h4>
              </div>
              <div className="space-y-1 text-xs">
                <div className={`flex justify-between ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                  <span>Arrivée</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{booking.check_in}</span>
                </div>
                <div className={`flex justify-between ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                  <span>Départ</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{booking.check_out}</span>
                </div>
                <div className={`flex justify-between ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                  <span>Nuits</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{booking.nights_count || 0}</span>
                </div>
                <div className={`flex justify-between ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                  <span>Voyageurs</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{booking.guests_count || 1}</span>
                </div>
              </div>
            </div>

            <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-xl p-3 shadow-sm`}>
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-4 h-4 text-[#00c9a7]" />
                <h4 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>Paiement</h4>
              </div>
              <div className="space-y-1 text-xs">
                <div className={`flex justify-between ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                  <span>Méthode</span>
                  <span className={`font-medium capitalize ${isDark ? 'text-white' : 'text-gray-800'}`}>{booking.payment_method || '-'}</span>
                </div>
                <div className={`flex justify-between ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                  <span>Statut</span>
                  <span className={`font-medium ${booking.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                    {booking.payment_status === 'paid' ? 'Payé' : 'En attente'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {booking.booking_status !== 'cancelled' && booking.booking_status !== 'completed' && (
            <div className="mt-3 flex justify-end">
              <button
                onClick={onCancel}
                className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs hover:bg-red-600 transition"
              >
                Annuler
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================
// ADMIN PAYMENTS PAGE - MODE SOMBRE
// ============================================
export function AdminPaymentsPage() {
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: () => adminService.getPayments(),
    refetchInterval: 30000,
  });

  if (isLoading) return <LoadingSkeleton isDark={isDark} />;
  
  const allPayments = data?.data?.data || [];
  
  const filteredPayments = allPayments.filter((payment: any) => {
    const matchesSearch = searchTerm === '' || 
      payment.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.booking?.booking_reference?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: allPayments.length,
    totalAmount: allPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0),
    success: allPayments.filter((p: any) => p.status === 'success').length,
    pending: allPayments.filter((p: any) => p.status === 'pending').length,
    failed: allPayments.filter((p: any) => p.status === 'failed').length,
    today: allPayments.filter((p: any) => {
      const today = new Date().toDateString();
      return new Date(p.created_at).toDateString() === today;
    }).reduce((sum: number, p: any) => sum + (p.amount || 0), 0),
  };

  const successRate = stats.total > 0 ? ((stats.success / stats.total) * 100).toFixed(1) : 0;

  return (
    <div className={`p-3 sm:p-4 md:p-6 ${isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-gray-50 to-gray-100'} min-h-screen transition-colors duration-300`}>
      <div className="mb-6">
        <h1 className={`text-xl sm:text-2xl md:text-3xl font-bold ${isDark ? 'text-white' : 'bg-gradient-to-r from-[#0f2940] to-[#00c9a7] bg-clip-text text-transparent'}`}>
          Suivi des paiements
        </h1>
        <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
          Analysez et gérez toutes les transactions financières
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
        <StatCard icon={CreditCard} label="Transactions" value={stats.total} color="blue" isDark={isDark} />
        <StatCard icon={Wallet} label="Volume total" value={`${(stats.totalAmount / 1000000).toFixed(1)}M`} color="purple" subValue="FCFA" isDark={isDark} />
        <StatCard icon={CheckCircle} label="Succès" value={stats.success} color="green" isDark={isDark} />
        <StatCard icon={Clock} label="En attente" value={stats.pending} color="yellow" isDark={isDark} />
        <StatCard icon={XCircle} label="Échouées" value={stats.failed} color="red" isDark={isDark} />
        <StatCard icon={TrendingUp} label="Taux succès" value={`${successRate}%`} color="emerald" isDark={isDark} />
      </div>

      <div className={`bg-gradient-to-r from-[#00c9a7] to-[#0f2940] rounded-xl sm:rounded-2xl p-4 mb-6 text-white`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <p className="text-white/80 text-sm">Transactions aujourd'hui</p>
            <p className="text-2xl font-bold">{stats.today.toLocaleString()} FCFA</p>
          </div>
          <div className="flex gap-4">
            <div>
              <p className="text-white/80 text-xs">Moyenne par jour</p>
              <p className="text-lg font-semibold">{((stats.totalAmount / 30) || 0).toLocaleString()} FCFA</p>
            </div>
            <div>
              <p className="text-white/80 text-xs">Meilleur jour</p>
              <p className="text-lg font-semibold">{Math.max(...allPayments.map((p: any) => p.amount || 0)).toLocaleString()} FCFA</p>
            </div>
          </div>
        </div>
      </div>

      <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'} rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border mb-6 transition-colors duration-300`}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Rechercher par transaction ID ou réservation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-9 pr-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00c9a7] transition-colors duration-300 ${
                isDark 
                  ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                  : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400'
              }`}
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00c9a7] transition-colors duration-300 ${
                isDark 
                  ? 'bg-slate-700 border-slate-600 text-white' 
                  : 'bg-white border-gray-200 text-gray-800'
              }`}
            >
              <option value="all">Tous statuts</option>
              <option value="success">Succès</option>
              <option value="pending">En attente</option>
              <option value="failed">Échoué</option>
            </select>
            <button
              onClick={() => refetch()}
              className={`px-3 py-2 ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'} rounded-xl transition`}
            >
              🔄
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {filteredPayments.length === 0 ? (
          <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'} rounded-xl p-8 text-center border transition-colors duration-300`}>
            <CreditCard className={`w-12 h-12 ${isDark ? 'text-slate-600' : 'text-gray-300'} mx-auto mb-3`} />
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Aucune transaction trouvée</p>
          </div>
        ) : (
          filteredPayments.map((payment: any) => (
            <PaymentCardComponent
              key={payment.id}
              payment={payment}
              isDark={isDark}
              onView={() => setSelectedPayment(payment)}
            />
          ))
        )}
      </div>

      {selectedPayment && (
        <PaymentDetailModalComponent payment={selectedPayment} onClose={() => setSelectedPayment(null)} isDark={isDark} />
      )}
    </div>
  );
}

// ============================================
// PAYMENT CARD - MODE SOMBRE
// ============================================
const PaymentCardComponent = ({ payment, isDark, onView }: any) => {
  const statusConfig: any = {
    success: { color: 'green', icon: CheckCircle, label: 'Succès' },
    pending: { color: 'yellow', icon: Clock, label: 'En attente' },
    failed: { color: 'red', icon: XCircle, label: 'Échoué' },
  };
  
  const config = statusConfig[payment.status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'} rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-all border`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-slate-700' : 'bg-gray-100'} flex items-center justify-center shrink-0`}>
            <StatusIcon className={`w-5 h-5 text-${config.color}-600`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`font-mono text-xs font-semibold ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-800'} px-2 py-0.5 rounded`}>
                {payment.transaction_id?.slice(-12)}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full bg-${config.color}-100 text-${config.color}-700`}>
                {config.label}
              </span>
            </div>
            <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-800'} mt-1`}>
              {payment.booking?.property?.title || 'Réservation'}
            </p>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Réf: {payment.booking?.booking_reference || '-'}</p>
          </div>
        </div>
        <div className="flex items-center justify-between w-full sm:w-auto gap-3">
          <div className="text-left sm:text-right">
            <p className="text-base sm:text-lg font-bold text-[#00c9a7]">{payment.amount?.toLocaleString()} FCFA</p>
            <div className="flex items-center gap-1 mt-1">
              <Smartphone className={`w-3 h-3 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>{payment.payment_method || 'Mobile Money'}</p>
            </div>
          </div>
          <button
            onClick={onView}
            className={`p-2 ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'} rounded-lg transition`}
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// PAYMENT DETAIL MODAL - MODE SOMBRE
// ============================================
const PaymentDetailModalComponent = ({ payment, onClose, isDark }: any) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto transition-colors duration-300`} onClick={(e) => e.stopPropagation()}>
        <div className={`sticky top-0 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'} p-5 border-b`}>
          <div className="flex justify-between items-center">
            <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-800'}`}>Détails du paiement</h3>
            <button onClick={onClose} className={`p-1 rounded-lg ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}>✕</button>
          </div>
        </div>
        
        <div className="p-5 space-y-4">
          <div className="text-center">
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Montant total</p>
            <p className="text-3xl font-bold text-[#00c9a7]">{payment.amount?.toLocaleString()} FCFA</p>
          </div>

          <div className="space-y-3">
            <DetailRow label="Transaction ID" value={payment.transaction_id} isDark={isDark} />
            <DetailRow label="Réservation" value={payment.booking?.booking_reference} isDark={isDark} />
            <DetailRow label="Propriété" value={payment.booking?.property?.title} isDark={isDark} />
            <DetailRow label="Voyageur" value={payment.booking?.user?.full_name} isDark={isDark} />
            <DetailRow label="Méthode" value={payment.payment_method || 'Mobile Money'} isDark={isDark} />
            <DetailRow label="Statut" value={payment.status} status isDark={isDark} />
            <DetailRow label="Date" value={new Date(payment.created_at).toLocaleString()} isDark={isDark} />
            {payment.paid_at && <DetailRow label="Payé le" value={new Date(payment.paid_at).toLocaleString()} isDark={isDark} />}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// DETAIL ROW - MODE SOMBRE
// ============================================
const DetailRow = ({ label, value, status, isDark }: any) => (
  <div className={`flex justify-between items-center py-2 border-b ${isDark ? 'border-slate-700' : 'border-gray-100'}`}>
    <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{label}</span>
    {status ? (
      <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${
        value === 'success' ? 'bg-green-100 text-green-700' :
        value === 'pending' ? 'bg-yellow-100 text-yellow-700' :
        'bg-red-100 text-red-700'
      }`}>
        {value === 'success' ? 'Succès' : value === 'pending' ? 'En attente' : 'Échoué'}
      </span>
    ) : (
      <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{value || '-'}</span>
    )}
  </div>
);

// ============================================
// ADMIN MESSAGES PAGE - MODE SOMBRE
// ============================================
export function AdminMessagesPage() {
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [filterType, setFilterType] = useState<'all' | 'flagged' | 'unread'>('all');
  
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-messages'],
    queryFn: () => adminService.getMessages(),
    refetchInterval: 15000,
  });

  if (isLoading) return <LoadingSkeleton isDark={isDark} />;
  
  const allMessages = data?.data?.data || [];
  
  const filteredMessages = allMessages.filter((msg: any) => {
    const matchesSearch = searchTerm === '' || 
      msg.sender?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.receiver?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.message?.toLowerCase().includes(searchTerm.toLowerCase());
    
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
    <div className={`p-3 sm:p-4 md:p-6 ${isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-gray-50 to-gray-100'} min-h-screen transition-colors duration-300`}>
      <div className="mb-6">
        <h1 className={`text-xl sm:text-2xl md:text-3xl font-bold ${isDark ? 'text-white' : 'bg-gradient-to-r from-[#0f2940] to-[#00c9a7] bg-clip-text text-transparent'}`}>
          Surveillance des messages
        </h1>
        <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
          Analysez et modérez les conversations entre utilisateurs
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard icon={MessageCircle} label="Total messages" value={stats.total} color="blue" isDark={isDark} />
        <StatCard icon={Mail} label="Non lus" value={stats.unread} color="yellow" isDark={isDark} />
        <StatCard icon={Flag} label="Signalés" value={stats.flagged} color="red" isDark={isDark} />
        <StatCard icon={CalendarIcon} label="Aujourd'hui" value={stats.today} color="green" isDark={isDark} />
      </div>

      <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'} rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border mb-6 transition-colors duration-300`}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Rechercher par expéditeur, destinataire ou contenu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-9 pr-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00c9a7] transition-colors duration-300 ${
                isDark 
                  ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                  : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400'
              }`}
            />
          </div>
          <div className="flex gap-2">
            <FilterButton active={filterType === 'all'} onClick={() => setFilterType('all')} label="Tous" isDark={isDark} />
            <FilterButton active={filterType === 'unread'} onClick={() => setFilterType('unread')} label="Non lus" isDark={isDark} />
            <FilterButton active={filterType === 'flagged'} onClick={() => setFilterType('flagged')} label="Signalés" isDark={isDark} />
            <button
              onClick={() => refetch()}
              className={`px-3 py-2 ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'} rounded-xl transition`}
            >
              🔄
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
          {filteredMessages.length === 0 ? (
            <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'} rounded-xl p-8 text-center border transition-colors duration-300`}>
              <MessageCircle className={`w-12 h-12 ${isDark ? 'text-slate-600' : 'text-gray-300'} mx-auto mb-3`} />
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Aucun message trouvé</p>
            </div>
          ) : (
            filteredMessages.map((msg: any) => (
              <MessageCardComponent
                key={msg.id}
                message={msg}
                isDark={isDark}
                isSelected={selectedMessage?.id === msg.id}
                onClick={() => setSelectedMessage(msg)}
              />
            ))
          )}
        </div>

        <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'} rounded-xl sm:rounded-2xl shadow-lg overflow-hidden sticky top-4 h-[600px] flex flex-col border transition-colors duration-300`}>
          {selectedMessage ? (
            <MessageDetailComponent message={selectedMessage} onClose={() => setSelectedMessage(null)} isDark={isDark} />
          ) : (
            <div className={`flex-1 flex flex-col items-center justify-center ${isDark ? 'text-slate-500' : 'text-gray-400'} p-6`}>
              <MessageCircle className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-center">Sélectionnez un message<br />pour voir les détails</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// FILTER BUTTON - MODE SOMBRE
// ============================================
const FilterButton = ({ active, onClick, label, isDark }: any) => (
  <button
    onClick={onClick}
    className={`px-3 py-2 rounded-xl text-sm transition ${
      active 
        ? 'bg-[#00c9a7] text-white shadow-md' 
        : isDark 
          ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }`}
  >
    {label}
  </button>
);

// ============================================
// MESSAGE CARD - MODE SOMBRE
// ============================================
const MessageCardComponent = ({ message, isDark, isSelected, onClick }: any) => {
  const isUnread = !message.is_read;
  const isFlagged = message.is_flagged;

  return (
    <div
      onClick={onClick}
      className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'} rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-all cursor-pointer border-2 ${
        isSelected ? 'border-[#00c9a7]' : 'border-transparent'
      } ${isUnread ? `${isDark ? 'border-l-4 border-l-yellow-500' : 'border-l-4 border-l-yellow-400'}` : ''}`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-full ${isDark ? 'bg-slate-700' : 'bg-gray-100'} flex items-center justify-center flex-shrink-0`}>
          <User className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {message.sender?.full_name || 'Utilisateur'}
            </span>
            {isUnread && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                Non lu
              </span>
            )}
            {isFlagged && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                ⚠️ Signalé
              </span>
            )}
          </div>
          <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'} truncate`}>{message.message || 'Message'}</p>
          <div className={`flex items-center gap-3 mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>
            <span>{new Date(message.created_at).toLocaleDateString()}</span>
            <span>•</span>
            <span>{message.receiver?.full_name || 'Destinataire'}</span>
          </div>
        </div>
        <ChevronRight className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-gray-400'} flex-shrink-0`} />
      </div>
    </div>
  );
};

// ============================================
// MESSAGE DETAIL - MODE SOMBRE
// ============================================
const MessageDetailComponent = ({ message, onClose, isDark }: any) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className={`p-4 border-b ${isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-100 bg-gray-50'} flex justify-between items-start`}>
        <div className="flex items-center gap-3">
          <button onClick={onClose} className={`p-1 rounded-lg ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'} lg:hidden`}>
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h3 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {message.sender?.full_name || 'Utilisateur'}
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              À {message.receiver?.full_name || 'Destinataire'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowActions(!showActions)}
            className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'} transition`}
          >
            <MoreVertical className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`} />
          </button>
        </div>
      </div>

      {showActions && (
        <div className={`p-3 ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-100'} border-b flex flex-wrap gap-2`}>
          <button className={`px-3 py-1.5 ${isDark ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-800/40' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'} rounded-lg text-xs transition`}>
            <Check className="w-3 h-3 inline mr-1" />
            Marquer comme lu
          </button>
          <button className={`px-3 py-1.5 ${isDark ? 'bg-red-900/30 text-red-400 hover:bg-red-800/40' : 'bg-red-100 text-red-700 hover:bg-red-200'} rounded-lg text-xs transition`}>
            <Flag className="w-3 h-3 inline mr-1" />
            Signaler
          </button>
          <button className={`px-3 py-1.5 ${isDark ? 'bg-slate-700 text-slate-400 hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} rounded-lg text-xs transition`}>
            <Trash2 className="w-3 h-3 inline mr-1" />
            Supprimer
          </button>
        </div>
      )}

      <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
        <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-xl p-4 border ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
          <p className={`text-sm ${isDark ? 'text-slate-200' : 'text-gray-700'} whitespace-pre-wrap`}>
            {message.message || 'Contenu du message'}
          </p>
        </div>

        <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-xl p-4 border ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
          <div className="space-y-2 text-sm">
            <div className={`flex justify-between py-1 border-b ${isDark ? 'border-slate-700' : 'border-gray-100'}`}>
              <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>Date d'envoi</span>
              <span className={isDark ? 'text-slate-200' : 'text-gray-700'}>{new Date(message.created_at).toLocaleString()}</span>
            </div>
            {message.read_at && (
              <div className={`flex justify-between py-1 border-b ${isDark ? 'border-slate-700' : 'border-gray-100'}`}>
                <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>Date de lecture</span>
                <span className={isDark ? 'text-slate-200' : 'text-gray-700'}>{new Date(message.read_at).toLocaleString()}</span>
              </div>
            )}
            <div className={`flex justify-between py-1 border-b ${isDark ? 'border-slate-700' : 'border-gray-100'}`}>
              <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>Statut</span>
              <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                message.is_read ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {message.is_read ? 'Lu' : 'Non lu'}
              </span>
            </div>
            {message.is_flagged && (
              <div className={`flex justify-between py-1 border-b ${isDark ? 'border-slate-700' : 'border-gray-100'}`}>
                <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>Signalement</span>
                <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                  ⚠️ Signalé
                </span>
              </div>
            )}
          </div>
        </div>

        <div className={`flex gap-3 pt-4 border-t ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
          <button className={`flex-1 py-2 ${isDark ? 'bg-[#00c9a7] hover:bg-[#00b892]' : 'bg-[#00c9a7] hover:bg-[#00b892]'} text-white rounded-xl transition text-sm flex items-center justify-center gap-2`}>
            <Reply className="w-4 h-4" />
            Répondre
          </button>
          <button className={`flex-1 py-2 ${isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} rounded-xl transition text-sm flex items-center justify-center gap-2`}>
            <User className="w-4 h-4" />
            Voir profil
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// ADMIN REPORTS PAGE - MODE SOMBRE
// ============================================
export function AdminReportsPage() {
  const { isDark } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'annual' | 'custom'>('monthly');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'financial' | 'users' | 'properties'>('overview');
  const [showPropertiesModal, setShowPropertiesModal] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showBookingsModal, setShowBookingsModal] = useState(false);
  const [modalData, setModalData] = useState<any[]>([]);
  const [modalTitle, setModalTitle] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-reports-summary', selectedPeriod, customStartDate, customEndDate],
    queryFn: () => adminService.getSummaryReport({
      period: selectedPeriod,
      start_date: customStartDate,
      end_date: customEndDate,
    }),
  });
  
  if (isLoading) return <LoadingSkeleton isDark={isDark} />;

  const report = data?.data || {};

  const chartData = report.chart_data?.labels?.map((label: string, idx: number) => ({
    name: label,
    revenue: report.chart_data?.revenue?.[idx] || 0,
    users: report.chart_data?.users?.[idx] || 0,
    bookings: report.chart_data?.bookings?.[idx] || 0,
  })) || [
    { name: 'Lun', revenue: 0, users: 0, bookings: 0 },
    { name: 'Mar', revenue: 0, users: 0, bookings: 0 },
    { name: 'Mer', revenue: 0, users: 0, bookings: 0 },
    { name: 'Jeu', revenue: 0, users: 0, bookings: 0 },
    { name: 'Ven', revenue: 0, users: 0, bookings: 0 },
    { name: 'Sam', revenue: 0, users: 0, bookings: 0 },
    { name: 'Dim', revenue: 0, users: 0, bookings: 0 },
  ];

  return (
    <div className={`p-3 sm:p-4 md:p-6 ${isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-gray-50 to-gray-100'} min-h-screen transition-colors duration-300`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className={`text-xl sm:text-2xl md:text-3xl font-bold ${isDark ? 'text-white' : 'bg-gradient-to-r from-[#0f2940] to-[#00c9a7] bg-clip-text text-transparent'}`}>
            Rapports & analyses
          </h1>
          <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            Analysez la performance de votre plateforme
          </p>
        </div>
        
        <div className="flex gap-2">
          <button className={`p-2 ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700' : 'bg-white border-gray-200 hover:bg-gray-50'} rounded-xl transition`} title="Imprimer">
            <Printer className="w-4 h-4" />
          </button>
          <button className={`p-2 ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700' : 'bg-white border-gray-200 hover:bg-gray-50'} rounded-xl transition`} title="Partager">
            <Share2 className="w-4 h-4" />
          </button>
          <button onClick={() => refetch()} className={`p-2 ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700' : 'bg-white border-gray-200 hover:bg-gray-50'} rounded-xl transition`} title="Rafraîchir">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'} rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border mb-6 transition-colors duration-300`}>
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <PeriodButton active={selectedPeriod === 'monthly'} onClick={() => setSelectedPeriod('monthly')} label="Mensuel" isDark={isDark} />
            <PeriodButton active={selectedPeriod === 'annual'} onClick={() => setSelectedPeriod('annual')} label="Annuel" isDark={isDark} />
            <PeriodButton active={selectedPeriod === 'custom'} onClick={() => setSelectedPeriod('custom')} label="Personnalisé" isDark={isDark} />
          </div>
          {selectedPeriod === 'custom' && (
            <div className="flex flex-col sm:flex-row gap-2">
              <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className={`px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00c9a7] transition-colors duration-300 ${
                isDark 
                  ? 'bg-slate-700 border-slate-600 text-white' 
                  : 'bg-white border-gray-200 text-gray-800'
              }`} />
              <span className={`${isDark ? 'text-slate-500' : 'text-gray-400'} self-center hidden sm:inline`}>→</span>
              <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className={`px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00c9a7] transition-colors duration-300 ${
                isDark 
                  ? 'bg-slate-700 border-slate-600 text-white' 
                  : 'bg-white border-gray-200 text-gray-800'
              }`} />
            </div>
          )}
        </div>
      </div>

      <div className={`flex flex-wrap gap-2 mb-6 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'} pb-3`}>
        <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} label=" Vue d'ensemble" isDark={isDark} />
        <TabButton active={activeTab === 'financial'} onClick={() => setActiveTab('financial')} label=" Financier" isDark={isDark} />
        <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} label="👥 Utilisateurs" isDark={isDark} />
        <TabButton active={activeTab === 'properties'} onClick={() => setActiveTab('properties')} label=" Propriétés" isDark={isDark} />
      </div>

      {activeTab === 'overview' && <OverviewTabComponent report={report} chartData={chartData} isDark={isDark} />}
      {activeTab === 'financial' && <FinancialTabComponent report={report} chartData={chartData} isDark={isDark} />}
      {activeTab === 'users' && <UsersTabComponent report={report} isDark={isDark} />}
      {activeTab === 'properties' && <PropertiesTabComponent report={report} isDark={isDark} />}

      <div className={`mt-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'} rounded-xl sm:rounded-2xl p-5 shadow-sm border transition-colors duration-300`}>
        <h3 className={`font-semibold text-base mb-3 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          <Download className="w-5 h-5 text-[#00c9a7]" />
          Exporter le rapport
        </h3>
        <div className="flex flex-wrap gap-3">
          <ExportButton onClick={() => {}} icon={<FileText className="w-4 h-4" />} label="CSV" color="green" isDark={isDark} />
          <ExportButton onClick={() => {}} icon={<FileText className="w-4 h-4" />} label="Excel" color="blue" isDark={isDark} />
          <ExportButton onClick={() => {}} icon={<FileText className="w-4 h-4" />} label="PDF" color="red" isDark={isDark} />
        </div>
      </div>
    </div>
  );
}

// ============================================
// PERIOD BUTTON - MODE SOMBRE
// ============================================
const PeriodButton = ({ active, onClick, label, isDark }: any) => (
  <button 
    onClick={onClick} 
    className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
      active 
        ? 'bg-[#00c9a7] text-white shadow-md' 
        : isDark 
          ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }`}
  >
    {label}
  </button>
);

// ============================================
// TAB BUTTON - MODE SOMBRE
// ============================================
const TabButton = ({ active, onClick, label, isDark }: any) => (
  <button 
    onClick={onClick} 
    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
      active 
        ? 'bg-[#00c9a7] text-white' 
        : isDark 
          ? 'text-slate-400 hover:bg-slate-800' 
          : 'text-gray-600 hover:bg-gray-100'
    }`}
  >
    {label}
  </button>
);

// ============================================
// EXPORT BUTTON - MODE SOMBRE
// ============================================
const ExportButton = ({ onClick, icon, label, color, isDark }: any) => {
  const colors: any = {
    green: isDark ? 'bg-green-900/30 text-green-400 hover:bg-green-800/40' : 'bg-green-50 text-green-600 hover:bg-green-100',
    blue: isDark ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-800/40' : 'bg-blue-50 text-blue-600 hover:bg-blue-100',
    red: isDark ? 'bg-red-900/30 text-red-400 hover:bg-red-800/40' : 'bg-red-50 text-red-600 hover:bg-red-100',
  };

  return (
    <button 
      onClick={onClick} 
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${colors[color]}`}
    >
      {icon}{label}
    </button>
  );
};

// ============================================
// OVERVIEW TAB - MODE SOMBRE
// ============================================
const OverviewTabComponent = ({ report, chartData, isDark }: any) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard title="Chiffre d'affaires" value={`${(report.total_revenue || 0).toLocaleString()} FCFA`} icon={<DollarSign className="w-5 h-5" />} color="green" isDark={isDark} />
      <KPICard title="Utilisateurs" value={(report.total_users || 0).toLocaleString()} icon={<Users className="w-5 h-5" />} color="blue" isDark={isDark} />
      <KPICard title="Réservations" value={(report.total_bookings || 0).toLocaleString()} icon={<CalendarIcon className="w-5 h-5" />} color="purple" isDark={isDark} />
      <KPICard title="Propriétés" value={(report.total_properties || 0).toLocaleString()} icon={<Home className="w-5 h-5" />} color="orange" isDark={isDark} />
    </div>

    <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'} rounded-xl p-5 shadow-sm border transition-colors duration-300`}>
      <h3 className={`font-semibold text-base mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
        <TrendingUp className="w-5 h-5 text-[#00c9a7]" />
        Évolution des revenus
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00c9a7" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#00c9a7" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#f0f0f0'} />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: isDark ? '#94a3b8' : '#666' }} />
          <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} tick={{ fill: isDark ? '#94a3b8' : '#666' }} />
          <Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', color: isDark ? '#fff' : '#000', borderRadius: 12, border: 'none' }} />
          <Area type="monotone" dataKey="revenue" stroke="#00c9a7" fill="url(#revenueGradient)" name="CA (FCFA)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

// ============================================
// FINANCIAL TAB - MODE SOMBRE
// ============================================
const FinancialTabComponent = ({ report, chartData, isDark }: any) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
        <p className="text-white/80 text-sm">Revenus totaux</p>
        <p className="text-2xl font-bold mt-1">{report.total_revenue?.toLocaleString() || 0} FCFA</p>
        <p className="text-white/60 text-xs mt-2">Depuis la création</p>
      </div>
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
        <p className="text-white/80 text-sm">Réservations</p>
        <p className="text-2xl font-bold mt-1">{report.total_bookings || 0}</p>
      </div>
      <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
        <p className="text-white/80 text-sm">CA aujourd'hui</p>
        <p className="text-2xl font-bold mt-1">{(report.revenue || 0).toLocaleString()} FCFA</p>
      </div>
    </div>
    <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'} rounded-xl p-5 shadow-sm border transition-colors duration-300`}>
      <h3 className={`font-semibold text-base mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>Évolution quotidienne</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#f0f0f0'} />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: isDark ? '#94a3b8' : '#666' }} />
          <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} tick={{ fill: isDark ? '#94a3b8' : '#666' }} />
          <Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', color: isDark ? '#fff' : '#000', borderRadius: 12, border: 'none' }} />
          <Bar dataKey="revenue" fill="#00c9a7" name="CA" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

// ============================================
// USERS TAB - MODE SOMBRE
// ============================================
const UsersTabComponent = ({ report, isDark }: any) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <UserStatCard title="Total utilisateurs" value={report.total_users || 0} icon={<Users className="w-5 h-5" />} color="blue" isDark={isDark} />
      <UserStatCard title="Hôtes" value={report.total_hosts || 0} icon={<Home className="w-5 h-5" />} color="green" isDark={isDark} />
      <UserStatCard title="Voyageurs" value={report.total_travelers || 0} icon={<Users className="w-5 h-5" />} color="purple" isDark={isDark} />
      <UserStatCard title="Nouveaux aujourd'hui" value={report.new_users || 0} icon={<Users className="w-5 h-5" />} color="orange" isDark={isDark} />
    </div>
  </div>
);

// ============================================
// PROPERTIES TAB - MODE SOMBRE
// ============================================
const PropertiesTabComponent = ({ report, isDark }: any) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <PropertyStatCard title="Total propriétés" value={report.total_properties || 0} icon={<Home className="w-5 h-5" />} color="green" isDark={isDark} />
      <PropertyStatCard title="Actives" value={report.active_properties || 0} icon={<CheckCircle className="w-5 h-5" />} color="blue" isDark={isDark} />
      <PropertyStatCard title="En attente" value={report.pending_properties || 0} icon={<Clock className="w-5 h-5" />} color="yellow" isDark={isDark} />
      <PropertyStatCard title="Publiées" value={report.published_properties || 0} icon={<Zap className="w-5 h-5" />} color="purple" isDark={isDark} />
    </div>
  </div>
);

// ============================================
// KPI CARD - MODE SOMBRE
// ============================================
const KPICard = ({ title, value, icon, color, isDark }: any) => {
  const colors: any = {
    green: 'from-green-500 to-green-600',
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-xl p-4 text-white transform hover:scale-105 transition-all duration-300`}>
      <div className="flex justify-between items-start">
        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">{icon}</div>
      </div>
      <p className="text-white/80 text-xs mt-3">{title}</p>
      <p className="text-xl font-bold mt-0.5">{value}</p>
    </div>
  );
};

// ============================================
// USER STAT CARD - MODE SOMBRE
// ============================================
const UserStatCard = ({ title, value, icon, color, isDark }: any) => {
  const colors: any = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-xl p-4 text-white`}>
      <div className="flex justify-between items-center">
        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">{icon}</div>
      </div>
      <p className="text-white/80 text-xs mt-2">{title}</p>
      <p className="text-2xl font-bold mt-0.5">{value.toLocaleString()}</p>
    </div>
  );
};

// ============================================
// PROPERTY STAT CARD - MODE SOMBRE
// ============================================
const PropertyStatCard = ({ title, value, icon, color, isDark }: any) => {
  const colors: any = {
    green: 'from-green-500 to-green-600',
    blue: 'from-blue-500 to-blue-600',
    yellow: 'from-yellow-500 to-yellow-600',
    purple: 'from-purple-500 to-purple-600',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-xl p-4 text-white`}>
      <div className="flex justify-between items-center">
        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">{icon}</div>
      </div>
      <p className="text-white/80 text-xs mt-2">{title}</p>
      <p className="text-2xl font-bold mt-0.5">{value.toLocaleString()}</p>
    </div>
  );
};
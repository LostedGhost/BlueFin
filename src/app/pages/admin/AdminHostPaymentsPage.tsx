// src/app/pages/admin/AdminHostPaymentsPage.tsx - Version complète avec mode sombre
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../../contexts/ThemeContext';
import {
  Wallet,
  Search,
  Eye,
  CheckCircle,
  Clock,
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertCircle,
  User,
  Loader2,
  X,
  Phone,
  Mail,
  Building2,
} from 'lucide-react';
import adminService from '../../../services/admin.service';
import toast from 'react-hot-toast';

// ============================================
// STAT CARD - AVEC MODE SOMBRE
// ============================================
const StatCard = ({ icon: Icon, label, value, subValue, color, isDark }: any) => {
  const colors = {
    red: 'from-red-500 to-red-600',
    green: 'from-emerald-500 to-emerald-600',
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5`}>
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-white/80 text-xs mt-3">{label}</p>
      <p className="text-xl font-bold mt-0.5">{value}</p>
      <p className="text-white/60 text-xs mt-1">{subValue}</p>
    </div>
  );
};

// ============================================
// LOADING SKELETON - AVEC MODE SOMBRE
// ============================================
const LoadingSkeleton = ({ isDark }: { isDark: boolean }) => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isDark ? 'border-emerald-400' : 'border-[#00c9a7]'}`}></div>
  </div>
);

// ============================================
// ADMIN HOST PAYMENTS PAGE - AVEC MODE SOMBRE
// ============================================
export function AdminHostPaymentsPage() {
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [sortField, setSortField] = useState<'host_name' | 'amount' | 'week' | 'status'>('host_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAllHostsModal, setShowAllHostsModal] = useState(false);
  const [allHostsData, setAllHostsData] = useState<any[]>([]);
  const [loadingHosts, setLoadingHosts] = useState(false);
  const [loadingMarkPaid, setLoadingMarkPaid] = useState(false);

  const queryClient = useQueryClient();

  // Récupérer les statistiques des paiements hôtes
  const { data: statsData, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-host-payments-stats'],
    queryFn: () => adminService.getHostPaymentStats(),
    refetchInterval: 60000,
  });

  // Récupérer tous les hôtes avec leurs infos de paiement
  const fetchAllHosts = async () => {
    setLoadingHosts(true);
    try {
      const response = await adminService.getAllHostPayments({ 
        status: 'all',
        per_page: 100 
      });
      
      if (response?.success) {
        const hosts = response.data?.data || [];
        setAllHostsData(hosts);
        setShowAllHostsModal(true);
      } else {
        toast.error('❌ Impossible de récupérer la liste des hôtes');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('❌ Erreur lors de la récupération des hôtes');
    } finally {
      setLoadingHosts(false);
    }
  };

  // Mutation pour marquer comme payé
  const markPaidMutation = useMutation({
    mutationFn: ({ week, paymentReference }: { week: string; paymentReference: string }) =>
      adminService.markPaymentAsPaid(week, paymentReference),
    onSuccess: () => {
      toast.success('✅ Paiement marqué comme payé !');
      queryClient.invalidateQueries({ queryKey: ['admin-host-payments-stats'] });
      setShowPaymentModal(false);
      setSelectedPayment(null);
      setLoadingMarkPaid(false);
    },
    onError: (error: any) => {
      toast.error(`❌ Erreur: ${error?.response?.data?.message || error.message}`);
      setLoadingMarkPaid(false);
    },
  });

  // Récupérer les données depuis la réponse API
  const stats = statsData?.data || {};
  const totalPending = parseFloat(stats.total_pending) || 0;
  const totalPaidThisMonth = stats.total_paid_this_month || 0;
  const totalHosts = stats.total_hosts || 0;
  const activeHosts = stats.active_hosts || 0;
  const totalRevenue = parseFloat(stats.total_revenue) || 0;

  // Récupérer l'historique des paiements
  const paymentsHistory = stats.recent_payments || [];
  
  // Supprimer les doublons basés sur la semaine
  const uniquePayments = paymentsHistory.filter((payment: any, index: number, self: any[]) =>
    index === self.findIndex((p) => p.week === payment.week)
  );

  // Filtrer et trier les paiements
  const filteredPayments = uniquePayments
    .filter((payment: any) => {
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          payment.host_name?.toLowerCase().includes(search) ||
          payment.payment_method?.toLowerCase().includes(search) ||
          payment.week?.includes(search)
        );
      }
      if (statusFilter === 'paid') {
        return payment.is_paid === true;
      }
      if (statusFilter === 'unpaid') {
        return payment.is_paid === false;
      }
      return true;
    })
    .sort((a: any, b: any) => {
      let aVal: any, bVal: any;
      switch (sortField) {
        case 'host_name':
          aVal = a.host_name || '';
          bVal = b.host_name || '';
          break;
        case 'amount':
          aVal = parseFloat(a.amount) || 0;
          bVal = parseFloat(b.amount) || 0;
          break;
        case 'week':
          aVal = a.week || '';
          bVal = b.week || '';
          break;
        case 'status':
          aVal = a.is_paid ? 1 : 0;
          bVal = b.is_paid ? 1 : 0;
          break;
        default:
          return 0;
      }
      if (typeof aVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleMarkPaid = (payment: any) => {
    const ref = prompt('📝 Entrez la référence de paiement:');
    if (ref && ref.trim()) {
      setLoadingMarkPaid(true);
      markPaidMutation.mutate({ week: payment.week, paymentReference: ref.trim() });
    }
  };

  const handleOpenPaymentModal = (payment: any) => {
    setSelectedPayment(payment);
    setShowPaymentModal(true);
  };

  const formatCurrency = (amount: number) => {
    return amount ? amount.toLocaleString() : '0';
  };

  const getStatusBadge = (isPaid: boolean) => {
    return isPaid ? (
      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
        <CheckCircle className="w-4 h-4" />
        Payé
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
        <Clock className="w-4 h-4" />
        En attente
      </span>
    );
  };

  const getMethodDisplay = (method: string) => {
    switch (method) {
      case 'MOBILE_MONEY': return '📱 Mobile Money';
      case 'BANK_TRANSFER': return '🏦 Virement bancaire';
      case 'PAYPAL': return '💳 PayPal';
      default: return '💰 ' + (method || 'Non défini');
    }
  };

  if (isLoading) {
    return <LoadingSkeleton isDark={isDark} />;
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[400px] ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
        <AlertCircle className={`w-12 h-12 ${isDark ? 'text-slate-500' : 'text-gray-400'} mb-4`} />
        <p className="text-lg font-medium">Erreur de chargement</p>
        <button 
          onClick={() => refetch()} 
          className={`mt-4 px-4 py-2 ${isDark ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-emerald-500 hover:bg-emerald-600'} text-white rounded-xl transition`}
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-slate-50 via-white to-emerald-50/30'} p-4 md:p-6 lg:p-8 transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className={`text-2xl md:text-3xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
              <Wallet className="w-6 h-6 text-emerald-500" />
              Paiements Hôtes
            </h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Gestion des paiements hebdomadaires des hôtes
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className={`flex items-center gap-2 px-4 py-2 ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'} border rounded-xl transition shadow-sm`}
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm">Rafraîchir</span>
          </button>
        </div>

        {/* Statistiques avec clic sur Total hôtes */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={Wallet}
            label="Total à payer"
            value={`${formatCurrency(totalPending)} FCFA`}
            subValue="Paiements en attente"
            color="red"
            isDark={isDark}
          />
          <StatCard
            icon={CheckCircle}
            label="Payé ce mois"
            value={`${formatCurrency(totalPaidThisMonth)} FCFA`}
            subValue="Paiements effectués"
            color="green"
            isDark={isDark}
          />
          <div 
            onClick={fetchAllHosts}
            className="cursor-pointer hover:scale-105 transition-all duration-300"
          >
            <StatCard
              icon={Users}
              label="Total hôtes"
              value={totalHosts}
              subValue={`${activeHosts} actifs • Cliquez pour voir`}
              color="blue"
              isDark={isDark}
            />
          </div>
          <StatCard
            icon={TrendingUp}
            label="Revenu total"
            value={`${formatCurrency(totalRevenue)} FCFA`}
            subValue="Depuis le début"
            color="purple"
            isDark={isDark}
          />
        </div>

        {/* Filtres et recherche */}
        <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} rounded-2xl p-4 shadow-sm border mb-6 transition-colors duration-300`}>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              <input
                type="text"
                placeholder="Rechercher un hôte..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors duration-300 ${
                  isDark 
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                    : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                } border`}
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className={`px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors duration-300 ${
                  isDark 
                    ? 'bg-slate-700 border-slate-600 text-white' 
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                } border`}
              >
                <option value="all">Tous les statuts</option>
                <option value="unpaid">En attente</option>
                <option value="paid">Payés</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tableau des paiements */}
        <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} rounded-2xl shadow-sm border overflow-hidden transition-colors duration-300`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${isDark ? 'bg-slate-700' : 'bg-slate-50'} border-b ${isDark ? 'border-slate-600' : 'border-slate-100'}`}>
                <tr>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wider`}>
                    Hôte
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wider`}>
                    Montant
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wider`}>
                    Méthode
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wider`}>
                    Réservations
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wider`}>
                    Semaine
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wider`}>
                    Statut
                  </th>
                  <th className={`px-4 py-3 text-center text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wider`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-slate-100'}`}>
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={`px-4 py-8 text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className={`w-8 h-8 ${isDark ? 'text-slate-500' : 'text-slate-300'}`} />
                        <p>Aucun paiement trouvé</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment: any, index: number) => {
                    const uniqueKey = `${payment.week}-${payment.host_name}-${index}`;
                    
                    return (
                      <tr key={uniqueKey} className={`${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-50'} transition`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full ${isDark ? 'bg-slate-700' : 'bg-emerald-50'} flex items-center justify-center text-emerald-600`}>
                              <User className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                            </div>
                            <div>
                              <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>{payment.host_name || 'N/A'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className={`font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                            {formatCurrency(parseFloat(payment.amount) || 0)} FCFA
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            {getMethodDisplay(payment.payment_method)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            {payment.reservations_count || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                            {payment.week ? new Date(payment.week).toLocaleDateString() : 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(payment.is_paid)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenPaymentModal(payment)}
                              className={`p-2 ${isDark ? 'text-blue-400 hover:bg-slate-700' : 'text-blue-600 hover:bg-blue-50'} rounded-lg transition`}
                              title="Voir les détails"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {!payment.is_paid && parseFloat(payment.amount) > 0 && (
                              <button
                                onClick={() => handleMarkPaid(payment)}
                                disabled={loadingMarkPaid}
                                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition text-sm font-medium disabled:opacity-50"
                              >
                                {loadingMarkPaid ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-3 h-3" />
                                )}
                                Payer
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de détails du paiement - AVEC MODE SOMBRE */}
        {showPaymentModal && selectedPayment && (
          <PaymentDetailModal
            payment={selectedPayment}
            isDark={isDark}
            onClose={() => {
              setShowPaymentModal(false);
              setSelectedPayment(null);
            }}
            onMarkPaid={() => handleMarkPaid(selectedPayment)}
          />
        )}

        {/* Modal : Tous les hôtes - AVEC MODE SOMBRE */}
        {showAllHostsModal && (
          <AllHostsModal
            hosts={allHostsData}
            isDark={isDark}
            onClose={() => {
              setShowAllHostsModal(false);
              setAllHostsData([]);
            }}
            loading={loadingHosts}
          />
        )}
      </div>
    </div>
  );
}

// ============================================
// PAYMENT DETAIL MODAL - AVEC MODE SOMBRE
// ============================================
function PaymentDetailModal({ 
  payment, 
  isDark,
  onClose, 
  onMarkPaid 
}: { 
  payment: any; 
  isDark: boolean;
  onClose: () => void; 
  onMarkPaid: () => void;
}) {
  const formatCurrency = (amount: number) => {
    return amount ? amount.toLocaleString() : '0';
  };

  const getStatusBadge = (isPaid: boolean) => {
    return isPaid ? (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
        <CheckCircle className="w-3 h-3" />
        Payé
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
        <Clock className="w-3 h-3" />
        En attente
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative ${isDark ? 'bg-slate-800' : 'bg-white'} rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 shadow-xl transition-colors duration-300`}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Détails du paiement</h2>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{payment.host_name || 'N/A'}</p>
          </div>
          <button onClick={onClose} className={`p-2 ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'} rounded-full transition`}>
            <X className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
          </button>
        </div>

        <div className="space-y-3">
          <div className={`flex justify-between py-2 border-b ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
            <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Montant</span>
            <span className="font-semibold text-emerald-600">{formatCurrency(parseFloat(payment.amount) || 0)} FCFA</span>
          </div>
          <div className={`flex justify-between py-2 border-b ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
            <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Méthode</span>
            <span className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              {payment.payment_method?.replace('_', ' ') || 'N/A'}
            </span>
          </div>
          <div className={`flex justify-between py-2 border-b ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
            <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Réservations</span>
            <span className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{payment.reservations_count || 0}</span>
          </div>
          <div className={`flex justify-between py-2 border-b ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
            <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Semaine</span>
            <span className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              {payment.week ? new Date(payment.week).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Statut</span>
            {getStatusBadge(payment.is_paid)}
          </div>
        </div>

        {!payment.is_paid && parseFloat(payment.amount) > 0 && (
          <div className={`mt-6 pt-4 border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
            <button
              onClick={onMarkPaid}
              className="w-full py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition font-medium"
            >
              ✅ Marquer comme payé
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// ALL HOSTS MODAL - AVEC MODE SOMBRE
// ============================================
function AllHostsModal({ hosts, isDark, onClose, loading }: { hosts: any[]; isDark: boolean; onClose: () => void; loading: boolean }) {
  const [searchHostTerm, setSearchHostTerm] = useState('');
  const [sortHostField, setSortHostField] = useState<'name' | 'method' | 'total'>('name');
  const [sortHostDirection, setSortHostDirection] = useState<'asc' | 'desc'>('asc');

  const filteredHosts = hosts
    .filter((host: any) => {
      if (!searchHostTerm) return true;
      const search = searchHostTerm.toLowerCase();
      const hostName = host.host?.first_name && host.host?.last_name 
        ? `${host.host.first_name} ${host.host.last_name}` 
        : host.fullName || '';
      return hostName.toLowerCase().includes(search);
    })
    .sort((a: any, b: any) => {
      let aVal: any, bVal: any;
      switch (sortHostField) {
        case 'name':
          const aName = a.host?.first_name && a.host?.last_name 
            ? `${a.host.first_name} ${a.host.last_name}` 
            : a.fullName || '';
          const bName = b.host?.first_name && b.host?.last_name 
            ? `${b.host.first_name} ${b.host.last_name}` 
            : b.fullName || '';
          aVal = aName;
          bVal = bName;
          break;
        case 'method':
          aVal = a.payment_method || '';
          bVal = b.payment_method || '';
          break;
        case 'total':
          aVal = parseFloat(a.total_all_time) || 0;
          bVal = parseFloat(b.total_all_time) || 0;
          break;
        default:
          return 0;
      }
      if (typeof aVal === 'string') {
        return sortHostDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (aVal < bVal) return sortHostDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortHostDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const handleSortHost = (field: typeof sortHostField) => {
    if (sortHostField === field) {
      setSortHostDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortHostField(field);
      setSortHostDirection('asc');
    }
  };

  const formatCurrency = (amount: number) => {
    return amount ? amount.toLocaleString() : '0';
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'MOBILE_MONEY': return '📱 Mobile Money';
      case 'BANK_TRANSFER': return '🏦 Virement';
      case 'PAYPAL': return '💳 PayPal';
      default: return '💰 ' + (method || 'Non défini');
    }
  };

  const getStatusBadge = (isPaid: boolean) => {
    return isPaid ? (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
        <CheckCircle className="w-3 h-3" />
        Payé
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs">
        <Clock className="w-3 h-3" />
        En attente
      </span>
    );
  };

  const getHostFullName = (host: any) => {
    if (host.host?.first_name && host.host?.last_name) {
      return `${host.host.first_name} ${host.host.last_name}`;
    }
    return host.full_name || host.fullName || 'N/A';
  };

  const getPaymentDetail = (host: any) => {
    const method = host.payment_method;
    if (method === 'MOBILE_MONEY') {
      return host.phone_number || host.phoneNumber || 'N/A';
    }
    if (method === 'BANK_TRANSFER') {
      return host.iban || 'N/A';
    }
    if (method === 'PAYPAL') {
      return host.paypal_email || host.paypalEmail || 'N/A';
    }
    return host.phone_number || host.phoneNumber || 'N/A';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative ${isDark ? 'bg-slate-800' : 'bg-white'} rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl transition-colors duration-300`}>
        {/* En-tête */}
        <div className={`sticky top-0 ${isDark ? 'bg-slate-800/95' : 'bg-white/95'} backdrop-blur-sm z-10 p-5 border-b ${isDark ? 'border-slate-700' : 'border-slate-100'} flex justify-between items-center`}>
          <div>
            <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
              <Users className="w-6 h-6 text-emerald-500" />
              Tous les hôtes
            </h2>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {hosts.length} hôte{hosts.length > 1 ? 's' : ''} inscrit{hosts.length > 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={onClose} className={`p-2 ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'} rounded-xl transition`}>
            <X className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
          </button>
        </div>

        {/* Recherche */}
        <div className={`p-4 border-b ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
            <input
              type="text"
              placeholder="Rechercher un hôte..."
              value={searchHostTerm}
              onChange={(e) => setSearchHostTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors duration-300 ${
                isDark 
                  ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                  : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
              } border`}
            />
          </div>
        </div>

        {/* Tableau */}
        <div className="overflow-y-auto max-h-[60vh] p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
          ) : filteredHosts.length === 0 ? (
            <div className={`text-center py-12 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <AlertCircle className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-slate-500' : 'text-slate-300'}`} />
              <p>Aucun hôte trouvé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${isDark ? 'bg-slate-700' : 'bg-slate-50'} rounded-xl`}>
                  <tr>
                    <th 
                      className={`px-4 py-3 text-left text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wider cursor-pointer hover:text-slate-700`}
                      onClick={() => handleSortHost('name')}
                    >
                      <div className="flex items-center gap-1">
                        Hôte
                        {sortHostField === 'name' && (
                          sortHostDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                        )}
                      </div>
                    </th>
                    <th 
                      className={`px-4 py-3 text-left text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wider cursor-pointer hover:text-slate-700`}
                      onClick={() => handleSortHost('method')}
                    >
                      <div className="flex items-center gap-1">
                        Moyen de paiement
                        {sortHostField === 'method' && (
                          sortHostDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                        )}
                      </div>
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wider`}>
                      Bénéficiaire
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wider`}>
                      Numéro / IBAN
                    </th>
                    <th 
                      className={`px-4 py-3 text-right text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wider cursor-pointer hover:text-slate-700`}
                      onClick={() => handleSortHost('total')}
                    >
                      <div className="flex items-center gap-1 justify-end">
                        Total
                        {sortHostField === 'total' && (
                          sortHostDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                        )}
                      </div>
                    </th>
                    <th className={`px-4 py-3 text-center text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wider`}>
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-slate-100'}`}>
                  {filteredHosts.map((host: any) => {
                    const hostName = getHostFullName(host);
                    const method = host.payment_method || 'N/A';
                    const beneficiary = host.full_name || host.fullName || 'N/A';
                    const detail = getPaymentDetail(host);
                    const total = parseFloat(host.total_all_time) || 0;
                    const isPaid = host.is_paid || false;

                    return (
                      <tr key={host.id} className={`${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-50'} transition`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full ${isDark ? 'bg-slate-700' : 'bg-emerald-50'} flex items-center justify-center text-emerald-600`}>
                              <User className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                            </div>
                            <div>
                              <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>{hostName}</p>
                              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                                {host.host?.email || host.email || ''}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                            {getMethodLabel(method)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{beneficiary}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-sm font-mono ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{detail}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                            {formatCurrency(total)} FCFA
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {getStatusBadge(isPaid)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pied */}
        <div className={`sticky bottom-0 ${isDark ? 'bg-slate-800/95' : 'bg-white/95'} backdrop-blur-sm p-4 border-t ${isDark ? 'border-slate-700' : 'border-slate-100'} flex justify-between items-center`}>
          <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {filteredHosts.length} hôte{filteredHosts.length > 1 ? 's' : ''} affiché{filteredHosts.length > 1 ? 's' : ''}
          </span>
          <button
            onClick={onClose}
            className={`px-6 py-2 ${isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'} rounded-xl transition font-medium`}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
import { useQuery } from '@tanstack/react-query';
import { 
  CreditCard, Wallet, TrendingUp, Calendar, Search, 
  Filter, Download, Eye, ChevronRight, CheckCircle, 
  XCircle, Clock, DollarSign, Smartphone, Banknote
} from 'lucide-react';
import adminService from '../../../services/admin.service';
import { useState } from 'react';
import toast from 'react-hot-toast';

export function AdminPaymentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: () => adminService.getPayments(),
    refetchInterval: 30000,
  });

  if (isLoading) return <LoadingSkeleton />;
  
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
    <div className="p-3 sm:p-4 md:p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* En-tête */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#0f2940] to-[#00c9a7] bg-clip-text text-transparent">
          Suivi des paiements
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">Analysez et gérez toutes les transactions financières</p>
      </div>

      {/* Statistiques - ✅ CORRECTION : Passer le composant, pas un élément JSX */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
        <StatCard icon={CreditCard} label="Transactions" value={stats.total} color="blue" />
        <StatCard icon={Wallet} label="Volume total" value={`${(stats.totalAmount / 1000000).toFixed(1)}M`} color="purple" subValue="FCFA" />
        <StatCard icon={CheckCircle} label="Succès" value={stats.success} color="green" />
        <StatCard icon={Clock} label="En attente" value={stats.pending} color="yellow" />
        <StatCard icon={XCircle} label="Échouées" value={stats.failed} color="red" />
        <StatCard icon={TrendingUp} label="Taux succès" value={`${successRate}%`} color="emerald" />
      </div>

      {/* Résumé quotidien */}
      <div className="bg-gradient-to-r from-[#00c9a7] to-[#0f2940] rounded-xl sm:rounded-2xl p-4 mb-6 text-white">
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

      {/* Filtres et recherche */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par transaction ID ou réservation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00c9a7]"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00c9a7]"
            >
              <option value="all">Tous statuts</option>
              <option value="success">Succès</option>
              <option value="pending">En attente</option>
              <option value="failed">Échoué</option>
            </select>
            <button
              onClick={() => refetch()}
              className="px-3 py-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
            >
              🔄
            </button>
          </div>
        </div>
      </div>

      {/* Liste des transactions */}
      <div className="space-y-3">
        {filteredPayments.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Aucune transaction trouvée</p>
          </div>
        ) : (
          filteredPayments.map((payment: any, idx: number) => (
            <PaymentCard
              key={payment.id}
              payment={payment}
              index={idx}
              onView={() => setSelectedPayment(payment)}
            />
          ))
        )}
      </div>

      {/* Modal de détails */}
      {selectedPayment && (
        <PaymentDetailModal payment={selectedPayment} onClose={() => setSelectedPayment(null)} />
      )}
    </div>
  );
}

// Composant de carte paiement
const PaymentCard = ({ payment, index, onView }: any) => {
  const statusConfig = {
    success: { color: 'green', icon: CheckCircle, label: 'Succès' },
    pending: { color: 'yellow', icon: Clock, label: 'En attente' },
    failed: { color: 'red', icon: XCircle, label: 'Échoué' },
  };
  
  const config = statusConfig[payment.status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-all">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className={`w-10 h-10 rounded-xl bg-${config.color}-100 flex items-center justify-center shrink-0`}>
            <StatusIcon className={`w-5 h-5 text-${config.color}-600`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-semibold bg-gray-100 px-2 py-0.5 rounded">
                {payment.transaction_id?.slice(-12)}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full bg-${config.color}-100 text-${config.color}-700`}>
                {config.label}
              </span>
            </div>
            <p className="text-sm font-semibold text-gray-800 mt-1">
              {payment.booking?.property?.title || 'Réservation'}
            </p>
            <p className="text-xs text-gray-500">Réf: {payment.booking?.booking_reference || '-'}</p>
          </div>
        </div>
        <div className="flex items-center justify-between w-full sm:w-auto gap-3">
          <div className="text-left sm:text-right">
            <p className="text-base sm:text-lg font-bold text-[#00c9a7]">{payment.amount?.toLocaleString()} FCFA</p>
            <div className="flex items-center gap-1 mt-1">
              <Smartphone className="w-3 h-3 text-gray-400" />
              <p className="text-xs text-gray-400">{payment.payment_method || 'Mobile Money'}</p>
            </div>
          </div>
          <button
            onClick={onView}
            className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            <Eye className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal de détails du paiement
const PaymentDetailModal = ({ payment, onClose }: any) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b sticky top-0 bg-white">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg">Détails du paiement</h3>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">✕</button>
          </div>
        </div>
        
        <div className="p-5 space-y-4">
          {/* Montant */}
          <div className="text-center">
            <p className="text-gray-500 text-sm">Montant total</p>
            <p className="text-3xl font-bold text-[#00c9a7]">{payment.amount?.toLocaleString()} FCFA</p>
          </div>

          {/* Détails */}
          <div className="space-y-3">
            <DetailRow label="Transaction ID" value={payment.transaction_id} />
            <DetailRow label="Réservation" value={payment.booking?.booking_reference} />
            <DetailRow label="Propriété" value={payment.booking?.property?.title} />
            <DetailRow label="Voyageur" value={payment.booking?.user?.full_name} />
            <DetailRow label="Méthode" value={payment.payment_method || 'Mobile Money'} />
            <DetailRow label="Statut" value={payment.status} status />
            <DetailRow label="Date" value={new Date(payment.created_at).toLocaleString()} />
            {payment.paid_at && <DetailRow label="Payé le" value={new Date(payment.paid_at).toLocaleString()} />}
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant de ligne de détail
const DetailRow = ({ label, value, status }: any) => (
  <div className="flex justify-between items-center py-2 border-b border-gray-100">
    <span className="text-sm text-gray-500">{label}</span>
    {status ? (
      <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${
        value === 'success' ? 'bg-green-100 text-green-700' :
        value === 'pending' ? 'bg-yellow-100 text-yellow-700' :
        'bg-red-100 text-red-700'
      }`}>
        {value === 'success' ? 'Succès' : value === 'pending' ? 'En attente' : 'Échoué'}
      </span>
    ) : (
      <span className="text-sm font-medium text-gray-800">{value || '-'}</span>
    )}
  </div>
);

// ✅ Composant de carte statistique CORRIGÉ
// Accepte un composant Icon et le rend avec className
const StatCard = ({ icon: Icon, label, value, color, subValue }: any) => {
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
          <Icon className="w-5 h-5" />  {/* ✅ Renderisez le composant avec className */}
        </div>
        <span className="text-xl font-bold">{value}</span>
      </div>
      <p className="text-white/80 text-xs mt-1">{label}</p>
      {subValue && <p className="text-white/60 text-[10px]">{subValue}</p>}
    </div>
  );
};

// Skeleton de chargement
const LoadingSkeleton = () => (
  <div className="p-3 sm:p-4 md:p-6">
    <div className="animate-pulse">
      <div className="h-6 sm:h-8 bg-gray-200 rounded w-48 mb-4"></div>
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="bg-gray-200 rounded-xl h-20"></div>)}
      </div>
      <div className="bg-gray-200 rounded-xl h-20 mb-6"></div>
      <div className="bg-gray-200 rounded-xl h-12 mb-6"></div>
      <div className="space-y-3">
        {[1, 2, 3].map(i => <div key={i} className="bg-gray-200 rounded-xl h-24"></div>)}
      </div>
    </div>
  </div>
);
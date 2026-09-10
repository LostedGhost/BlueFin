// src/app/pages/admin/AdminReportsPage.tsx
import { useQuery } from '@tanstack/react-query';
import { 
  FileText, Download, Calendar, TrendingUp, Users, 
  Home, CreditCard, DollarSign, ArrowUp, ArrowDown, 
  Printer, Share2, RefreshCw, Award, Activity, Clock, 
  Zap, Eye, X, Search, CheckCircle, AlertCircle
} from 'lucide-react';
import adminService from '../../../services/admin.service';
import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';

export function AdminReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'annual' | 'custom'>('monthly');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'financial' | 'users' | 'properties'>('overview');
  
  // États pour les modales
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
  
  // Requête pour les propriétés détaillées
  const { data: propertiesData, refetch: refetchProperties } = useQuery({
    queryKey: ['admin-reports-properties', selectedPeriod, customStartDate, customEndDate],
    queryFn: () => adminService.getPropertiesReport({
      period: selectedPeriod,
      start_date: customStartDate,
      end_date: customEndDate,
    }),
    enabled: false,
  });
  
  // Requête pour les utilisateurs détaillés
  const { data: usersData, refetch: refetchUsers } = useQuery({
    queryKey: ['admin-reports-users', selectedPeriod, customStartDate, customEndDate],
    queryFn: () => adminService.getUsersReport({
      period: selectedPeriod,
      start_date: customStartDate,
      end_date: customEndDate,
    }),
    enabled: false,
  });
  
  // Requête pour les réservations détaillées
  const { data: bookingsData, refetch: refetchBookings } = useQuery({
    queryKey: ['admin-reports-bookings', selectedPeriod, customStartDate, customEndDate],
    queryFn: () => adminService.getBookingsReport({
      period: selectedPeriod,
      start_date: customStartDate,
      end_date: customEndDate,
    }),
    enabled: false,
  });

  if (isLoading) return <LoadingSkeleton />;
  
  const report = data?.data || {};
  
  // Données pour les graphiques
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

  // ✅ Fonctions pour ouvrir les modales
  const openPropertiesModal = async () => {
    console.log(' Ouverture modal propriétés');
    setModalTitle('Liste des propriétés');
    setShowPropertiesModal(true);
    try {
      const result = await refetchProperties();
      console.log(' Données propriétés:', result.data);
      setModalData(result.data?.data || []);
    } catch (error) {
      console.error(' Erreur chargement propriétés:', error);
      setModalData([]);
    }
  };

  const openUsersModal = async () => {
    console.log(' Ouverture modal utilisateurs');
    setModalTitle('Liste des utilisateurs');
    setShowUsersModal(true);
    try {
      const result = await refetchUsers();
      console.log('Données utilisateurs:', result.data);
      setModalData(result.data?.data || []);
    } catch (error) {
      console.error(' Erreur chargement utilisateurs:', error);
      setModalData([]);
    }
  };

  const openBookingsModal = async () => {
    console.log(' Ouverture modal réservations');
    setModalTitle('Liste des réservations');
    setShowBookingsModal(true);
    try {
      const result = await refetchBookings();
      console.log(' Données réservations:', result.data);
      setModalData(result.data?.data || []);
    } catch (error) {
      console.error(' Erreur chargement réservations:', error);
      setModalData([]);
    }
  };

  const exportReport = async (format: 'csv' | 'pdf' | 'excel' | 'json') => {
    try {
      toast.success(`Export ${format.toUpperCase()} en cours de développement`);
    } catch {
      toast.error('Erreur lors de l\'export');
    }
  };

  const handlePrint = () => window.print();
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Rapport Bluefin-Immo',
          text: `Rapport ${selectedPeriod}`,
          url: window.location.href,
        });
        toast.success('Partagé avec succès');
      } catch { toast.error('Partage annulé'); }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Lien copié dans le presse-papier');
    }
  };

  const filteredModalData = modalData.filter(item => {
    const matchesSearch = searchTerm === '' || 
      JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
      item.status === statusFilter || 
      (statusFilter === 'published' && item.is_published === 1) ||
      (statusFilter === 'pending' && (item.status === 'pending' || item.is_published === 0));
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-3 sm:p-4 md:p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#0f2940] to-[#00c9a7] bg-clip-text text-transparent">
            Rapports & analyses
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Analysez la performance de votre plateforme</p>
        </div>
        
        <div className="flex gap-2">
          <button onClick={handlePrint} className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition" title="Imprimer">
            <Printer className="w-4 h-4" />
          </button>
          <button onClick={handleShare} className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition" title="Partager">
            <Share2 className="w-4 h-4" />
          </button>
          <button onClick={() => refetch()} className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition" title="Rafraîchir">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sélecteur de période */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <PeriodButton active={selectedPeriod === 'monthly'} onClick={() => setSelectedPeriod('monthly')} label="Mensuel" />
            <PeriodButton active={selectedPeriod === 'annual'} onClick={() => setSelectedPeriod('annual')} label="Annuel" />
            <PeriodButton active={selectedPeriod === 'custom'} onClick={() => setSelectedPeriod('custom')} label="Personnalisé" />
          </div>
          {selectedPeriod === 'custom' && (
            <div className="flex flex-col sm:flex-row gap-2">
              <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00c9a7]" />
              <span className="text-gray-400 self-center hidden sm:inline">→</span>
              <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00c9a7]" />
            </div>
          )}
        </div>
      </div>

      {/* Onglets */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-3">
        <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} label="📊 Vue d'ensemble" />
        <TabButton active={activeTab === 'financial'} onClick={() => setActiveTab('financial')} label="💰 Financier" />
        <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} label="👥 Utilisateurs" />
        <TabButton active={activeTab === 'properties'} onClick={() => setActiveTab('properties')} label="🏠 Propriétés" />
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'overview' && (
        <OverviewTab 
          report={report} 
          chartData={chartData} 
          onViewUsers={openUsersModal}
          onViewBookings={openBookingsModal}
          onViewProperties={openPropertiesModal}
        />
      )}
      {activeTab === 'financial' && <FinancialTab report={report} chartData={chartData} />}
      {activeTab === 'users' && <UsersTab report={report} onViewAll={openUsersModal} />}
      {activeTab === 'properties' && <PropertiesTab report={report} onViewAll={openPropertiesModal} />}

      {/* Section export */}
      <div className="mt-6 bg-white rounded-xl sm:rounded-2xl p-5 shadow-sm">
        <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
          <Download className="w-5 h-5 text-[#00c9a7]" />
          Exporter le rapport
        </h3>
        <div className="flex flex-wrap gap-3">
          <ExportButton onClick={() => exportReport('csv')} icon={<FileText className="w-4 h-4" />} label="CSV" color="green" />
          <ExportButton onClick={() => exportReport('excel')} icon={<FileText className="w-4 h-4" />} label="Excel" color="blue" />
          <ExportButton onClick={() => exportReport('pdf')} icon={<FileText className="w-4 h-4" />} label="PDF" color="red" />
        </div>
      </div>

      {/* Modal Propriétés */}
      {showPropertiesModal && (
        <DataModal
          title={modalTitle}
          data={filteredModalData}
          onClose={() => setShowPropertiesModal(false)}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          type="property"
        />
      )}

      {/* Modal Utilisateurs */}
      {showUsersModal && (
        <DataModal
          title={modalTitle}
          data={filteredModalData}
          onClose={() => setShowUsersModal(false)}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          type="user"
        />
      )}

      {/* Modal Réservations */}
      {showBookingsModal && (
        <DataModal
          title={modalTitle}
          data={filteredModalData}
          onClose={() => setShowBookingsModal(false)}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          type="booking"
        />
      )}
    </div>
  );
}

// Composant DataModal
const DataModal = ({ title, data, onClose, searchTerm, setSearchTerm, statusFilter, setStatusFilter, type }: any) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
    <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[85vh] flex flex-col">
      <div className="sticky top-0 bg-white border-b border-gray-100 p-4 rounded-t-2xl flex justify-between items-center">
        <h3 className="text-xl font-semibold text-[#0F2940]">{title}</h3>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition">
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00c9a7]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00c9a7]"
        >
          <option value="all">Tous les statuts</option>
          <option value="active">Actif</option>
          <option value="pending">En attente</option>
          <option value="published">Publié</option>
          <option value="confirmed">Confirmé</option>
        </select>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {data.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Aucune donnée disponible</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                {type === 'property' && (
                  <>
                    <th className="p-3 text-left">ID</th>
                    <th className="p-3 text-left">Titre</th>
                    <th className="p-3 text-left">Hôte</th>
                    <th className="p-3 text-left">Ville</th>
                    <th className="p-3 text-left">Prix/nuit</th>
                    <th className="p-3 text-left">Statut</th>
                    <th className="p-3 text-left">Publié</th>
                  </>
                )}
                {type === 'user' && (
                  <>
                    <th className="p-3 text-left">ID</th>
                    <th className="p-3 text-left">Nom</th>
                    <th className="p-3 text-left">Email</th>
                    <th className="p-3 text-left">Type</th>
                    <th className="p-3 text-left">Date inscription</th>
                    <th className="p-3 text-left">Statut</th>
                  </>
                )}
                {type === 'booking' && (
                  <>
                    <th className="p-3 text-left">ID</th>
                    <th className="p-3 text-left">Voyageur</th>
                    <th className="p-3 text-left">Propriété</th>
                    <th className="p-3 text-left">Dates</th>
                    <th className="p-3 text-left">Montant</th>
                    <th className="p-3 text-left">Statut</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {data.map((item: any, idx: number) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  {type === 'property' && (
                    <>
                      <td className="p-3 font-mono text-xs">#{item.id}</td>
                      <td className="p-3 font-medium">{item.title}</td>
                      <td className="p-3">{item.host_name}</td>
                      <td className="p-3">{item.city}</td>
                      <td className="p-3">{item.price_per_night?.toLocaleString()} FCFA</td>
                      <td className="p-3"><StatusBadge status={item.status} /></td>
                      <td className="p-3">
                        {item.is_published ? 
                          <span className="text-green-600 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Publié</span> : 
                          <span className="text-yellow-600 flex items-center gap-1"><Clock className="w-4 h-4" /> En attente</span>
                        }
                      </td>
                    </>
                  )}
                  {type === 'user' && (
                    <>
                      <td className="p-3 font-mono text-xs">#{item.id}</td>
                      <td className="p-3 font-medium">{item.first_name} {item.last_name}</td>
                      <td className="p-3">{item.email}</td>
                      <td className="p-3"><UserTypeBadge type={item.user_type} /></td>
                      <td className="p-3">{new Date(item.created_at).toLocaleDateString()}</td>
                      <td className="p-3">
                        {item.is_active ? 
                          <span className="text-green-600">Actif</span> : 
                          <span className="text-red-600">Inactif</span>
                        }
                      </td>
                    </>
                  )}
                  {type === 'booking' && (
                    <>
                      <td className="p-3 font-mono text-xs">#{item.id}</td>
                      <td className="p-3">{item.guest_name}</td>
                      <td className="p-3">{item.property_title}</td>
                      <td className="p-3">{item.check_in} → {item.check_out}</td>
                      <td className="p-3 font-semibold text-[#00c9a7]">{item.total_amount?.toLocaleString()} FCFA</td>
                      <td className="p-3"><StatusBadge status={item.status} /></td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  </div>
);

const StatusBadge = ({ status }: any) => {
  const config: any = {
    active: { color: 'bg-green-100 text-green-700', label: 'Actif' },
    published: { color: 'bg-green-100 text-green-700', label: 'Publié' },
    pending: { color: 'bg-yellow-100 text-yellow-700', label: 'En attente' },
    cancelled: { color: 'bg-red-100 text-red-700', label: 'Annulé' },
    confirmed: { color: 'bg-green-100 text-green-700', label: 'Confirmé' },
    completed: { color: 'bg-blue-100 text-blue-700', label: 'Terminé' },
  };
  const current = config[status] || config.pending;
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${current.color}`}>{current.label}</span>;
};

const UserTypeBadge = ({ type }: any) => {
  const config: any = {
    voyageur: { color: 'bg-blue-100 text-blue-700', label: 'Voyageur' },
    hote: { color: 'bg-green-100 text-green-700', label: 'Hôte' },
    admin: { color: 'bg-purple-100 text-purple-700', label: 'Admin' },
  };
  const current = config[type] || config.voyageur;
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${current.color}`}>{current.label}</span>;
};

// Onglet Vue d'ensemble
const OverviewTab = ({ report, chartData, onViewUsers, onViewBookings, onViewProperties }: any) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard title="Chiffre d'affaires" value={`${(report.total_revenue || 0).toLocaleString()} FCFA`} icon={<DollarSign className="w-5 h-5" />} color="green" />
      <button onClick={() => onViewUsers?.()} className="text-left w-full">
        <KPICard title="Utilisateurs" value={(report.total_users || 0).toLocaleString()} icon={<Users className="w-5 h-5" />} color="blue" />
      </button>
      <button onClick={() => onViewBookings?.()} className="text-left w-full">
        <KPICard title="Réservations" value={(report.total_bookings || 0).toLocaleString()} icon={<Calendar className="w-5 h-5" />} color="purple" />
      </button>
      <button onClick={() => onViewProperties?.()} className="text-left w-full">
        <KPICard title="Propriétés" value={(report.total_properties || 0).toLocaleString()} icon={<Home className="w-5 h-5" />} color="orange" />
      </button>
    </div>

    <div className="bg-white rounded-xl p-5 shadow-sm">
      <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
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
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
          <Tooltip formatter={(value) => `${value.toLocaleString()} FCFA`} />
          <Area type="monotone" dataKey="revenue" stroke="#00c9a7" fill="url(#revenueGradient)" name="CA (FCFA)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h4 className="font-semibold text-sm mb-3"> Aujourd'hui</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Nouveaux utilisateurs</span><span className="font-semibold">{report.new_users || 0}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Nouvelles propriétés</span><span className="font-semibold">{report.new_properties || 0}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Réservations</span><span className="font-semibold">{report.bookings_count || 0}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Chiffre d'affaires</span><span className="font-semibold text-[#00c9a7]">{(report.revenue || 0).toLocaleString()} FCFA</span></div>
        </div>
      </div>
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h4 className="font-semibold text-sm mb-3"> Total général</h4>
        <div className="space-y-2 text-sm">
          <button onClick={() => onViewUsers?.()} className="flex justify-between w-full hover:bg-gray-50 p-1 rounded transition">
            <span className="text-gray-500">Total utilisateurs</span><span className="font-semibold">{report.total_users || 0}</span>
          </button>
          <button onClick={() => onViewProperties?.()} className="flex justify-between w-full hover:bg-gray-50 p-1 rounded transition">
            <span className="text-gray-500">Total propriétés</span><span className="font-semibold">{report.total_properties || 0}</span>
          </button>
          <button onClick={() => onViewBookings?.()} className="flex justify-between w-full hover:bg-gray-50 p-1 rounded transition">
            <span className="text-gray-500">Total réservations</span><span className="font-semibold">{report.total_bookings || 0}</span>
          </button>
          <div className="flex justify-between"><span className="text-gray-500">CA total</span><span className="font-semibold text-[#00c9a7]">{(report.total_revenue || 0).toLocaleString()} FCFA</span></div>
        </div>
      </div>
    </div>
  </div>
);

// Onglet Propriétés
const PropertiesTab = ({ report, onViewAll }: any) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <button onClick={onViewAll} className="text-left w-full">
        <PropertyStatCard title="Total propriétés" value={report.total_properties || 0} icon={<Home className="w-5 h-5" />} color="green" />
      </button>
      <PropertyStatCard title="Actives" value={report.active_properties || 0} icon={<CheckCircle className="w-5 h-5" />} color="blue" />
      <PropertyStatCard title="En attente" value={report.pending_properties || 0} icon={<Clock className="w-5 h-5" />} color="yellow" />
      <PropertyStatCard title="Publiées" value={report.published_properties || 0} icon={<Zap className="w-5 h-5" />} color="purple" />
    </div>
    
    <button onClick={onViewAll} className="w-full bg-white rounded-xl p-4 shadow-sm text-[#00c9a7] hover:bg-gray-50 transition flex items-center justify-center gap-2">
      <Eye className="w-4 h-4" /> Voir toutes les propriétés
    </button>
  </div>
);

// Onglet Utilisateurs
const UsersTab = ({ report, onViewAll }: any) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <button onClick={onViewAll} className="text-left w-full">
        <UserStatCard title="Total utilisateurs" value={report.total_users || 0} icon={<Users className="w-5 h-5" />} color="blue" />
      </button>
      <UserStatCard title="Hôtes" value={report.total_hosts || 0} icon={<Home className="w-5 h-5" />} color="green" />
      <UserStatCard title="Voyageurs" value={report.total_travelers || 0} icon={<Users className="w-5 h-5" />} color="purple" />
      <UserStatCard title="Nouveaux aujourd'hui" value={report.new_users || 0} icon={<Users className="w-5 h-5" />} color="orange" />
    </div>
    <button onClick={onViewAll} className="w-full bg-white rounded-xl p-4 shadow-sm text-[#00c9a7] hover:bg-gray-50 transition flex items-center justify-center gap-2">
      <Eye className="w-4 h-4" /> Voir tous les utilisateurs
    </button>
  </div>
);

// Onglet Financier
const FinancialTab = ({ report, chartData }: any) => (
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
    <div className="bg-white rounded-xl p-5 shadow-sm">
      <h3 className="font-semibold text-base mb-4">Évolution quotidienne</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
          <Tooltip formatter={(value) => `${value.toLocaleString()} FCFA`} />
          <Bar dataKey="revenue" fill="#00c9a7" name="CA" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

// Composants auxiliaires
const PeriodButton = ({ active, onClick, label }: any) => (
  <button onClick={onClick} className={`px-4 py-2 rounded-xl text-sm font-medium transition ${active ? 'bg-[#00c9a7] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
    {label}
  </button>
);

const TabButton = ({ active, onClick, label }: any) => (
  <button onClick={onClick} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${active ? 'bg-[#00c9a7] text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
    {label}
  </button>
);

const ExportButton = ({ onClick, icon, label, color }: any) => {
  const colors = { green: 'bg-green-50 text-green-600 hover:bg-green-100', blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100', red: 'bg-red-50 text-red-600 hover:bg-red-100' };
  return <button onClick={onClick} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${colors[color]}`}>{icon}{label}</button>;
};

const KPICard = ({ title, value, icon, color }: any) => {
  const colors = { green: 'from-green-500 to-green-600', blue: 'from-blue-500 to-blue-600', purple: 'from-purple-500 to-purple-600', orange: 'from-orange-500 to-orange-600' };
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

const UserStatCard = ({ title, value, icon, color }: any) => {
  const colors = { blue: 'from-blue-500 to-blue-600', green: 'from-green-500 to-green-600', purple: 'from-purple-500 to-purple-600', orange: 'from-orange-500 to-orange-600' };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-xl p-4 text-white`}>
      <div className="flex justify-between items-center"><div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">{icon}</div></div>
      <p className="text-white/80 text-xs mt-2">{title}</p>
      <p className="text-2xl font-bold mt-0.5">{value.toLocaleString()}</p>
    </div>
  );
};

const PropertyStatCard = ({ title, value, icon, color }: any) => {
  const colors = { green: 'from-green-500 to-green-600', blue: 'from-blue-500 to-blue-600', yellow: 'from-yellow-500 to-yellow-600', purple: 'from-purple-500 to-purple-600' };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-xl p-4 text-white`}>
      <div className="flex justify-between items-center"><div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">{icon}</div></div>
      <p className="text-white/80 text-xs mt-2">{title}</p>
      <p className="text-2xl font-bold mt-0.5">{value.toLocaleString()}</p>
    </div>
  );
};

const LoadingSkeleton = () => (
  <div className="p-3 sm:p-4 md:p-6">
    <div className="animate-pulse">
      <div className="h-6 sm:h-8 bg-gray-200 rounded w-48 mb-4"></div>
      <div className="bg-gray-200 rounded-xl h-16 mb-6"></div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => <div key={i} className="bg-gray-200 rounded-xl h-28"></div>)}
      </div>
      <div className="bg-gray-200 rounded-xl h-80 mb-6"></div>
    </div>
  </div>
);
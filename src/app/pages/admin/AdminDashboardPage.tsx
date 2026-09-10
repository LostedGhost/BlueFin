// src/app/pages/admin/AdminDashboardPage.tsx
import { useQuery } from '@tanstack/react-query';
import { 
  Users, Home, CreditCard, TrendingUp, AlertCircle, Bell, 
  Calendar, DollarSign, Eye, Star, CheckCircle,
  Clock, Award, MapPin, Activity, BarChart3, PieChart,
  UserPlus, Building2, Wallet, RefreshCw,
  LogOut, ArrowLeft, Sparkles
} from 'lucide-react';
import adminService from '../../../services/admin.service';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart
} from 'recharts';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../contexts/AuthContext';

const COLORS = ['#00c9a7', '#0f2940', '#ff6b6b', '#f5a623', '#4a90e2'];

export function AdminDashboardPage({ onNavigate }: { onNavigate?: (route: any) => void }) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminService.getDashboard(),
    refetchInterval: 30000,
  });

  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const { logout } = useAuth();

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorMessage onRetry={() => refetch()} />;

  const resp: any = data?.data;
  const stats = resp?.stats || {};
  const activities = resp?.recent_activities || [];
  const chartData = resp?.chart_data || { labels: [], revenue: [], bookings: [], users: [] };
  const unreadCount = resp?.unread_notifications || 0;

  const revenueChartData = chartData.labels.map((label: string, idx: number) => ({
    day: label,
    revenue: chartData.revenue[idx] / 1000,
    bookings: chartData.bookings[idx],
    users: chartData.users[idx],
  }));

  const conversionRate = stats.properties ? 
    ((stats.properties.approved || 0) / (stats.properties.pending + stats.properties.approved || 1) * 100).toFixed(1) : 0;
  const bookingSuccessRate = stats.bookings ?
    ((stats.bookings.completed || 0) / (stats.bookings.total || 1) * 100).toFixed(1) : 0;

  const topDestinations = resp?.top_destinations || [
    { city: 'Cotonou', count: 234, revenue: 45600000 },
    { city: 'Porto-Novo', count: 89, revenue: 12300000 },
    { city: 'Parakou', count: 56, revenue: 7800000 },
    { city: 'Abomey', count: 45, revenue: 6700000 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 pb-10">
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* En-tête épuré */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-emerald-500" />
              Tableau de bord
            </h1>
            <p className="text-sm text-slate-500 mt-1">Vue d'ensemble de votre plateforme</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => refetch()}
              className="p-2 bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-slate-200"
            >
              <RefreshCw className="w-4 h-4 text-slate-500" />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 rounded-xl transition-colors border border-red-200"
            >
              <LogOut className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium text-red-600">Déconnexion</span>
            </button>
          </div>
        </div>

        {/* 4 Cartes principales */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={Users}
            title="Utilisateurs"
            value={stats.users?.total || 0}
            change={`+${stats.users?.new_today || 0} aujourd'hui`}
            color="blue"
          />
          <StatCard
            icon={Home}
            title="Propriétés"
            value={stats.properties?.total || 0}
            change={`${stats.properties?.pending || 0} en attente`}
            color="emerald"
          />
          <StatCard
            icon={DollarSign}
            title="Chiffre d'affaires"
            value={`${((stats.payments?.total_amount || 0) / 1000000).toFixed(1)}M FCFA`}
            change={`+${((stats.payments?.today_amount || 0) / 1000).toFixed(0)}k aujourd'hui`}
            color="purple"
          />
          <StatCard
            icon={Calendar}
            title="Réservations"
            value={stats.bookings?.confirmed || 0}
            change={`${stats.bookings?.pending_payment || 0} en attente`}
            color="orange"
          />
        </div>

        {/* Métriques secondaires */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="Conversion"
            value={`${conversionRate}%`}
            subtitle="Propriétés approuvées"
            icon={Activity}
            color="indigo"
          />
          <MetricCard
            title="Satisfaction"
            value="4.9/5"
            subtitle="Note moyenne"
            icon={Star}
            color="emerald"
          />
          <MetricCard
            title="Succès"
            value={`${bookingSuccessRate}%`}
            subtitle="Réservations complétées"
            icon={CheckCircle}
            color="rose"
          />
          <MetricCard
            title="Panier moyen"
            value={`${Math.round(((stats.payments?.total_amount || 0) / (stats.bookings?.confirmed || 1)) / 1000)}k FCFA`}
            subtitle="par réservation"
            icon={Wallet}
            color="amber"
          />
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ChartCard title="Évolution du chiffre d'affaires">
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={revenueChartData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tickFormatter={(v) => `${v}k`} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(v: number) => [`${v}k FCFA`, 'CA']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} fill="url(#revenueGradient)" name="CA (k FCFA)" />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Réservations vs Utilisateurs">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="bookings" fill="#0f2940" name="Réservations" radius={[4, 4, 0, 0]} />
                <Bar dataKey="users" fill="#10b981" name="Nouveaux utilisateurs" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Destinations + Répartition */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-500" />
              Destinations populaires
            </h3>
            <div className="space-y-3">
              {topDestinations.map((dest, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-medium text-sm text-slate-700">{dest.city}</p>
                      <p className="text-xs text-slate-400">{dest.count} réservations</p>
                    </div>
                  </div>
                  <p className="font-semibold text-emerald-600 text-sm">{(dest.revenue / 1000000).toFixed(1)}M FCFA</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 lg:col-span-2">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-emerald-500" />
              Répartition des propriétés
            </h3>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ResponsiveContainer width="100%" height={200}>
                <RePieChart>
                  <Pie
                    data={[
                      { name: 'Appartements', value: 45 },
                      { name: 'Villas', value: 25 },
                      { name: 'Studios', value: 15 },
                      { name: 'Maisons', value: 10 },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {COLORS.map((color, i) => (
                      <Cell key={i} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: 'none' }} />
                </RePieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3">
                {[
                  { label: 'Appartements', value: 45, color: '#00c9a7' },
                  { label: 'Villas', value: 25, color: '#0f2940' },
                  { label: 'Studios', value: 15, color: '#ff6b6b' },
                  { label: 'Maisons', value: 10, color: '#f5a623' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                    <span className="text-sm text-slate-600">{item.label}</span>
                    <span className="text-sm font-semibold text-slate-800">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Activités + Actions rapides */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-500" />
              Activités récentes
            </h3>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {activities.slice(0, 6).map((act: any, idx: number) => (
                <div key={idx} className="flex items-start gap-3 p-2 rounded-xl hover:bg-slate-50 transition">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    {act.type === 'property_submitted' && <Home className="w-4 h-4 text-orange-500" />}
                    {act.type === 'payment_received' && <CreditCard className="w-4 h-4 text-emerald-500" />}
                    {act.type === 'user_registered' && <UserPlus className="w-4 h-4 text-blue-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate">{act.title || act.message}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{act.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-emerald-500" />
              Actions rapides
            </h3>
            <div className="space-y-3">
              <QuickAction
                title="Propriétés en attente"
                count={stats.properties?.pending || 0}
                icon={Home}
                color="amber"
                onClick={() => onNavigate?.({ name: 'admin-properties' })}
              />
              <QuickAction
                title="Paiements en attente"
                count={stats.bookings?.pending_payment || 0}
                icon={CreditCard}
                color="rose"
                onClick={() => onNavigate?.({ name: 'admin-payments' })}
              />
              <QuickAction
                title="Utilisateurs à vérifier"
                count={stats.users?.pending_verification || 0}
                icon={Users}
                color="blue"
                onClick={() => onNavigate?.({ name: 'admin-users' })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== COMPOSANTS =====

const StatCard = ({ icon: Icon, title, value, change, color }: any) => {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    emerald: 'from-emerald-500 to-emerald-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5`}>
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">↑ 12%</span>
      </div>
      <p className="text-white/80 text-xs mt-3">{title}</p>
      <p className="text-2xl font-bold mt-0.5">{value}</p>
      <p className="text-white/60 text-xs mt-1">{change}</p>
    </div>
  );
};

const MetricCard = ({ title, value, subtitle, icon: Icon, color }: any) => {
  const colors = {
    indigo: 'from-indigo-50 to-indigo-100 border-indigo-200 text-indigo-700',
    emerald: 'from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-700',
    rose: 'from-rose-50 to-rose-100 border-rose-200 text-rose-700',
    amber: 'from-amber-50 to-amber-100 border-amber-200 text-amber-700',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-xl p-4 border shadow-sm`}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-white/60 flex items-center justify-center">
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="text-lg font-bold">{value}</p>
          <p className="text-xs opacity-80">{title}</p>
          <p className="text-xs opacity-60">{subtitle}</p>
        </div>
      </div>
    </div>
  );
};

const ChartCard = ({ title, children }: any) => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
    <h3 className="font-semibold text-slate-800 mb-4">{title}</h3>
    {children}
  </div>
);

const QuickAction = ({ title, count, icon: Icon, color, onClick }: any) => {
  const colors = {
    amber: 'bg-amber-50 border-amber-200 hover:bg-amber-100',
    rose: 'bg-rose-50 border-rose-200 hover:bg-rose-100',
    blue: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
  };

  const textColors = {
    amber: 'text-amber-700',
    rose: 'text-rose-700',
    blue: 'text-blue-700',
  };

  return (
    <div 
      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${colors[color]}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${textColors[color]}`} />
        <span className={`text-sm font-medium ${textColors[color]}`}>{title}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-sm font-bold ${textColors[color]}`}>{count}</span>
        <ChevronRight className={`w-4 h-4 ${textColors[color]}`} />
      </div>
    </div>
  );
};

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-slate-50 p-6">
    <div className="max-w-7xl mx-auto animate-pulse">
      <div className="h-10 bg-slate-200 rounded-xl w-64 mb-8"></div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>)}
      </div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[1,2,3,4].map(i => <div key={i} className="h-24 bg-slate-200 rounded-xl"></div>)}
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="h-80 bg-slate-200 rounded-2xl"></div>
        <div className="h-80 bg-slate-200 rounded-2xl"></div>
      </div>
    </div>
  </div>
);

const ErrorMessage = ({ onRetry }: { onRetry: () => void }) => (
  <div className="flex flex-col items-center justify-center min-h-screen p-6">
    <div className="text-red-500 text-xl mb-4">⚠️ Erreur de chargement</div>
    <p className="text-slate-600 text-center mb-6">Impossible de charger les données du tableau de bord</p>
    <button 
      onClick={onRetry} 
      className="px-6 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition font-medium"
    >
      Réessayer
    </button>
  </div>
);
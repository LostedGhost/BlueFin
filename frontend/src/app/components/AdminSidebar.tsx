import {
  LayoutDashboard,
  Home,
  Users,
  Calendar,
  CreditCard,
  MessageSquare,
  BarChart3,
  Wallet,
  LogOut,
  Sparkles,
  Briefcase,
  ChevronLeft,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import adminService from '../../services/admin.service';

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const menuItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/properties', icon: Home, label: 'Propriétés' },
  { to: '/admin/experiences', icon: Sparkles, label: 'Expériences' },
  { to: '/admin/services', icon: Briefcase, label: 'Services' },
  { to: '/admin/users', icon: Users, label: 'Utilisateurs' },
  { to: '/admin/bookings-logements', icon: Calendar, label: 'Réservations logements' },
  { to: '/admin/bookings-offres', icon: Calendar, label: 'Réservations expériences/services' },
  { to: '/admin/payments', icon: CreditCard, label: 'Paiements' },
  { to: '/admin/host-payments', icon: Wallet, label: 'Paiements Hôtes' },
  { to: '/admin/messages', icon: MessageSquare, label: 'Messages' },
  { to: '/admin/reports', icon: BarChart3, label: 'Rapports' },
];

export function AdminSidebar({ isOpen = true, onClose }: AdminSidebarProps) {
  const { logout } = useAuth();
  const { isDark } = useTheme();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Récupérer les notifications en temps réel
  const { data: notificationsData } = useQuery({
    queryKey: ['admin-notifications-count'],
    queryFn: () => adminService.getNotificationsCount(),
    refetchInterval: 30000,
    staleTime: 10000,
    retry: 1,
  });

  // Récupérer les paiements en attente
  const { data: paymentsData } = useQuery({
    queryKey: ['admin-payments-pending-count'],
    queryFn: () => adminService.getPendingPaymentsCount(),
    refetchInterval: 30000,
    staleTime: 10000,
    retry: 1,
  });

  // Détecter si c'est un écran mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setMobileMenuOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/admin-login';
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    if (onClose) onClose();
  };

  const unreadMessagesCount = notificationsData?.data?.unread_messages || 0;
  const pendingPaymentsCount = paymentsData?.data?.pending_payments || 0;

  // ✅ Menu hamburger pour mobile - visible UNIQUEMENT sur mobile
  const MobileMenuButton = () => (
    <button
      onClick={toggleMobileMenu}
      className={`
        fixed top-4 left-4 z-[9999] p-2.5 rounded-xl shadow-lg
        ${isDark 
          ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700' 
          : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50'
        }
        border transition-all duration-300 
        ${mobileMenuOpen ? 'scale-90' : 'hover:scale-105'}
        flex items-center justify-center
        w-11 h-11
        lg:hidden /* ✅ Masquer sur desktop */
      `}
      style={{ 
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        zIndex: 9999
      }}
      aria-label="Menu"
    >
      {mobileMenuOpen ? (
        <X className="w-5 h-5" />
      ) : (
        <Menu className="w-5 h-5" />
      )}
    </button>
  );

  // Overlay pour fermer le menu mobile
  const MobileOverlay = () => (
    <div 
      className={`
        fixed inset-0 z-40 transition-opacity duration-300 lg:hidden
        ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
      `}
      onClick={closeMobileMenu}
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
    />
  );

  return (
    <>
      {/* Bouton menu hamburger - UNIQUEMENT SUR MOBILE */}
      <MobileMenuButton />

      {/* Overlay pour mobile */}
      <MobileOverlay />

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative z-50 h-full w-64 flex flex-col transition-all duration-300 ease-in-out
        ${isMobile 
          ? mobileMenuOpen 
            ? 'translate-x-0' 
            : '-translate-x-full'
          : isOpen 
            ? 'translate-x-0' 
            : '-translate-x-full lg:translate-x-0'
        }
        ${isDark 
          ? 'bg-slate-800/95 border-slate-700/50' 
          : 'bg-white border-gray-200'
        }
        border-r shadow-2xl
        ${isMobile ? 'mt-0' : ''}
      `}>
        {/* Logo et titre */}
        <div className={`
          flex items-center justify-between px-4 py-4 border-b
          ${isDark ? 'border-slate-700/50' : 'border-gray-200'}
        `}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <div>
              <span className={`font-bold text-base ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Bluefin-Immo
              </span>
              <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                Administration
              </p>
            </div>
          </div>
          
          {isMobile && (
            <button
              onClick={closeMobileMenu}
              className={`p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700/50 transition lg:hidden`}
            >
              <X className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.to;
            
            let badge = null;
            let badgeColor = '';
            
            if (item.label === 'Messages' && unreadMessagesCount > 0) {
              badge = unreadMessagesCount;
              badgeColor = 'bg-red-500';
            } else if (item.label === 'Paiements' && pendingPaymentsCount > 0) {
              badge = pendingPaymentsCount;
              badgeColor = 'bg-amber-500';
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => {
                  if (isMobile) closeMobileMenu();
                }}
                className={({ isActive: isActiveNav }) => {
                  const active = isActive || isActiveNav;
                  return `
                    flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                    ${active 
                      ? 'bg-emerald-500/10 text-emerald-500 shadow-lg shadow-emerald-500/10 border border-emerald-500/20' 
                      : isDark 
                        ? 'text-slate-400 hover:bg-slate-700/50 hover:text-white' 
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `;
                }}
              >
                <item.icon className={`w-5 h-5 ${location.pathname === item.to ? 'text-emerald-500' : ''}`} />
                <span>{item.label}</span>
                
                {badge !== null && (
                  <span className={`
                    ml-auto text-[10px] px-2 py-0.5 rounded-full text-white font-medium
                    ${badgeColor}
                  `}>
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Section inférieure */}
        <div className={`
          px-3 py-4 border-t space-y-2
          ${isDark ? 'border-slate-700/50' : 'border-gray-200'}
        `}>
          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
              ${isDark 
                ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300' 
                : 'text-red-600 hover:bg-red-50 hover:text-red-700'
              }
            `}
          >
            <LogOut className="w-5 h-5" />
            <span>Déconnexion</span>
          </button>

          <div className="pt-2 text-center">
            <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
              Version 2.0.0 • {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
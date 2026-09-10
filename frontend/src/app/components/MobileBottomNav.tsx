// components/MobileBottomNav.tsx
import { Compass, Heart, MessageCircle, User, LogIn, Calendar, LayoutDashboard, Building2, Users, Settings } from 'lucide-react';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export type Tab = 'explore' | 'favorites' | 'trips' | 'messages' | 'profile' | 'auth' | 'admin-dashboard' | 'admin-users' | 'admin-properties' | 'admin-settings';

interface MobileBottomNavProps {
  active?: Tab;
  onNavigate?: (route: { name: string; id?: string } | string) => void;
}

export function MobileBottomNav({ active: propActive, onNavigate }: MobileBottomNavProps) {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const userName = user?.first_name ? `${user.first_name}` : '';
  const userType = user?.user_type;
  const hostType = user?.host_type; // ✅ Récupérer le type d'hôte (logement, experience, service)
  
  // ✅ Vérifier si l'utilisateur est admin
  const isAdmin = userType === 'admin';

  // ✅ Déterminer l'onglet actif en fonction de l'URL
  const getActiveTabFromPath = (): Tab => {
    const path = location.pathname;
    
    // Routes admin
    if (path === '/admin-dashboard' || path.startsWith('/admin-dashboard')) {
      return 'admin-dashboard';
    }
    if (path === '/admin/users' || path.startsWith('/admin/users')) {
      return 'admin-users';
    }
    if (path === '/admin/properties' || path.startsWith('/admin/properties')) {
      return 'admin-properties';
    }
    if (path === '/admin/settings' || path.startsWith('/admin/settings')) {
      return 'admin-settings';
    }
    
    // Routes publiques / voyageur / hôte
    if (path === '/' || path === '/popular' || path === '/hotels' || path.startsWith('/city/') || 
        path === '/experience' || path === '/services' || path.startsWith('/annonce/') ||
        path.startsWith('/search/')) {
      return 'explore';
    }
    
    if (path === '/favoris' || path === '/hote/favoris') {
      return 'favorites';
    }
    
    if (path === '/mon-compte/reservations') {
      return 'trips';
    }
    
    // ✅ Détection des messages pour hôte logement ET expérience
    if (path === '/messages' || path.startsWith('/messages/') || 
        path === '/hote/messages' || path.startsWith('/hote/messages/') ||
        path === '/host/experience/messages' || path.startsWith('/host/experience/messages/')) {
      return 'messages';
    }
    
    if (path === '/profil' || path === '/mon-compte' || path.startsWith('/profil/')) {
      return 'profile';
    }
    
    return 'explore';
  };

  // Priorité à la prop active, sinon déterminer par l'URL
  const activeTab = propActive || getActiveTabFromPath();

  useEffect(() => {
    console.log('🔍 MobileBottomNav - activeTab:', activeTab, 'propActive:', propActive, 'path:', location.pathname, 'userType:', userType, 'hostType:', hostType);
  }, [activeTab, propActive, location.pathname, userType, hostType]);

  // ✅ Définir les onglets disponibles selon le type d'utilisateur
  const getAvailableTabs = (): { id: Tab; icon: typeof Compass; label: string }[] => {
    
    // ✅ Si admin, afficher les onglets admin
    if (isAdmin) {
      return [
        { id: 'admin-dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { id: 'admin-users', icon: Users, label: 'Utilisateurs' },
        { id: 'admin-properties', icon: Building2, label: 'Annonces' },
        { id: 'admin-settings', icon: Settings, label: 'Paramètres' },
        { id: 'profile', icon: User, label: userName || 'Admin' },
      ];
    }
    
    // Onglets publics
    const publicTabs = [
      { id: 'explore' as Tab, icon: Compass, label: 'Explorer' },
      { id: 'favorites' as Tab, icon: Heart, label: 'Favoris' },
    ];
    
    const privateTabs = [
      { id: 'messages' as Tab, icon: MessageCircle, label: 'Messages' },
      { id: 'profile' as Tab, icon: User, label: userName || 'Profil' },
    ];
    
    const travelerSpecificTab = [
      { id: 'trips' as Tab, icon: Calendar, label: 'Voyages' },
    ];
    
    const authTab = [
      { id: 'auth' as Tab, icon: LogIn, label: 'Compte' },
    ];
    
    if (isAuthenticated) {
      if (userType === 'hote') {
        return [...publicTabs, ...privateTabs];
      }
      return [...publicTabs, ...travelerSpecificTab, ...privateTabs];
    } else {
      return [...publicTabs, ...authTab];
    }
  };

  const tabs = getAvailableTabs();

  // components/MobileBottomNav.tsx - Partie handleNavigate

const handleNavigate = (tabId: Tab) => {
  // ✅ Gestion navigation admin
  if (isAdmin) {
    if (tabId === 'admin-dashboard') {
      onNavigate?.({ name: 'admin-dashboard' });
    } else if (tabId === 'admin-users') {
      onNavigate?.({ name: 'admin-users' });
    } else if (tabId === 'admin-properties') {
      onNavigate?.({ name: 'admin-properties' });
    } else if (tabId === 'admin-settings') {
      onNavigate?.({ name: 'admin-settings' });
    } else if (tabId === 'profile') {
      onNavigate?.({ name: 'admin-dashboard' });
    }
    return;
  }
  
  // ✅ Gestion navigation non authentifié
  if (!isAuthenticated && (tabId === 'trips' || tabId === 'messages' || tabId === 'profile')) {
    onNavigate?.('auth');
    return;
  }

  if (tabId === 'auth') {
    onNavigate?.('auth');
    return;
  }

  // ✅ Gestion des messages - CORRECTION ICI
  if (tabId === 'messages') {
    if (userType === 'hote') {
      // ✅ Vérifier si c'est un hôte expérience
      if (hostType === 'experience') {
        console.log('📨 Hôte expérience → Redirection vers host-experience-messages');
        onNavigate?.({ name: 'host-experience-messages' });
      } else {
        // ✅ Hôte logement → host-messages
        console.log('📨 Hôte logement → Redirection vers host-messages');
        onNavigate?.({ name: 'host-messages' });
      }
    } else {
      // ✅ Voyageur → messages
      console.log('📨 Voyageur → Redirection vers messages');
      onNavigate?.({ name: 'messages' });
    }
    return;
  }

  if (tabId === 'favorites') {
    if (userType === 'hote') {
      onNavigate?.({ name: 'host-favorites' });
    } else {
      onNavigate?.({ name: 'favorites' });
    }
    return;
  }

  if (tabId === 'explore') {
    onNavigate?.({ name: 'home' });
  } else if (tabId === 'trips') {
    onNavigate?.({ name: 'account-reservations' });
  } else if (tabId === 'profile') {
    onNavigate?.({ name: 'profile' });
  } else {
    onNavigate?.(tabId);
  }
};

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e2f5f2] h-16 sm:h-20 px-2 flex items-center justify-around z-50 safe-area-pb">
      {tabs.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => handleNavigate(id)}
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all duration-200 ${
            activeTab === id 
              ? 'text-[#00c9a7] scale-105' 
              : 'text-[#9ca3af] hover:text-[#0f2940] hover:scale-105'
          }`}
        >
          <Icon 
            className={`w-5 h-5 sm:w-6 sm:h-6 transition-all ${
              activeTab === id && id !== 'auth' && id !== 'admin-dashboard' && id !== 'admin-users' && id !== 'admin-properties' && id !== 'admin-settings'
                ? 'fill-[#00c9a7] stroke-[#00c9a7]' 
                : ''
            }`} 
          />
          <span className={`text-[10px] sm:text-xs transition-all ${activeTab === id ? 'font-bold' : ''}`}>
            {label}
          </span>
        </button>
      ))}
    </div>
  );
}
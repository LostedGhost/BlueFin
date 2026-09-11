// components/MobileBottomNav.tsx
//
// Barre d'onglets mobile, identique pour visiteurs, voyageurs et hôtes
// (demande client) : Accueil · Carte · Favoris · Besoins · Profil.
// Messages et réservations sont accessibles depuis Profil (page profil et
// menu de compte). L'administration garde sa propre barre.
import { Home, Map, Heart, ClipboardList, User, LayoutDashboard, Building2, Users, Settings } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserAvatar } from './account/ProfileMenu';

export type Tab =
  | 'explore' | 'map' | 'favorites' | 'needs' | 'profile'
  // hérités (pages rattachées à Profil)
  | 'trips' | 'messages' | 'auth'
  | 'admin-dashboard' | 'admin-users' | 'admin-properties' | 'admin-settings';

interface MobileBottomNavProps {
  active?: Tab;
  onNavigate?: (route: { name: string; id?: string } | string) => void;
}

const MAIN_TABS: { id: Tab; icon: typeof Home; label: string }[] = [
  { id: 'explore', icon: Home, label: 'Accueil' },
  { id: 'map', icon: Map, label: 'Carte' },
  { id: 'favorites', icon: Heart, label: 'Favoris' },
  { id: 'needs', icon: ClipboardList, label: 'Besoins' },
  { id: 'profile', icon: User, label: 'Profil' },
];

const ADMIN_TABS: { id: Tab; icon: typeof Home; label: string }[] = [
  { id: 'admin-dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'admin-users', icon: Users, label: 'Utilisateurs' },
  { id: 'admin-properties', icon: Building2, label: 'Annonces' },
  { id: 'admin-settings', icon: Settings, label: 'Réglages' },
  { id: 'profile', icon: User, label: 'Profil' },
];

/** Onglet actif d'après l'adresse : les pages de compte relèvent de Profil. */
function tabFromPath(path: string): Tab {
  if (path.startsWith('/admin/users')) return 'admin-users';
  if (path.startsWith('/admin/properties')) return 'admin-properties';
  if (path.startsWith('/admin/settings')) return 'admin-settings';
  if (path.startsWith('/admin')) return 'admin-dashboard';
  if (path.startsWith('/carte')) return 'map';
  if (path.startsWith('/besoins')) return 'needs';
  if (path === '/favoris' || path === '/hote/favoris') return 'favorites';
  if (path.startsWith('/profil') || path.startsWith('/mon-compte') || path.startsWith('/messages') ||
      path.startsWith('/hote') || path.startsWith('/host/') || path.startsWith('/auth')) return 'profile';
  return 'explore';
}

export function MobileBottomNav({ active, onNavigate }: MobileBottomNavProps) {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const isAdmin = user?.user_type === 'admin';
  // L'onglet actif vient d'abord de la route de l'application (App.tsx) :
  // useLocation() n'est pas toujours à jour, le site changeant parfois
  // d'adresse sans passer par react-router. L'adresse sert de repli.
  const activeTab: Tab = active && active !== 'explore'
    ? (active === 'trips' || active === 'messages' ? 'profile' : active)
    : tabFromPath(location.pathname);
  const tabs = isAdmin ? ADMIN_TABS : MAIN_TABS;

  const go = (tab: Tab) => {
    switch (tab) {
      case 'explore': return onNavigate?.({ name: 'home' });
      case 'map': return onNavigate?.({ name: 'map' });
      case 'favorites': return onNavigate?.({ name: 'favorites' });
      case 'needs': return onNavigate?.({ name: 'needs' });
      case 'profile':
        if (!isAuthenticated) return onNavigate?.({ name: 'auth' });
        return onNavigate?.({ name: isAdmin ? 'admin-dashboard' : 'profile' });
      default: return onNavigate?.({ name: tab });
    }
  };

  return (
    // min-h + padding de zone sûre : une hauteur fixe écraserait le contenu.
    <nav aria-label="Navigation principale"
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e2f5f2] min-h-16 pb-[env(safe-area-inset-bottom)] px-1 flex items-center justify-around z-50">
      {tabs.map(({ id, icon: Icon, label }) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => go(id)}
            aria-current={active ? 'page' : undefined}
            className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-colors ${active ? 'text-[#00806b]' : 'text-slate-400 hover:text-[#0f2940]'}`}
          >
            {id === 'profile' && isAuthenticated && user ? (
              // Connecté : avatar (photo ou initiales) avec point vert.
              <span className={`rounded-full ${active ? 'ring-2 ring-[#00c9a7] ring-offset-1' : ''}`}>
                <UserAvatar user={user} size={24} />
              </span>
            ) : (
              <Icon className="w-6 h-6" strokeWidth={active ? 2.4 : 1.8} />
            )}
            <span className={`text-[11px] leading-none ${active ? 'font-semibold' : ''}`}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

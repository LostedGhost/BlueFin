// Barre latérale des utilisateurs connectés, écrans larges uniquement
// (demande client : la navigation sur ordinateur n'était pas évidente).
// Repliable : icônes seules ; l'état est mémorisé dans le navigateur.
// Sur mobile, la barre d'onglets du bas remplit ce rôle.
import {
  Home, Map, Heart, ClipboardList, MessageCircle, Calendar, LayoutDashboard, User, LogOut,
  ChevronsLeft, ChevronsRight,
} from 'lucide-react';
import type { User as AuthUser } from '../../../contexts/AuthContext';
import type { Route } from '../../router';
import Logo from '../../assets/Bluefin Immo_01.jpg.jpeg';

type Item = { label: string; icon: typeof Home; route: Route; match: (name: string) => boolean };

const hostDashboard = (hostType?: string | null): Route['name'] =>
  hostType === 'experience' ? 'host-experience-dashboard' : hostType === 'service' ? 'host-service-dashboard' : 'host-dashboard';

function itemsFor(user: AuthUser): Item[] {
  const common = {
    home: { label: 'Accueil', icon: Home, route: { name: 'home' } as Route, match: (n: string) => n === 'home' },
    map: { label: 'Carte', icon: Map, route: { name: 'map' } as Route, match: (n: string) => n === 'map' },
    favorites: { label: 'Favoris', icon: Heart, route: { name: 'favorites' } as Route, match: (n: string) => n === 'favorites' || n === 'host-favorites' },
    needs: { label: 'Besoins', icon: ClipboardList, route: { name: 'needs' } as Route, match: (n: string) => n === 'needs' },
    profile: { label: 'Profil', icon: User, route: { name: 'profile' } as Route, match: (n: string) => n === 'profile' || n === 'account' },
  };

  if (user.user_type === 'hote') {
    return [
      common.home,
      { label: 'Tableau de bord', icon: LayoutDashboard, route: { name: hostDashboard(user.host_type) }, match: (n) => n.startsWith('host-') && !n.includes('messages') && n !== 'host-favorites' },
      { label: 'Messages', icon: MessageCircle, route: { name: user.host_type === 'experience' ? 'host-experience-messages' : 'host-messages' }, match: (n) => n.includes('messages') },
      common.needs,
      common.map,
      common.favorites,
      common.profile,
    ];
  }

  return [
    common.home,
    common.map,
    common.favorites,
    common.needs,
    { label: 'Messages', icon: MessageCircle, route: { name: 'messages' }, match: (n) => n === 'messages' },
    { label: 'Mes voyages', icon: Calendar, route: { name: 'account-reservations' }, match: (n) => n === 'account-reservations' },
    common.profile,
  ];
}

export const SIDEBAR_WIDTH = { expanded: 248, collapsed: 76 };

export function AppSidebar({
  user, currentPage, collapsed, onToggle, onNavigate, onLogout,
}: {
  user: AuthUser;
  currentPage: string;
  collapsed: boolean;
  onToggle: () => void;
  onNavigate: (route: Route) => void;
  onLogout: () => void;
}) {
  const items = itemsFor(user);

  return (
    <aside
      aria-label="Navigation du compte"
      className="hidden lg:flex fixed inset-y-0 left-0 z-40 flex-col bg-white border-r border-[#e2f5f2] transition-[width] duration-200"
      style={{ width: collapsed ? SIDEBAR_WIDTH.collapsed : SIDEBAR_WIDTH.expanded }}
    >
      {/* Logo (retiré de la Navbar sur grand écran : le compte reste dans le
          menu profil en haut à droite, sans doublon ici). */}
      <button
        onClick={() => onNavigate({ name: 'home' })}
        title={collapsed ? 'Bluefin-Immo — accueil' : undefined}
        className={`flex items-center gap-3 h-[81px] border-b border-[#e2f5f2] group ${collapsed ? 'justify-center' : 'px-4'}`}
      >
        <img src={Logo} alt="Bluefin-Immo" className="w-11 h-11 object-contain rounded-xl shadow-md group-hover:shadow-lg transition-shadow shrink-0" />
        {!collapsed && (
          <span className="min-w-0 text-left">
            <span className="block font-bold text-lg text-[#0f2940] leading-tight">Bluefin-Immo</span>
            <span className="block text-xs text-[#00c9a7]">L'hébergement au Bénin</span>
          </span>
        )}
      </button>

      {/* Destinations */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {items.map(({ label, icon: Icon, route, match }) => {
          const active = match(currentPage);
          return (
            <button
              key={label}
              onClick={() => onNavigate(route)}
              title={collapsed ? label : undefined}
              aria-current={active ? 'page' : undefined}
              className={`w-full flex items-center gap-3 rounded-xl py-2.5 text-sm transition-colors ${collapsed ? 'justify-center px-0' : 'px-3'} ${
                active ? 'bg-[#f4fffe] text-[#005c4d] font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-[#0f2940]'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-[#00806b]' : ''}`} strokeWidth={active ? 2.3 : 1.9} />
              {!collapsed && <span className="truncate">{label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Bas : déconnexion + repli */}
      <div className="border-t border-[#e2f5f2] p-2 space-y-1">
        <button
          onClick={onLogout}
          title={collapsed ? 'Se déconnecter' : undefined}
          className={`w-full flex items-center gap-3 rounded-xl py-2.5 text-sm text-red-600 hover:bg-red-50 ${collapsed ? 'justify-center px-0' : 'px-3'}`}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Se déconnecter</span>}
        </button>
        <button
          onClick={onToggle}
          aria-label={collapsed ? 'Déplier la barre latérale' : 'Replier la barre latérale'}
          aria-expanded={!collapsed}
          className={`w-full flex items-center gap-3 rounded-xl py-2.5 text-sm text-slate-500 hover:bg-slate-50 ${collapsed ? 'justify-center px-0' : 'px-3'}`}
        >
          {collapsed ? <ChevronsRight className="w-5 h-5" /> : <><ChevronsLeft className="w-5 h-5" /><span>Replier</span></>}
        </button>
      </div>
    </aside>
  );
}

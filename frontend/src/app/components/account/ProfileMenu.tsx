// Présence de l'utilisateur connecté dans l'en-tête : avatar + menu de compte.
// Remplace les boutons « S'inscrire / Se connecter » dès qu'une session est
// ouverte (Navbar desktop, menu mobile, barre d'onglets mobile).
import { useEffect, useRef, useState } from 'react';
import {
  Calendar, ChevronDown, Heart, LayoutDashboard, LogOut, MessageCircle, Shield, User as UserIcon,
} from 'lucide-react';
import type { User } from '../../../contexts/AuthContext';
import type { Route } from '../../router';

type Link = { label: string; icon: typeof UserIcon; route: Route };

const hostDashboard: Record<string, Route['name']> = {
  logement: 'host-dashboard',
  experience: 'host-experience-dashboard',
  service: 'host-service-dashboard',
};

/** Liens du menu de compte, selon le type d'utilisateur. */
export function accountLinks(user: User): Link[] {
  if (user.user_type === 'admin') {
    return [{ label: 'Administration', icon: Shield, route: { name: 'admin-dashboard' } }];
  }
  if (user.user_type === 'hote') {
    return [
      { label: 'Tableau de bord', icon: LayoutDashboard, route: { name: hostDashboard[user.host_type ?? 'logement'] ?? 'host-dashboard' } },
      { label: 'Messages', icon: MessageCircle, route: { name: user.host_type === 'experience' ? 'host-experience-messages' : 'host-messages' } },
      { label: 'Mon profil', icon: UserIcon, route: { name: 'profile' } },
    ];
  }
  return [
    { label: 'Mon profil', icon: UserIcon, route: { name: 'profile' } },
    { label: 'Mes voyages', icon: Calendar, route: { name: 'account-reservations' } },
    { label: 'Messages', icon: MessageCircle, route: { name: 'messages' } },
    { label: 'Favoris', icon: Heart, route: { name: 'favorites' } },
  ];
}

const roleLabel = (user: User) =>
  user.user_type === 'admin' ? 'Administrateur' : user.user_type === 'hote' ? 'Hôte' : 'Voyageur';

const initials = (user: User) =>
  `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() || user.email?.[0]?.toUpperCase() || '?';

/**
 * Photo de profil si l'utilisateur en a une, sinon ses initiales. Le point
 * vert signale la session ouverte.
 */
export function UserAvatar({ user, size = 36, showStatus = true }: { user: User; size?: number; showStatus?: boolean }) {
  const [broken, setBroken] = useState(false);
  // Les « photos » générées par ui-avatars.com (renvoyées par défaut par le
  // backend) ne sont que des initiales sur fond pâle : on affiche les nôtres,
  // sans transmettre le nom de l'utilisateur à un service tiers.
  const raw = user.profile_photo ? (user.profile_photo_url || user.profile_photo) : null;
  const photo = raw && !raw.includes('ui-avatars.com') ? raw : null;

  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      {photo && !broken ? (
        <img src={photo} alt="" onError={() => setBroken(true)}
          className="w-full h-full rounded-full object-cover ring-2 ring-white" />
      ) : (
        <span className="w-full h-full rounded-full bg-[#0c3f53] text-white font-semibold flex items-center justify-center ring-2 ring-white"
          style={{ fontSize: Math.round(size * 0.38) }} aria-hidden="true">
          {initials(user)}
        </span>
      )}
      {showStatus && (
        <span className="absolute -bottom-0.5 -right-0.5 rounded-full bg-emerald-500 ring-2 ring-white"
          style={{ width: Math.max(8, size * 0.28), height: Math.max(8, size * 0.28) }} />
      )}
    </span>
  );
}

/** Menu de compte (desktop) : avatar + prénom, liste déroulante. */
export function ProfileMenu({
  user, onNavigate, onLogout,
}: {
  user: User;
  onNavigate?: (route: Route) => void;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [open]);

  const go = (route: Route) => { setOpen(false); onNavigate?.(route); };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Compte de ${user.first_name} — connecté`}
        className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-[#d5eef2] hover:shadow-md transition bg-white"
      >
        <UserAvatar user={user} size={34} />
        <span className="text-sm font-medium text-[#0f2940] max-w-[120px] truncate">{user.first_name}</span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-64 rounded-2xl bg-white shadow-xl border border-gray-100 py-2 z-50">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
            <UserAvatar user={user} size={40} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#0f2940] truncate">{user.first_name} {user.last_name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
              <p className="text-[11px] text-emerald-600 mt-0.5">{roleLabel(user)} · connecté</p>
            </div>
          </div>
          {accountLinks(user).map(({ label, icon: Icon, route }) => (
            <button key={label} role="menuitem" type="button" onClick={() => go(route)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#0f2940] hover:bg-[#eefbfd]">
              <Icon className="w-4 h-4 text-gray-500" /> {label}
            </button>
          ))}
          <div className="h-px bg-gray-100 my-1" />
          <button role="menuitem" type="button" onClick={() => { setOpen(false); onLogout(); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
            <LogOut className="w-4 h-4" /> Se déconnecter
          </button>
        </div>
      )}
    </div>
  );
}

// Ancien point d'entrée d'authentification, conservé pour ses utilisateurs
// (cartes d'annonce, widgets de réservation, favoris, ProtectedRoute…).
//
// Il s'appuyait sur services/auth.service, qui jugeait la session d'après le
// cookie Laravel lu en JavaScript. Ce cookie étant HttpOnly (invisible au JS),
// l'utilisateur était considéré déconnecté en production : ses données
// locales étaient effacées dès l'affichage d'une carte d'annonce, puis toutes
// les 60 s — il était déconnecté au rechargement suivant. Il relaie désormais
// le contexte d'authentification : une seule source de vérité.
import { useAuth as useAuthContext } from '../../contexts/AuthContext';

export const useAuth = () => {
    const ctx = useAuthContext();
    const user = ctx.user;

    return {
        user,
        loading: ctx.loading,
        isAuthenticated: ctx.isAuthenticated,
        isHost: user?.user_type === 'hote',
        isTraveler: user?.user_type === 'traveler',
        isAdmin: user?.user_type === 'admin',
        login: (email: string, password: string) => ctx.login(email, password),
        logout: ctx.logout,
        register: ctx.register,
        refreshUser: ctx.refreshUser,
        getToken: () => localStorage.getItem('token'),
        getUserType: () => user?.user_type ?? null,
        getCurrentUser: () => user,
    };
};

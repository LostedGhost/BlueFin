import { useState, useEffect, useCallback } from 'react';
import authService from '../../services/auth.service';
import type { User, UserType, LoginData, RegisterData } from '../../services/auth.service';

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(authService.getCurrentUser());
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());

    // ✅ Écouter les changements d'authentification
    useEffect(() => {
        const listener = (authStatus: boolean, userData: User | null) => {
            setIsAuthenticated(authStatus);
            setUser(userData);
            setLoading(false);
        };

        authService.addAuthListener(listener);
        setLoading(false);

        return () => {
            authService.removeAuthListener(listener);
        };
    }, []);

    // ✅ Login
    const login = useCallback(async (email: string, password: string, remember: boolean = false) => {
        console.log('🔐 useAuth.login - Tentative de connexion...');
        setLoading(true);
        
        try {
            const response = await authService.login({ email, password, remember });
            setUser(response.user);
            setIsAuthenticated(true);
            console.log('✅ useAuth.login - Connexion réussie');
            return response;
        } catch (error) {
            console.error('❌ useAuth.login - Erreur:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    // ✅ Register
    const register = useCallback(async (data: RegisterData) => {
        console.log('📝 useAuth.register - Tentative d\'inscription...');
        setLoading(true);
        
        try {
            const response = await authService.register(data);
            setUser(response.user);
            setIsAuthenticated(true);
            console.log('✅ useAuth.register - Inscription réussie');
            return response;
        } catch (error) {
            console.error('❌ useAuth.register - Erreur:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    // ✅ Logout
    const logout = useCallback(async () => {
        console.log('🚪 useAuth.logout - Déconnexion...');
        setLoading(true);
        
        try {
            await authService.logout();
            setUser(null);
            setIsAuthenticated(false);
            console.log('✅ useAuth.logout - Déconnexion réussie');
        } catch (error) {
            console.error('❌ useAuth.logout - Erreur:', error);
            // ✅ Même en cas d'erreur, nettoyer les données locales
            authService.clearLocalData();
            setUser(null);
            setIsAuthenticated(false);
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    // ✅ Refresh user
    const refreshUser = useCallback(async () => {
        try {
            const userData = await authService.refreshUser();
            setUser(userData);
            setIsAuthenticated(!!userData);
            return userData;
        } catch (error) {
            console.error('❌ useAuth.refreshUser - Erreur:', error);
            return null;
        }
    }, []);

    // ✅ Update user type
    const updateUserType = useCallback((type: UserType) => {
        authService.updateUserType(type);
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
    }, []);

    // ✅ Getters
    const isHost = user?.user_type === 'host';
    const isTraveler = user?.user_type === 'traveler';
    const isAdmin = user?.user_type === 'admin';

    return {
        user,
        loading,
        isAuthenticated,
        isHost,
        isTraveler,
        isAdmin,
        login,
        logout,
        register,
        refreshUser,
        updateUserType,
        getToken: authService.getToken,
        getUserType: authService.getUserType,
        getCurrentUser: authService.getCurrentUser,
    };
};
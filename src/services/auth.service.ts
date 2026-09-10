// services/auth.service.ts - Version corrigée pour Laravel

import { publicApi, v1Api, getCookie, deleteCookie, refreshCsrfToken } from './api';
import toast from 'react-hot-toast';

// ============================================
// ✅ INTERFACES
// ============================================

export interface RegisterData {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    password: string;
    password_confirmation: string;
    host_type?: 'logement' | 'experience' | 'service';
    property_address?: string;
    property_type?: string;
}

export interface LoginData {
    email?: string;
    phone?: string;
    password: string;
    remember?: boolean;
}

export interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    user_type: 'traveler' | 'hote' | 'admin'; // ✅ 'hote' pour Laravel
    host_type?: 'logement' | 'experience' | 'service' | null;
    profile_photo?: string;
    profile_photo_url?: string;
    bio?: string;
    country?: string;
    city?: string;
    address?: string;
    property_address?: string;
    property_type?: string;
    email_verified_at?: string;
    phone_verified_at?: string;
    verification_status?: 'pending' | 'verified' | 'rejected';
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
    total_bookings?: number;
    total_reviews?: number;
    average_rating_as_host?: number;
    total_properties?: number;
}

export type UserType = 'traveler' | 'hote' | 'admin';

export interface AuthResponse {
    user: User;
    message?: string;
    token?: string;
}

// ============================================
// ✅ SERVICE D'AUTHENTIFICATION
// ============================================

class AuthService {
    private static instance: AuthService;
    private currentUserType: UserType = 'traveler';
    private currentUser: User | null = null;
    private authListeners: ((isAuthenticated: boolean, user: User | null) => void)[] = [];

    public static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    private constructor() {
        this.loadUserFromStorage();
        
        setInterval(() => {
            this.checkSession();
        }, 60000);
    }

    // ============================================
    // ✅ GESTION DES LISTENERS
    // ============================================

    public addAuthListener(listener: (isAuthenticated: boolean, user: User | null) => void) {
        this.authListeners.push(listener);
        listener(this.isAuthenticated(), this.currentUser);
    }

    public removeAuthListener(listener: (isAuthenticated: boolean, user: User | null) => void) {
        this.authListeners = this.authListeners.filter(l => l !== listener);
    }

    private notifyListeners() {
        const isAuthenticated = this.isAuthenticated();
        console.log('🔔 Notification listeners - auth:', isAuthenticated, 'user:', this.currentUser?.email);
        this.authListeners.forEach(listener => listener(isAuthenticated, this.currentUser));
    }

    // ============================================
    // ✅ GESTION DE L'UTILISATEUR
    // ============================================

    private loadUserFromStorage() {
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                this.currentUser = JSON.parse(userStr);
                console.log('👤 Utilisateur chargé depuis localStorage:', this.currentUser?.email);
                console.log('📋 Type utilisateur:', this.currentUser?.user_type);
                console.log('📋 Type hôte:', this.currentUser?.host_type);
            }
            
            const userType = localStorage.getItem('userType') as UserType;
            if (userType && ['traveler', 'hote', 'admin'].includes(userType)) {
                this.currentUserType = userType;
            }

            // ✅ En développement, ignorer la vérification des cookies
            if (import.meta.env.DEV) {
                console.log('🔧 DEV MODE: Ignorer la vérification des cookies');
                if (this.currentUser && !this.hasValidSession()) {
                    console.log('🔧 DEV MODE: Création d\'un cookie de session factice');
                    document.cookie = 'laravel_session=dev_session_12345; path=/; max-age=3600';
                    document.cookie = 'XSRF-TOKEN=dev_token_67890; path=/; max-age=3600';
                }
                return;
            }
            
            const hasSession = this.hasValidSession();
            if (!hasSession && this.currentUser) {
                console.warn('⚠️ Session cookie manquant, nettoyage...');
                this.clearLocalData();
            }
        } catch (error) {
            console.error('❌ Erreur lors du chargement de l\'utilisateur:', error);
        }
    }

    private hasValidSession(): boolean {
        return !!(getCookie('laravel_session') || getCookie('PHPSESSID') || getCookie('bluefin_session') || getCookie('bluefin_immo_session'));
    }

    private async checkSession() {
        try {
            if (!this.hasValidSession() && this.currentUser) {
                console.warn('⚠️ Session cookie perdu, nettoyage...');
                this.clearLocalData();
                this.notifyListeners();
            }
        } catch (error) {
            console.error('❌ Erreur checkSession:', error);
        }
    }

    public getCurrentUser(): User | null {
        return this.currentUser;
    }

    public getUser(): User | null {
        return this.getCurrentUser();
    }

    public isAuthenticated(): boolean {
        const hasUser = !!this.currentUser;
        const hasSession = this.hasValidSession();
        const isAuth = hasUser && hasSession;
        
        if (hasUser && !hasSession) {
            console.warn('⚠️ Incohérence: user présent mais pas de session cookie');
            this.clearLocalData();
            return false;
        }
        
        return isAuth;
    }

    public getToken(): string | null {
        return localStorage.getItem('token') || null;
    }

    // ============================================
    // ✅ CONNEXION - CORRIGÉE POUR LARAVEL
    // ============================================
    
    public async login(data: LoginData, userType: UserType = 'traveler'): Promise<AuthResponse> {
        console.log(`🔐 Tentative de login ${userType} avec:`, data.email || data.phone);
        
        try {
            await refreshCsrfToken();
            
            // ✅ Utiliser l'endpoint standard de Laravel
            const payload = {
                ...data,
                user_type: userType, // Optionnel car Laravel utilise le guard
                remember: data.remember || false,
            };
            
                const candidatePaths = ['/api/v1/auth/login'];

                let response: any = null;
                let lastError: any = null; const xsrfToken = getCookie('XSRF-TOKEN'); const csrfHeaders = xsrfToken ? { 'X-XSRF-TOKEN': decodeURIComponent(xsrfToken) } : {};

                for (const ep of candidatePaths) {
                    try {
                        response = await publicApi.post(ep, payload, { headers: csrfHeaders });
                        break;
                    } catch (err: any) {
                        lastError = err;
                        const status = err?.response?.status;
                        const msg = (err?.response?.data?.message || '').toLowerCase();
                        if (status === 404 || status === 405 || status === 419) {
                            console.warn(`⚠️ Endpoint ${ep} en échec (${status}), essai du suivant...`);
                            continue;
                        }
                        if (status === 422 && msg.includes('csrf')) {
                            console.warn(`⚠️ CSRF rejeté sur ${ep}, essai du suivant...`);
                            continue;
                        }
                        throw err;
                    }
                }

                if (!response && lastError) throw lastError;
            
            console.log('📊 Réponse login:', response.data);
            
            if (!response.data.success) {
                throw new Error(response.data.message || 'Erreur de connexion');
            }
            
            // ✅ Extraire l'utilisateur
            const userData = response.data.user || response.data;
            
            if (!userData) {
                throw new Error('Données utilisateur manquantes dans la réponse');
            }
            
            // ✅ Transformer les données
            this.currentUser = {
                ...userData,
                user_type: userData.user_type || userType,
            };
            
            // ✅ Stocker l'utilisateur
            localStorage.setItem('user', JSON.stringify(this.currentUser));
            localStorage.setItem('userType', this.currentUser.user_type);
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
            }
            this.currentUserType = this.currentUser.user_type as UserType;
            
            this.notifyListeners();
            
            console.log('✅ Utilisateur connecté:', this.currentUser);
            console.log('📋 Type utilisateur:', this.currentUser.user_type);
            console.log('📋 Type hôte:', this.currentUser.host_type);
            
            return {
                user: this.currentUser,
                message: response.data.message || 'Connexion réussie',
                token: response.data.token,
            };
            
        } catch (error: any) {
            console.error('❌ Erreur de login:', error);
            throw this.handleError(error);
        }
    }

    // ============================================
    // ✅ INSCRIPTION - CORRIGÉE POUR LARAVEL
    // ============================================
    
    public async register(data: RegisterData, userType: UserType = 'traveler'): Promise<AuthResponse> {
        console.log(`📝 Tentative d'inscription ${userType}...`);
        console.log('📋 Données:', data);
        
        try {
            // L'inscription est également traitée sans CSRF pour éviter le 419 sur les environnements de production.
            
            // ✅ Construire le payload pour Laravel
            const payload: any = {
                first_name: data.first_name,
                last_name: data.last_name,
                email: data.email,
                phone: data.phone,
                password: data.password,
                password_confirmation: data.password_confirmation,
                user_type: userType,
            };
            
            // ✅ Ajouter host_type si l'utilisateur est un hôte
            if (userType === 'hote' && data.host_type) {
                payload.host_type = data.host_type;
                console.log('✅ Type hôte ajouté:', data.host_type);
            }
            
            // ✅ Ajouter les propriétés si présentes
            if (data.property_address) {
                payload.property_address = data.property_address;
            }
            if (data.property_type) {
                payload.property_type = data.property_type;
            }
            
            const candidatePaths = ['/api/v1/auth/register'];

            let response: any = null;
            let lastError: any = null; const xsrfToken = getCookie('XSRF-TOKEN'); const csrfHeaders = xsrfToken ? { 'X-XSRF-TOKEN': decodeURIComponent(xsrfToken) } : {};

            for (const ep of candidatePaths) {
                try {
                    console.log(`🔄 Essai endpoint: ${ep}...`);
                    response = await publicApi.post(ep, payload, { headers: csrfHeaders });
                    console.log(`✅ Succès avec ${ep}`);
                    break;
                } catch (err: any) {
                    lastError = err;
                    const msg = err?.response?.data?.message || '';
                    if (err?.response?.status === 404 && msg.includes('could not be found')) {
                        console.warn(`⚠️ Endpoint ${ep} introuvable, essai du suivant...`);
                        continue;
                    }
                    throw err;
                }
            }

            if (!response && lastError) throw lastError;
            
            console.log('📊 Réponse register:', response.data);
            
            if (!response.data.success) {
                throw new Error(response.data.message || 'Erreur d\'inscription');
            }
            
            // ✅ Extraire l'utilisateur
            const userData = response.data.user || response.data;
            
            if (!userData) {
                throw new Error('Données utilisateur manquantes dans la réponse');
            }
            
            // ✅ Transformer les données
            // ⚠️ FORCE userType (paramètre) plutôt que userData.user_type
            // Car le backend peut retourner 'traveler' même si on envoie 'hote'
            this.currentUser = {
                ...userData,
                user_type: userType,
                host_type: userData.host_type || null
            };
            
            // ✅ Stocker l'utilisateur
            localStorage.setItem('user', JSON.stringify(this.currentUser));
            localStorage.setItem('userType', userType);
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
            }
            this.currentUserType = this.currentUser.user_type as UserType;
            
            this.notifyListeners();
            
            console.log('✅ Utilisateur inscrit:', this.currentUser);
            console.log('📋 Type hôte:', this.currentUser.host_type);
            
            return {
                user: this.currentUser,
                message: response.data.message || 'Inscription réussie',
                token: response.data.token,
            };
            
        } catch (error: any) {
            console.error('❌ Erreur d\'inscription:', error);
            throw this.handleError(error);
        }
    }

    // ============================================
    // ✅ INSCRIPTION SPÉCIFIQUE POUR HÔTE
    // ============================================
    
    public async registerHost(data: RegisterData): Promise<AuthResponse> {
        console.log('🏠 Inscription en tant qu\'hôte...');
        return this.register(data, 'hote');
    }

    // ============================================
    // ✅ DÉCONNEXION
    // ============================================
    
    public async logout(): Promise<void> {
        console.log(`🚪 Déconnexion...`);
        
        try {
            await publicApi.post('/api/v1/auth/logout');
            console.log('✅ Déconnexion API réussie');
        } catch (error) {
            console.warn('⚠️ Erreur lors de la déconnexion API:', error);
        } finally {
            this.clearLocalData();
            this.notifyListeners();
            console.log('✅ Déconnexion terminée');
        }
    }

    // ============================================
    // ✅ NETTOYAGE
    // ============================================
    
    public clearLocalData(): void {
        this.currentUser = null;
        this.currentUserType = 'traveler';
        
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userType');
        localStorage.removeItem('userRole');
        localStorage.removeItem('isHost');
        localStorage.removeItem('remember_token');
        
        deleteCookie('laravel_session');
        deleteCookie('PHPSESSID');
        deleteCookie('XSRF-TOKEN');
        deleteCookie('bluefin_session');
        deleteCookie('bluefin_immo_session');
    }

    // ============================================
    // ✅ PROFIL UTILISATEUR
    // ============================================
    
    public async getProfile(): Promise<User> {
        try {
            console.log('👤 Récupération du profil...');
            
            if (!this.hasValidSession()) {
                throw new Error('Session expirée');
            }
            
            const response = await publicApi.get('/api/user');
            console.log('📊 Réponse profil:', response.data);
            
            const userData = response.data.user || response.data;
            
            if (userData) {
                // ⚠️ FORCE currentUserType au lieu de faire confiance au serveur
                this.currentUser = {
                    ...this.currentUser,
                    ...userData,
                    user_type: this.currentUserType,
                    host_type: userData.host_type || this.currentUser.host_type || null
                };
                localStorage.setItem('user', JSON.stringify(this.currentUser));
                localStorage.setItem('userType', this.currentUserType);
            }
            
            console.log('✅ Profil récupéré:', this.currentUser?.email);
            console.log('📋 Type utilisateur:', this.currentUser?.user_type);
            console.log('📋 Type hôte:', this.currentUser?.host_type);
            return this.currentUser!;
        } catch (error) {
            console.error('❌ Erreur getProfile:', error);
            if ((error as any)?.response?.status === 401) {
                this.clearLocalData();
                this.notifyListeners();
            }
            throw this.handleError(error);
        }
    }

    public async refreshUser(): Promise<User | null> {
        try {
            return await this.getProfile();
        } catch (error) {
            console.error('❌ Erreur refreshUser:', error);
            return this.currentUser;
        }
    }

    // ============================================
    // ✅ GESTION DU TYPE D'UTILISATEUR
    // ============================================
    
    public setUserType(type: UserType) {
        this.currentUserType = type;
        localStorage.setItem('userType', type);
        if (this.currentUser) {
            this.currentUser.user_type = type;
            localStorage.setItem('user', JSON.stringify(this.currentUser));
        }
        this.notifyListeners();
    }

    public getUserType(): UserType {
        const stored = localStorage.getItem('userType') as UserType;
        if (stored && ['traveler', 'hote', 'admin'].includes(stored)) {
            this.currentUserType = stored;
            return stored;
        }
        return this.currentUserType;
    }

    public isHost(): boolean {
        return this.getUserType() === 'hote';
    }

    public isTraveler(): boolean {
        return this.getUserType() === 'traveler';
    }

    public isAdmin(): boolean {
        return this.getUserType() === 'admin';
    }

    // ============================================
    // ✅ MÉTHODES SPÉCIFIQUES POUR LES HÔTES
    // ============================================
    
    public isHostLogement(): boolean {
        return this.isHost() && this.currentUser?.host_type === 'logement';
    }

    public isHostExperience(): boolean {
        return this.isHost() && this.currentUser?.host_type === 'experience';
    }

    public isHostService(): boolean {
        return this.isHost() && this.currentUser?.host_type === 'service';
    }

    public getHostType(): 'logement' | 'experience' | 'service' | null {
        if (!this.isHost()) return null;
        return this.currentUser?.host_type || null;
    }

    public getHostTypeLabel(): string {
        const types = {
            'logement': '🏠 Logement',
            'experience': '🎯 Expérience',
            'service': '🔧 Service'
        };
        const hostType = this.getHostType();
        return hostType ? types[hostType] : 'Non défini';
    }

    public getHostTypeColor(): string {
        const colors = {
            'logement': 'bg-blue-100 text-blue-800',
            'experience': 'bg-purple-100 text-purple-800',
            'service': 'bg-orange-100 text-orange-800'
        };
        const hostType = this.getHostType();
        return hostType ? colors[hostType] : 'bg-gray-100 text-gray-800';
    }

    public async updateHostType(hostType: 'logement' | 'experience' | 'service'): Promise<User> {
        try {
            const response = await publicApi.post('/api/users/update-host-type', {
                host_type: hostType
            });
            
            const userData = response.data.user || response.data;
            if (userData) {
                this.currentUser = { ...this.currentUser, ...userData };
                localStorage.setItem('user', JSON.stringify(this.currentUser));
            }
            
            console.log('✅ Type d\'hôte mis à jour:', hostType);
            return this.currentUser!;
        } catch (error) {
            console.error('❌ Erreur updateHostType:', error);
            throw this.handleError(error);
        }
    }

    // ============================================
    // ✅ GESTION DES ERREURS
    // ============================================
    
    private handleError(error: any): Error {
        let message = 'Une erreur est survenue';
        
        if (error.response) {
            const data = error.response.data;
            
            // ✅ Erreurs de validation Laravel
            if (data.errors) {
                const messages = Object.values(data.errors).flat();
                message = messages.join(', ');
            } else {
                message = data.message || data.error || message;
            }
            
            if (error.response.status === 419) {
                message = 'Erreur de sécurité. Veuillez rafraîchir la page et réessayer.';
                refreshCsrfToken();
            }
            
            if (error.response.status === 401) {
                message = 'Session expirée. Veuillez vous reconnecter.';
                this.clearLocalData();
                this.notifyListeners();
            }
            
            if (error.response.status === 403) {
                message = data.message || 'Accès non autorisé.';
            }
        } else if (error.request) {
            message = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
        } else {
            message = error.message || message;
        }
        
        toast.error(message);
        return new Error(message);
    }
}

// ✅ Export du singleton
export default AuthService.getInstance();
export { AuthService };

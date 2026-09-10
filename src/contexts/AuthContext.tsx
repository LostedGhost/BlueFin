// contexts/AuthContext.tsx - Version corrigée

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { publicApi, v1Api, getCookie, refreshCsrfToken, deleteCookie } from '../services/api';
import toast from 'react-hot-toast';

export interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    user_type: 'traveler' | 'hote' | 'admin'; // ✅ 'hote' pour Laravel
    host_type?: 'logement' | 'experience' | 'service' | null; // ✅ NOUVEAU
    is_verified?: boolean;
    photo?: string;
    profile_photo?: string;
    profile_photo_url?: string;
    email_verified_at?: string;
    phone_verified_at?: string;
    verification_status?: 'pending' | 'verified' | 'rejected';
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
    last_login_at?: string;
    total_properties?: number;
    total_bookings?: number;
    total_reviews?: number;
    average_rating?: number;
    property_address?: string;
    property_type?: string;
}

export interface RegisterData {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    password: string;
    password_confirmation: string;
    host_type?: 'logement' | 'experience' | 'service'; // ✅ NOUVEAU
    property_address?: string; // ✅ NOUVEAU
    property_type?: string; // ✅ NOUVEAU
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (email: string, password: string, userType?: string) => Promise<any>;
    register: (data: RegisterData, userType?: string) => Promise<any>;
    logout: () => Promise<void>;
    updateUser: (user: User) => void;
    refreshUser: () => Promise<User | null>;
    switchUserType: (type: string) => void;
    hasValidSession: () => boolean;
    // ✅ NOUVELLES MÉTHODES POUR LES HÔTES
    isHost: () => boolean;
    isTraveler: () => boolean;
    isAdmin: () => boolean;
    getHostType: () => 'logement' | 'experience' | 'service' | null;
    getHostTypeLabel: () => string;
}

// Keep a single context instance across HMR/module duplication in dev.
const AUTH_CONTEXT_GLOBAL_KEY = '__BLUEFIN_AUTH_CONTEXT__';
const globalScope = globalThis as typeof globalThis & {
    [AUTH_CONTEXT_GLOBAL_KEY]?: React.Context<AuthContextType | undefined>;
};
const AuthContext =
    globalScope[AUTH_CONTEXT_GLOBAL_KEY] ??
    (globalScope[AUTH_CONTEXT_GLOBAL_KEY] = createContext<AuthContextType | undefined>(undefined));

type NormalizedUserType = User['user_type'];

const normalizeUserType = (value?: string | null): NormalizedUserType => {
    switch (value) {
        case 'hote':
        case 'admin':
        case 'traveler':
            return value;
        case 'host':
            return 'hote';
        case 'voyageur':
            return 'traveler';
        default:
            return 'traveler';
    }
};

const resolveUserType = (apiUserType?: string | null, fallbackUserType?: string | null): NormalizedUserType => {
    if (apiUserType) {
        return normalizeUserType(apiUserType);
    }
    return normalizeUserType(fallbackUserType);
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            try {
                return JSON.parse(savedUser);
            } catch (e) {
                console.error('❌ Erreur parsing user:', e);
                localStorage.removeItem('user');
                return null;
            }
        }
        return null;
    });
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // ✅ Fonction pour vérifier si la session est valide
    const hasValidSession = useCallback(() => {
        // Les cookies de session peuvent etre HttpOnly et invisibles en JS.
        return !!localStorage.getItem('user');
    }, []);

    // ============================================
    // ✅ VÉRIFICATION DE SESSION AU DÉMARRAGE
    // ============================================
    useEffect(() => {
        const checkSession = async () => {
            try {
                setLoading(true);
                
                // ✅ EN DÉVELOPPEMENT : Simulation de session
                if (import.meta.env.DEV) {
                    console.log('🔧 DEV MODE: Simulation de session');
                    const storedUser = localStorage.getItem('user');
                    if (storedUser) {
                        const userData = JSON.parse(storedUser);
                        setUser(userData);
                        setIsAuthenticated(true);
                        console.log('✅ Session DEV active pour:', userData.email);
                        console.log('📋 Type utilisateur:', userData.user_type);
                        console.log('📋 Type hôte:', userData.host_type);
                        setLoading(false);
                        return;
                    }
                    setLoading(false);
                    return;
                }
                
                const storedUser = localStorage.getItem('user');
                
                console.log('🔍 Vérification session:', {
                    hasStoredUser: !!storedUser,
                });

                if (!storedUser) {
                    console.log('ℹ️ Aucun utilisateur stocké localement');
                    setLoading(false);
                    return;
                }

                // ✅ Si cookie présent, récupérer l'utilisateur
                try {
                    await refreshCsrfToken();
                    
                    const response = await publicApi.get('/api/user', {
                        withCredentials: true,
                    });

                    if (response.status === 200) {
                        const userData = response.data.user || response.data;
                        if (userData && userData.id) {
                            const userType = resolveUserType(userData.user_type, localStorage.getItem('userType'));
                            const finalUser: User = { 
                                ...userData, 
                                user_type: userType,
                                host_type: userData.host_type || null
                            };
                            localStorage.setItem('user', JSON.stringify(finalUser));
                            localStorage.setItem('userType', userType);
                            setUser(finalUser);
                            setIsAuthenticated(true);
                            console.log('✅ Utilisateur authentifié:', finalUser.email);
                            console.log('📋 Type utilisateur:', finalUser.user_type);
                            console.log('📋 Type hôte:', finalUser.host_type);
                        }
                    } else {
                        console.warn('⚠️ Erreur récupération profil:', response.status);
                        localStorage.removeItem('user');
                        localStorage.removeItem('userType');
                        setUser(null);
                        setIsAuthenticated(false);
                    }
                } catch (error) {
                    console.error('❌ Erreur récupération profil:', error);
                    localStorage.removeItem('user');
                    localStorage.removeItem('userType');
                    setUser(null);
                    setIsAuthenticated(false);
                }
            } catch (error) {
                console.error('❌ Erreur vérification session:', error);
            } finally {
                setLoading(false);
            }
        };

        checkSession();

        // Vérification périodique désactivée : le cookie de session Sanctum est httpOnly
        // et invisible en JS (document.cookie), donc cette vérification produisait des
        // faux positifs qui déconnectaient l'utilisateur à tort quelques secondes après
        // la connexion. La vraie invalidation de session est gérée par checkSession()
        // ci-dessus (appel réel à /api/user) et par les réponses 401 des appels API.
    }, []);

   // contexts/AuthContext.tsx - Ajoutez cette fonction et modifiez login

// ============================================
// ✅ REDIRECTION APRÈS CONNEXION - CORRIGÉE
// ============================================
// contexts/AuthContext.tsx

const handlePostLoginRedirect = useCallback(() => {
    console.log('🔍 Vérification des redirections après login...');
    
    // ✅ Vérifier s'il y a une demande d'inquiry en attente
    const redirectAfterLogin = localStorage.getItem('redirect_after_login');
    const pendingInquiry = localStorage.getItem('pendingInquiry');
    const redirectIntent = localStorage.getItem('redirect_intent');
    
    console.log('📌 redirect_after_login:', redirectAfterLogin);
    console.log('📌 pendingInquiry:', pendingInquiry);
    console.log('📌 redirect_intent:', redirectIntent);
    
    // ✅ REDIRECTION VERS SERVICE BOOKING
    if (redirectIntent === 'service_booking') {
        console.log('🔄 Redirection vers réservation service');
        const serviceId = localStorage.getItem('redirect_service_id');
        const tempDate = localStorage.getItem('temp_booking_date');
        
        console.log('📌 serviceId:', serviceId);
        console.log('📌 tempDate:', tempDate);
        
        if (serviceId) {
            // ✅ Mettre à jour les données avec l'utilisateur connecté
            const savedData = sessionStorage.getItem('serviceBookingData');
            if (savedData) {
                try {
                    const parsedData = JSON.parse(savedData);
                    const userData = JSON.parse(localStorage.getItem('user') || '{}');
                    parsedData.guest_details = {
                        full_name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'Client',
                        email: userData.email || '',
                        phone: userData.phone || ''
                    };
                    sessionStorage.setItem('serviceBookingData', JSON.stringify(parsedData));
                    console.log('✅ Données mises à jour:', parsedData);
                } catch (e) {
                    console.error('❌ Erreur mise à jour données:', e);
                }
            }
            
            // ✅ Nettoyer les localStorage
            localStorage.removeItem('redirect_intent');
            localStorage.removeItem('redirect_service_id');
            localStorage.removeItem('temp_booking_date');
            
            const path = `/service-booking/${serviceId}`;
            console.log('📤 Redirection vers:', path);
            
            // ✅ Utiliser window.location.replace pour une redirection propre
            window.location.replace(path);
            return true;
        } else {
            console.warn('⚠️ Aucun serviceId trouvé pour la redirection');
            return false;
        }
    }
    
    // ✅ REDIRECTION VERS EXPERIENCE BOOKING
    if (redirectIntent === 'experience_booking') {
        console.log('🔄 Redirection vers réservation expérience');
        const experienceId = localStorage.getItem('redirect_experience_id');
        if (experienceId) {
            // ✅ Mettre à jour les données
            const savedData = sessionStorage.getItem('experienceBookingData');
            if (savedData) {
                try {
                    const parsedData = JSON.parse(savedData);
                    const userData = JSON.parse(localStorage.getItem('user') || '{}');
                    parsedData.guest_details = {
                        full_name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'Voyageur',
                        email: userData.email || '',
                        phone: userData.phone || ''
                    };
                    sessionStorage.setItem('experienceBookingData', JSON.stringify(parsedData));
                } catch (e) {}
            }
            
            const params = new URLSearchParams();
            const dates = localStorage.getItem('temp_booking_dates');
            const adults = localStorage.getItem('temp_booking_adults');
            const children = localStorage.getItem('temp_booking_children');
            const infants = localStorage.getItem('temp_booking_infants');
            const nights = localStorage.getItem('temp_booking_nights');
            
            if (dates) params.set('dates', dates);
            if (adults) params.set('adults', adults);
            if (children) params.set('children', children);
            if (infants) params.set('infants', infants);
            if (nights) params.set('nights', nights);
            
            localStorage.removeItem('redirect_intent');
            localStorage.removeItem('redirect_experience_id');
            localStorage.removeItem('temp_booking_dates');
            localStorage.removeItem('temp_booking_adults');
            localStorage.removeItem('temp_booking_children');
            localStorage.removeItem('temp_booking_infants');
            localStorage.removeItem('temp_booking_nights');
            
            const path = `/experience-booking/${experienceId}${params.toString() ? '?' + params.toString() : ''}`;
            console.log('📤 Redirection vers:', path);
            window.location.replace(path);
            return true;
        }
    }
    
    // ✅ REDIRECTION VERS BOOKING (logement)
    if (redirectIntent === 'booking' || redirectIntent === 'property_booking') {
        const propertyId = localStorage.getItem('redirect_property_id');
        if (propertyId) {
            // ✅ Mettre à jour les données
            const savedData = sessionStorage.getItem('bookingFormData');
            if (savedData) {
                try {
                    const parsedData = JSON.parse(savedData);
                    const userData = JSON.parse(localStorage.getItem('user') || '{}');
                    parsedData.guest_details = {
                        full_name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'Voyageur',
                        email: userData.email || '',
                        phone: userData.phone || ''
                    };
                    sessionStorage.setItem('bookingFormData', JSON.stringify(parsedData));
                } catch (e) {}
            }
            
            const params = new URLSearchParams();
            const checkIn = localStorage.getItem('temp_booking_check_in');
            const checkOut = localStorage.getItem('temp_booking_check_out');
            const guests = localStorage.getItem('temp_booking_guests');
            const nights = localStorage.getItem('temp_booking_nights');
            const adults = localStorage.getItem('temp_booking_adults');
            const children = localStorage.getItem('temp_booking_children');
            const babies = localStorage.getItem('temp_booking_babies');
            const pets = localStorage.getItem('temp_booking_pets');
            
            if (checkIn) params.set('check_in', checkIn);
            if (checkOut) params.set('check_out', checkOut);
            if (guests) params.set('guests', guests);
            if (nights) params.set('nights', nights);
            if (adults) params.set('adults', adults);
            if (children) params.set('children', children);
            if (babies) params.set('babies', babies);
            if (pets) params.set('pets', pets);
            
            localStorage.removeItem('redirect_intent');
            localStorage.removeItem('redirect_property_id');
            localStorage.removeItem('temp_booking_check_in');
            localStorage.removeItem('temp_booking_check_out');
            localStorage.removeItem('temp_booking_guests');
            localStorage.removeItem('temp_booking_nights');
            localStorage.removeItem('temp_booking_adults');
            localStorage.removeItem('temp_booking_children');
            localStorage.removeItem('temp_booking_babies');
            localStorage.removeItem('temp_booking_pets');
            
            const path = `/reserver/${propertyId}${params.toString() ? '?' + params.toString() : ''}`;
            console.log('📤 Redirection vers:', path);
            window.location.replace(path);
            return true;
        }
    }
    
    // ✅ REDIRECTION VERS MESSAGES (INQUIRY)
    // Dans AuthContext.tsx - handlePostLoginRedirect

// ✅ REDIRECTION VERS MESSAGES (INQUIRY) - POUR LES SERVICES
if (redirectAfterLogin === 'messages' && pendingInquiry) {
    console.log('🔄 Redirection vers messages après connexion');
    try {
        const inquiryData = JSON.parse(pendingInquiry);
        console.log('📦 Données inquiry:', inquiryData);
        
        const params = new URLSearchParams();
        
        // ✅ Vérifier si c'est une demande de service
        if (inquiryData.service_id) {
            params.set('service', inquiryData.service_id.toString());
            params.set('host_id', inquiryData.host_id?.toString() || '');
            params.set('host_name', inquiryData.host_name || 'Prestataire');
            params.set('service_name', inquiryData.service_title || 'Service');
            params.set('inquiry_type', 'service');
            if (inquiryData.date) params.set('date', inquiryData.date);
            if (inquiryData.location) params.set('location', inquiryData.location);
            if (inquiryData.price) params.set('price', inquiryData.price.toString());
            
            console.log('✅ Demande de service détectée, paramètres:', params.toString());
        } else {
            // ✅ Demande d'expérience (comportement existant)
            if (inquiryData.experience_id) params.set('experience', inquiryData.experience_id.toString());
            if (inquiryData.host_id) params.set('host_id', inquiryData.host_id.toString());
            if (inquiryData.host_name) params.set('host_name', inquiryData.host_name);
            if (inquiryData.experience_name) params.set('experience_name', inquiryData.experience_name);
            if (inquiryData.check_in) params.set('check_in', inquiryData.check_in);
            if (inquiryData.check_out) params.set('check_out', inquiryData.check_out);
            if (inquiryData.participants) params.set('participants', inquiryData.participants.toString());
            if (inquiryData.dates && inquiryData.dates.length > 0) {
                params.set('dates', inquiryData.dates.join(','));
            }
        }
        
        // ✅ Nettoyer les localStorage
        localStorage.removeItem('redirect_after_login');
        localStorage.removeItem('pendingInquiry');
        localStorage.removeItem('inquiry_type');
        localStorage.removeItem('inquiry_data');
        
        const path = `/messages/inquiry${params.toString() ? '?' + params.toString() : ''}`;
        console.log('📤 Redirection vers:', path);
        window.location.replace(path);
        return true;
    } catch (error) {
        console.error('❌ Erreur redirection inquiry:', error);
        localStorage.removeItem('redirect_after_login');
        localStorage.removeItem('pendingInquiry');
        localStorage.removeItem('inquiry_type');
        localStorage.removeItem('inquiry_data');
        return false;
    }
}
    
    console.log('ℹ️ Aucune redirection spécifique trouvée');
    return false;
}, []);


// Dans AuthContext.tsx - avant de faire login

function clearOldCookies() {
    // Supprimer les anciens cookies de session
    document.cookie = 'bluefin_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.bluefin-immo.com';
    document.cookie = 'bluefin_immo_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.bluefin-immo.com';
    document.cookie = 'remember_web_59ba36addc2b2f9401580f014c7f58ea4e30989d=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.bluefin-immo.com';
    console.log('🧹 Cookies legacy nettoyés');
}

// ============================================
// ✅ LOGIN - MODIFIÉ
// ============================================
// contexts/AuthContext.tsx - Fonction login complète

// contexts/AuthContext.tsx - Fonction login corrigée

const login = async (email: string, password: string, userType: string = 'traveler') => {
    setLoading(true);
    try {
        console.log(`🔐 Tentative de login ${userType}...`);

        clearOldCookies();

        await refreshCsrfToken();

        const normalizedUserType = userType === 'hote' ? 'hote' : userType === 'admin' ? 'admin' : 'traveler';

        const payload = {
            email,
            password,
            remember: true,
            user_type: normalizedUserType,
        };

        const loginEndpoints = ['/api/v1/auth/login'];
        let response: any = null;
        let lastError: any = null; const xsrfToken = getCookie('XSRF-TOKEN'); const csrfHeaders = xsrfToken ? { 'X-XSRF-TOKEN': decodeURIComponent(xsrfToken) } : {};

        for (const loginEndpoint of loginEndpoints) {
            try {
                console.log(`🔄 Essai endpoint login: ${loginEndpoint}`);
                response = await publicApi.post(loginEndpoint, payload, { headers: csrfHeaders });
                break;
            } catch (err: any) {
                lastError = err;
                const status = err?.response?.status;
                if (status === 404 || status === 405) {
                    continue;
                }
                throw err;
            }
        }

        if (!response && lastError) {
            throw lastError;
        }

        console.log('📊 Réponse login:', response.data);

        if (!response.data.success) {
            throw new Error(response.data.message || 'Erreur de connexion');
        }

        const userData = response.data.user || response.data;

        if (userData && userData.id) {
            const resolvedUserType = resolveUserType(userData.user_type, userType);

            if (userType === 'hote' && resolvedUserType !== 'hote') {
                throw new Error('Ce compte n\'est pas un compte hôte');
            }

            const finalUser: User = {
                ...userData,
                user_type: resolvedUserType,
                host_type: userData.host_type || null
            };
            localStorage.setItem('user', JSON.stringify(finalUser));
            localStorage.setItem('userType', resolvedUserType);
            setUser(finalUser);
            setIsAuthenticated(true);

            console.log('✅ Login réussi:', finalUser);
            toast.success('Connexion réussie !');
            window.dispatchEvent(new CustomEvent('authChange', { detail: { user: finalUser } }));

            const redirected = handlePostLoginRedirect();
            if (!redirected) {
                if (resolvedUserType === 'hote') {
                    window.location.href = '/hote/tableau-de-bord';
                } else {
                    window.location.href = '/';
                }
            }

            return response.data;
        } else {
            throw new Error('Données utilisateur invalides');
        }

    } catch (error: any) {
        console.error('❌ Erreur login:', error);
        const message = error.response?.data?.message || error.message || 'Erreur de connexion';
        toast.error(message);
        throw error;
    } finally {
        setLoading(false);
    }
};

    // ============================================
    // ✅ REGISTER - CORRIGÉ AVEC FALLBACK
    // ============================================
    const register = async (data: RegisterData, userType: string = 'traveler') => {
        setLoading(true);
        try {
            console.log(`📝 Tentative d'inscription ${userType}...`);

            await refreshCsrfToken();
            
            // ✅ Construire le payload
            const payload: any = {
                first_name: data.first_name,
                last_name: data.last_name,
                email: data.email,
                phone: data.phone,
                password: data.password,
                password_confirmation: data.password_confirmation,
                user_type: userType === 'hote' ? 'hote' : 'traveler',
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

            console.log('📦 Payload:', payload);

            // ✅ Construire dynamiquement la liste d'endpoints selon la baseURL pour éviter /api/api
            const base = publicApi.defaults.baseURL || '';
            const hasApiInBase = (() => { try { return new URL(base, window.location.origin).pathname.includes('/api'); } catch (e) { return false; } })();

            const candidatePaths = hasApiInBase
                ? ['/traveler/register', '/v1/auth/register', '/register', '/v1/traveler/register']
                : ['/api/traveler/register', '/api/v1/auth/register', '/api/register', '/api/auth/register'];

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

            const userData = response.data.user || response.data;
            
            if (userData && userData.id) {
                const resolvedUserType = resolveUserType(userData.user_type, userType);
                const finalUser: User = { 
                    ...userData, 
                    user_type: resolvedUserType,
                    host_type: userData.host_type || data.host_type || null
                };
                localStorage.setItem('user', JSON.stringify(finalUser));
                localStorage.setItem('userType', resolvedUserType);
                setUser(finalUser);
                setIsAuthenticated(true);
                
                console.log('✅ Inscription réussie:', finalUser);
                console.log('📋 Type hôte:', finalUser.host_type);
                toast.success(response.data.message || 'Inscription réussie !');
                window.dispatchEvent(new CustomEvent('authChange', { detail: { user: finalUser } }));
                return response.data;
            } else {
                throw new Error('Données utilisateur invalides');
            }

        } catch (error: any) {
            console.error('❌ Erreur inscription:', error);
            
            // ✅ Gérer les erreurs de validation Laravel
            if (error.response?.data?.errors) {
                const errors = error.response.data.errors;
                const messages = Object.values(errors).flat().join(', ');
                toast.error(messages);
                throw new Error(messages);
            }
            
            const message = error.response?.data?.message || error.message || 'Erreur lors de l\'inscription';
            toast.error(message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // ✅ LOGOUT - CORRIGÉ
    // ============================================
    const logout = async () => {
        setLoading(true);
        try {
            await publicApi.post('/api/v1/auth/logout');
            console.log('✅ Déconnexion API réussie');

        } catch (error) {
            console.warn('⚠️ Erreur déconnexion API:', error);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('userType');
            deleteCookie('laravel_session');
            deleteCookie('PHPSESSID');
            deleteCookie('XSRF-TOKEN');
            deleteCookie('bluefin_session');
            setUser(null);
            setIsAuthenticated(false);
            window.dispatchEvent(new CustomEvent('authChange', { detail: { user: null } }));
            setLoading(false);
            toast.success('Déconnexion réussie');
        }
    };

    // ============================================
    // ✅ RAFRAÎCHIR L'UTILISATEUR
    // ============================================
    const refreshUser = async (): Promise<User | null> => {
        try {
            if (!hasValidSession()) {
                console.warn('⚠️ Pas de session valide');
                return null;
            }

            const response = await publicApi.get('/api/user');
            const userData = response.data.user || response.data;

            if (userData && userData.id) {
                const userType = resolveUserType(userData.user_type, localStorage.getItem('userType'));
                const finalUser: User = { 
                    ...userData, 
                    user_type: userType,
                    host_type: userData.host_type || null
                };
                localStorage.setItem('user', JSON.stringify(finalUser));
                setUser(finalUser);
                setIsAuthenticated(true);
                return finalUser;
            }

            return null;
        } catch (error) {
            console.error('❌ Erreur refresh:', error);
            return null;
        }
    };

    // ============================================
    // ✅ UPDATE USER
    // ============================================
    const updateUser = (updatedUser: User) => {
        const userType = resolveUserType(updatedUser.user_type, localStorage.getItem('userType'));
        const finalUser: User = { ...updatedUser, user_type: userType };
        setUser(finalUser);
        localStorage.setItem('user', JSON.stringify(finalUser));
        localStorage.setItem('userType', userType);
        window.dispatchEvent(new CustomEvent('authChange', { detail: { user: finalUser } }));
    };

    // ============================================
    // ✅ SWITCH USER TYPE
    // ============================================
    const switchUserType = (type: string) => {
        const normalizedType = normalizeUserType(type);
        localStorage.setItem('userType', normalizedType);
        if (user) {
            const updatedUser = { ...user, user_type: normalizedType };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            window.dispatchEvent(new CustomEvent('authChange', { detail: { user: updatedUser } }));
        }
    };

    // ============================================
    // ✅ MÉTHODES POUR LES HÔTES - NOUVELLES
    // ============================================
    const isHost = () => {
        const type = resolveUserType(user?.user_type, localStorage.getItem('userType'));
        return type === 'hote';
    };

    const isTraveler = () => {
        const type = resolveUserType(user?.user_type, localStorage.getItem('userType'));
        return type === 'traveler';
    };

    const isAdmin = () => {
        const type = resolveUserType(user?.user_type, localStorage.getItem('userType'));
        return type === 'admin';
    };

    const getHostType = (): 'logement' | 'experience' | 'service' | null => {
        if (!isHost()) return null;
        return user?.host_type || null;
    };

    const getHostTypeLabel = (): string => {
        const types = {
            'logement': '🏠 Logement',
            'experience': '🎯 Expérience',
            'service': '🔧 Service'
        };
        const hostType = getHostType();
        return hostType ? types[hostType] : 'Non défini';
    };

    const value = {
        user,
        isAuthenticated,
        loading,
        login,
        register,
        logout,
        updateUser,
        refreshUser,
        switchUserType,
        hasValidSession,
        isHost,
        isTraveler,
        isAdmin,
        getHostType,
        getHostTypeLabel,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;

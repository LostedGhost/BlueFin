// services/api.ts - Version complète

import axios from 'axios';

axios.defaults.withCredentials = true;

const isDev = import.meta.env.DEV;
const API_DOMAIN = (import.meta.env.VITE_API_URL || 'https://api.bluefin-immo.com').replace(/\/$/, '');

// ✅ En développement on garde le proxy Vite pour Sanctum et le backend.
// En production, on pointe explicitement vers le domaine API Laravel pour éviter les rewrites du front.
const BASE_URL = isDev ? '' : API_DOMAIN;
const PUBLIC_API_URL = isDev ? '' : API_DOMAIN;
const V1_API_URL = isDev ? '/api/v1' : `${API_DOMAIN}/api/v1`;
const CSRF_URL = isDev ? '/sanctum/csrf-cookie' : `${API_DOMAIN}/sanctum/csrf-cookie`;

console.log('🌐 Mode:', isDev ? 'DÉVELOPPEMENT (proxy)' : 'PRODUCTION');
console.log('🌐 API BASE URL:', BASE_URL || 'Proxy Vite');
console.log('🌐 CSRF URL:', CSRF_URL);

// ============================================
// ✅ FONCTIONS COOKIES
// ============================================

export function getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        const rawCookie = parts.pop()?.split(';').shift();
        if (!rawCookie) return null;

        try {
            return decodeURIComponent(rawCookie);
        } catch {
            return rawCookie;
        }
    }
    return null;
}

export function deleteCookie(name: string): void {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

export function deleteAllCookies(): void {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
        deleteCookie(name.trim());
    }
}

// ============================================
// ✅ CONFIGURATION AXIOS
// ============================================

const baseConfig = {
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
    withCredentials: true,
    xsrfCookieName: 'XSRF-TOKEN',
    xsrfHeaderName: 'X-XSRF-TOKEN',
    timeout: 30000,
};

export const publicApi = axios.create({
    baseURL: PUBLIC_API_URL,
    ...baseConfig,
});

export const v1Api = axios.create({
    baseURL: V1_API_URL,
    ...baseConfig,
});

let csrfRefreshPromise: Promise<boolean> | null = null;

const isAuthBypassEndpoint = (_url?: string): boolean => {
    return false;
};

// ============================================
// ✅ INTERCEPTEURS
// ============================================

const addCsrfToken = async (config: any) => {
    const skipCsrf = Boolean(config?.skipCsrf) || isAuthBypassEndpoint(config?.url);
    if (skipCsrf) {
        return config;
    }

    const cookieToken = getCookie('XSRF-TOKEN');
    if (cookieToken) {
        return config;
    }

    const refreshed = await refreshCsrfToken();
    if (refreshed) return config;

    return config;
};

publicApi.interceptors.request.use(
    async (config) => {
        return await addCsrfToken(config);
    },
    (error) => Promise.reject(error)
);

v1Api.interceptors.request.use(
    async (config) => {
        return await addCsrfToken(config);
    },
    (error) => Promise.reject(error)
);

const attachCsrfRetryInterceptor = (api: typeof publicApi) => {
    api.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error?.config;
            const skipCsrf = Boolean(originalRequest?.skipCsrf) || isAuthBypassEndpoint(originalRequest?.url);
            if (skipCsrf) {
                return Promise.reject(error);
            }

            if (error?.response?.status === 419 && originalRequest && !originalRequest._retry) {
                originalRequest._retry = true;
                const refreshed = await refreshCsrfToken();
                if (!refreshed) {
                    return Promise.reject(error);
                }

                const token = getCookie('XSRF-TOKEN');
                if (!token) {
                    return Promise.reject(error);
                }

                return api.request(originalRequest);
            }

            return Promise.reject(error);
        }
    );
};

attachCsrfRetryInterceptor(publicApi);
attachCsrfRetryInterceptor(v1Api);

export function getCsrfToken(): string {
    const meta = document.querySelector('meta[name="csrf-token"]');
    if (meta) {
        return meta.getAttribute('content') || '';
    }
    return '';
}

// ============================================
// ✅ CSRF TOKEN
// ============================================

export async function refreshCsrfToken(): Promise<boolean> {
    console.log('🔄 [CSRF] Début refresh avec fetch...');

    try {
        const response = await fetch(CSRF_URL, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
        });

        console.log('✅ [CSRF] Status reçu:', response.status);
        console.log('📋 Headers:', Object.fromEntries(response.headers));

        if (!response.ok) {
            console.warn('⚠️ Réponse non OK');
        }

        const token = getCookie('XSRF-TOKEN');
        console.log('🔑 Token après fetch:', token ? 'OUI' : 'NON');

        return response.ok;
    } catch (error: any) {
        console.error('❌ [CSRF] Erreur fetch:', error.message || error);
        return false;
    }
}

// ============================================
// ✅ EXPORT PAR DÉFAUT
// ============================================

export default {
    publicApi,
    v1Api,
    getCookie,
    deleteCookie,
    deleteAllCookies,
    refreshCsrfToken,
};
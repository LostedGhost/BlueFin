import axios from 'axios';

const apiBaseUrl = (import.meta.env.VITE_API_URL || 'https://api.bluefin-immo.com').replace(/\/$/, '');
const csrfUrl = `${apiBaseUrl}/sanctum/csrf-cookie`;

axios.defaults.withCredentials = true;

const shouldBypassCsrf = () => false;

const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length !== 2) return null;

    const rawCookie = parts.pop()?.split(';').shift();
    if (!rawCookie) return null;

    try {
        return decodeURIComponent(rawCookie);
    } catch {
        return rawCookie;
    }
};

let csrfRefreshPromise = null;

export const refreshCsrfCookie = async () => {
    if (!csrfRefreshPromise) {
        csrfRefreshPromise = fetch(csrfUrl, {
            method: 'GET',
            credentials: 'include',
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
        })
            .then((response) => response.ok)
            .catch(() => false)
            .finally(() => {
                csrfRefreshPromise = null;
            });
    }

    return csrfRefreshPromise;
};

const api = axios.create({
    baseURL: apiBaseUrl,
    withCredentials: true,
    xsrfCookieName: 'XSRF-TOKEN',
    xsrfHeaderName: 'X-XSRF-TOKEN',
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
});

api.interceptors.request.use(async (config) => {
    if (config?.skipCsrf || shouldBypassCsrf(config?.url || '')) {
        return config;
    }

    const token = getCookie('XSRF-TOKEN');
    if (!token) {
        await refreshCsrfCookie();
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error?.config;

        if (!originalRequest || originalRequest._retry) {
            return Promise.reject(error);
        }

        if (originalRequest?.skipCsrf || shouldBypassCsrf(originalRequest?.url || '')) {
            return Promise.reject(error);
        }

        if (error?.response?.status === 419) {
            originalRequest._retry = true;
            const refreshed = await refreshCsrfCookie();
            if (!refreshed) {
                return Promise.reject(error);
            }

            const token = getCookie('XSRF-TOKEN');
            if (!token) return Promise.reject(error);

            return api.request(originalRequest);
        }

        return Promise.reject(error);
    }
);

export default api;





// utils/authCheck.ts

import { getCookie } from '../services/api';

export function hasValidSession(): boolean {
    return !!(getCookie('laravel_session') || getCookie('PHPSESSID'));
}

export function getCsrfTokenFromCookie(): string | null {
    const token = getCookie('XSRF-TOKEN');
    return token ? decodeURIComponent(token) : null;
}

export function isFullyAuthenticated(user: any): boolean {
    return !!(user && hasValidSession());
}

export function clearAuthData(): void {
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
    localStorage.removeItem('token');
    document.cookie.split(';').forEach(cookie => {
        document.cookie = cookie
            .replace(/^ +/, '')
            .replace(/=.*/, `=; expires=${new Date(0).toUTCString()}; path=/`);
    });
}
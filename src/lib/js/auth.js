import { browser } from '$app/environment';

let authToken = null;

if (browser) {
    window.addEventListener('storage', () => {
        authToken.set(localStorage.getItem('authToken'));
    });
}

/**
 * Gets the current auth token from the `authToken` store, or from
 * `localStorage` if the store is `null` and in a browser environment.
 *
 * @returns {string|null} The auth token, or `null` if no token is set.
 */
export function getAuthToken() {
    return authToken === null ? browser ? localStorage.getItem('authToken') : null : authToken;
}

/**
 * Logs the user out by removing the auth token from storage and redirecting
 * them to the login page.
 *
 * @returns {void}
 */
export async function logout() {
    const response = await fetch('http://127.0.0.1:3000/api/user/logout', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            'Content-Type': 'application/json'
        }
    });

    if (response.status === 200) {
        if (browser) {
            localStorage.removeItem('authToken');
            window.location.href = '/login';
        }
    }
}
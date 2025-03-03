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
 * Set the auth token, both in the `authToken` store and in
 * `localStorage` if in a browser environment.
 *
 * @param {string} [token] - The token to set, or `undefined` to remove the
 * token from storage.
 */
export function setAuthToken(token) {
    if (browser) {
        if (token) {
            localStorage.setItem('authToken', token);
        } else {
            localStorage.removeItem('authToken');
        }
    }

    authToken = token;
}

/**
 * Logs the user out by removing the auth token from storage and redirecting
 * them to the login page.
 *
 * @returns {void}
 */
export function logout() {
    if (browser) {
        localStorage.removeItem('authToken');
        window.location.href = '/login';
    }
}
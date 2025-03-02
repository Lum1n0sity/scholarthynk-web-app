import { browser } from '$app/environment';
// import { writable } from 'svelte/store';

const authToken = null;

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
    authToken.set(token);
}
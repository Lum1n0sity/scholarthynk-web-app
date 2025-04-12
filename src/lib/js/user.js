import {logout} from "$lib/js/auth.js";

let newNotification = null;

export function newNotificationU(callback) {
    if (callback) {
        newNotification = callback;
    }
}

/**
 * Fetches the user's data from the server.
 *
 * @param {string} authToken - The user's authentication token.
 * @param {boolean} testing A flag to indicate if the function is being called for testing purposes.
 * @returns {Promise<Object>} A promise that resolves to an object containing
 * the user's `username` and `email`, or an empty object if the request fails.
 */
export async function getUserData(authToken, testing = false) {
    if (authToken) {
        const response = await fetch('http://127.0.0.1:3000/api/user/data', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 200) {
            const data = await response.json();
            return {username: data.user.name, email: data.user.email, role: data.user.role};
        } else if (response.status === 401) {
            if (!testing) {
                const err = await response.json();
                newNotification("error", "Unauthorized", err.error);
                setTimeout(() => {logout();}, 5000);
                return {};
            }

            throw new Error("Error while loading user data: Unauthorized");
        } else if (response.status === 404) {
            if (!testing) {
                const err = await response.json();
                newNotification("error", "Unauthorized", err.error);
                setTimeout(() => {logout();}, 5000);
                return {};
            }

            throw new Error("Error while loading user data: User not found");
        } else if (response.status === 500) {
            if (!testing) {
                const err = await response.json();
                newNotification("error", "Error while loading user data", "You are going to be logged out. Please try again.");
                setTimeout(() => {logout();}, 5000);
                return {};
            }

            throw new Error("Error while loading user data: Internal Server Error");
        } else {
            newNotification("error", "Unable to load user data", "There was an unexpected error. Please try again.");
            setTimeout(() => {logout();}, 5000);
            return {};
        }
    }
}

/**
 * Fetches the user's profile picture from the server.
 * @param {string} authToken the user's authentication token
 * @param {boolean} testing A flag to indicate if the function is being called for testing purposes.
 * @returns {Promise<string>} a URL pointing to the user's profile picture, or null if the request fails
 */
export async function getProfilePic(authToken, testing = false) {
    if (authToken) {
        const response = await fetch('http://127.0.0.1:3000/api/profilePic/get', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 200) {
            const imageBlob = await response.blob();
            return URL.createObjectURL(imageBlob);
        } else if (response.status === 401) {
            if (!testing) {
                const err = await response.json();
                newNotification("error", "Unauthorized", err.error);
                setTimeout(() => {logout();}, 5000);
                return null;
            }

            throw new Error("Error while loading profile picture: Unauthorized");
        } else {
            newNotification("error", "Unable to load profile picture", "There was an unexpected error while loading your profile picture. Please try again.");
            return null;
        }
    }
}

/**
 * Toggles the `displayUserCard` variable, which is used to show
 * or hide the user card containing the user's profile picture,
 * name, and email.
 *
 * @returns {boolean} The new value of `displayUserCard`.
 */
export function displayUserCardHandler(displayUserCard) {
    return displayUserCard === false ? true : false;
}

/**
 * Hashes a password using the SHA-256 algorithm.
 *
 * @param {string} password - The password to hash.
 * @returns {Promise<string>} A promise that resolves to the hashed password in hexadecimal format.
 */
export async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}
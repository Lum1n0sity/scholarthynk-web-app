/**
 * Fetches the user's data from the server.
 *
 * @param {string} authToken - The user's authentication token.
 * @returns {Promise<Object>} A promise that resolves to an object containing
 * the user's `username` and `email`, or an empty object if the request fails.
 */
export async function getUserData(authToken) {
    if (authToken) {
        const response = await fetch('http://127.0.0.1:3000/api/get-user-data', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 200) {
            const data = await response.json();
            return {username: data.user.name, email: data.user.email};
        } else {
            // showErrorMsg('Unable to fetch user data.');
            // Add error log update
            return {};
        }
    }
}

/**
 * Fetches the user's profile picture from the server.
 * @param {string} authToken the user's authentication token
 * @returns {Promise<string>} a URL pointing to the user's profile picture, or null if the request fails
 */
export async function getProfilePic(authToken) {
    if (authToken) {
        const response = await fetch('http://127.0.0.1:3000/api/get-profile-pic', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 200) {
            const imageBlob = await response.blob();
            return URL.createObjectURL(imageBlob);

        } else {
            // showErrorMsg('Unable to fetch your profile picture.');
            // Add error log update
            return null;
        }
    } else {
        window.location.href = '/login';
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
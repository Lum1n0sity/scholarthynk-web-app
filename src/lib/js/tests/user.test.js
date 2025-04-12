import nock from 'nock';
import {describe, it, expect, afterEach, vi, beforeEach} from 'vitest';
import {getUserData, getProfilePic, hashPassword} from "$lib/js/user.js";
import crypto from 'crypto';

/**
 * Computes the SHA-256 hash of a given password and returns it as a hexadecimal
 * string.
 *
 * @param {string} password - The password to hash.
 * @returns {string} The SHA-256 hash of the password as a hexadecimal string.
 */
function computeSha256Hex(password) {
    return crypto.createHash('sha256').update(password, 'utf8').digest('hex');
}

describe('getUserData', () => {
    afterEach(() => {
        nock.cleanAll();
    });

    it('should make a successful API call and return user data', async () => {
        const authToken = 'auth-token';

        nock('http://127.0.0.1:3000')
            .get('/api/user/data')
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader('Content-Type', 'application/json')
            .reply(200, {user: {name: 'John Doe', email: 'email@example.com', role: 'user'}});

        const result = await getUserData(authToken, true);
        expect(result).toEqual({username: 'John Doe', email: 'email@example.com', role: 'user'});
    });

    it('should handle API error with 404 status code', async () => {
        const authToken = 'auth-token';

        nock('http://127.0.0.1:3000')
            .get('/api/user/data')
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader('Content-Type', 'application/json')
            .reply(404, {error: "User not found"});

        expect(getUserData(authToken, true)).rejects.toThrow("Error while loading user data: User not found");
    });

    it('should handle API error with 401 status code', async () => {
        const authToken = 'auth-token';

        nock('http://127.0.0.1:3000')
            .get('/api/user/data')
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader('Content-Type', 'application/json')
            .reply(401, {error: "Unauthorized"});

        expect(getUserData(authToken, true)).rejects.toThrow("Error while loading user data: Unauthorized");
    });

    it('should handle API error with 500 status code', async () => {
        const authToken = 'auth-token';

        nock('http://127.0.0.1:3000')
            .get('/api/user/data')
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader('Content-Type', 'application/json')
            .reply(500, {error: "Internal Server Error"});

        expect(getUserData(authToken, true)).rejects.toThrow("Error while loading user data: Internal Server Error");
    });
});

describe('getProfilePic', () => {
    let createObjectURLSpy;

    beforeEach(() => {
        globalThis.URL.createObjectURL = vi.fn(() => "blob:http://localhost/fake-image-url"); // Mock it manually
    });

    afterEach(() => {
        vi.restoreAllMocks();
        nock.cleanAll();
    });

    it('should return a URL when response.status is 200', async () => {
        nock('http://127.0.0.1:3000')
            .get('/api/profilePic/get')
            .reply(200, new Blob(["fake image"], { type: "image/png" }), { 'Content-Type': 'image/png' });

        createObjectURLSpy = vi.spyOn(globalThis.URL, 'createObjectURL');

        const result = await getProfilePic("auth-token", true);

        expect(result).toBe("blob:http://localhost/fake-image-url");
        expect(createObjectURLSpy).toHaveBeenCalledWith(expect.anything());
    });

    it('should handle API error with 401 status code', async () => {
        nock('http://127.0.0.1:3000')
            .get('/api/profilePic/get')
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader('Content-Type', 'application/json')
            .reply(401, {error: "Unauthorized"});

        expect(getProfilePic("auth-token", true)).rejects.toThrow("Error while loading profile picture: Unauthorized");
    });
});

describe('hashPassword', () => {
    it('should return the correct SHA-256 hash', async () => {
        const password = 'test123';
        const expectedHash = computeSha256Hex(password); // Dynamically compute expected hash

        const result = await hashPassword(password);

        expect(result).toBe(expectedHash);
    });

    it('should produce different hashes for different inputs', async () => {
        const hash1 = await hashPassword('password1');
        const hash2 = await hashPassword('password2');

        expect(hash1).not.toBe(hash2);
    });

    it('should produce the same hash for the same input', async () => {
        const password = 'securepassword';
        const hash1 = await hashPassword(password);
        const hash2 = await hashPassword(password);

        expect(hash1).toBe(hash2);
    });
});
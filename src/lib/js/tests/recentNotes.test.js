import nock from 'nock';
import {getRecentNotes} from '$lib/js/home/notes';
import {describe, it, expect, afterEach, vi} from 'vitest';

describe('getRecentNotes', () => {
    afterEach(() => {
        nock.cleanAll();
    });

    it('should return notes when API call is successful', async () => {
        const mockNotes = [
            { id: 2, "lastEdited": "2025-03-08T20:54:12.880Z" },
            { id: 1, "lastEdited": "2025-03-07T20:54:12.880Z" },
            { id: 3, "lastEdited": "2025-03-09T20:54:12.880Z" }
        ];

        nock('http://127.0.0.1:3000')
            .get('/api/note/get/notes')
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader('Content-Type', 'application/json')
            .reply(200, { notes: mockNotes });

        const expectedNotes = mockNotes.sort((a, b) => new Date(b.lastEdited) - new Date(a.lastEdited)).slice(0, 6);

        const notes = await getRecentNotes('auth-token', true);
        expect(notes).toEqual(expectedNotes);
    });

    it('should handle API error with 401 status code', async () => {
        const mockNotes = [
            { id: 2, "lastEdited": "2025-03-08T20:54:12.880Z" },
            { id: 1, "lastEdited": "2025-03-07T20:54:12.880Z" },
            { id: 3, "lastEdited": "2025-03-09T20:54:12.880Z" }
        ];

        nock('http://127.0.0.1:3000')
            .get('/api/note/get/notes')
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader('Content-Type', 'application/json')
            .reply(401, { error: "Unauthorized" });

        await expect(getRecentNotes('auth-token', true)).rejects.toThrow('Error while loading recent notes: Unauthorized');
    });

    it('should handle API error with 500 status code', async () => {
        const mockNotes = [
            { id: 2, "lastEdited": "2025-03-08T20:54:12.880Z" },
            { id: 1, "lastEdited": "2025-03-07T20:54:12.880Z" },
            { id: 3, "lastEdited": "2025-03-09T20:54:12.880Z" }
        ];

        nock('http://127.0.0.1:3000')
            .get('/api/note/get/notes')
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader('Content-Type', 'application/json')
            .reply(500, { error: "Internal Server Error" });

        await expect(getRecentNotes('auth-token', true)).rejects.toThrow('Error while loading recent notes: Internal Server Error');
    });
});
import nock from 'nock';
import {describe, it, expect, afterEach, vi} from 'vitest';
import {getNotePath} from '$lib/js/notes/noteDisplayManager.js';

describe('getNotePath', () => {
    afterEach(() => {
        nock.cleanAll();
    });

    it('should return the note path ["root"] when parent is null', async () => {
        const notePath = await getNotePath(null, 'noteId', true);
        expect(notePath).toEqual(['root']);
    });

    it('should make a successful API call and return the note path', async () => {
        const parent = 'parentFolder';
        const noteId = 'noteId';

        nock('http://127.0.0.1:3000')
            .post('/api/note/get/notePath')
            .matchHeader('Content-Type', 'application/json')
            .reply(200, {path: ['root', 'parentFolder', 'noteId']});

        const notePath = await getNotePath(parent, noteId, true);
        expect(notePath).toEqual(['root', 'parentFolder', 'noteId']);
    });

    it('should handle API error with status code 401', async () => {
        const parent = 'parentFolder';
        const noteId = 'noteId';

        nock('http://127.0.0.1:3000')
            .post('/api/note/get/notePath')
            .matchHeader('Content-Type', 'application/json')
            .reply(401, {error: "Unauthorized"});

        expect(getNotePath(parent, noteId, true)).rejects.toThrow("Error while getting note path: Unauthorized");
    });

    it('should handle API error with status code 500', async () => {
        const parent = 'parentFolder';
        const noteId = 'noteId';

        nock('http://127.0.0.1:3000')
            .post('/api/note/get/notePath')
            .matchHeader('Content-Type', 'application/json')
            .reply(500, {error: "Internal Server Error"});

        expect(getNotePath(parent, noteId, true)).rejects.toThrow("Error while getting note path: Internal Server Error");
    });
});
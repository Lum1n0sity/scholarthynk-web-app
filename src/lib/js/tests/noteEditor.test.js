import nock from 'nock';
import {describe, it, expect, afterEach, vi} from 'vitest';
import {calculateNoteStatistics, updateNote, getNote} from "$lib/js/notes/noteEditor.js";

describe('calculateNoteStatistics', () => {
    it('should calculate word count and character count correctly', () => {
        const content = 'Hello, world! This is a test note.';
        const statistics = calculateNoteStatistics(content);
        expect(statistics.wordCount).toBe(7);
        expect(statistics.characterCount).toBe(34);
    });
});

describe('updateNote', () => {
    it('should make a successful API call and return the correct note statistics', async () => {
        const authToken = 'auth-token';
        const noteTitle = 'Test Note';
        const originalTitle = 'Original Note';
        const noteContent = 'Updated note content';
        const path = ["root", "folder1"];

        nock('http://127.0.0.1:3000')
            .put('/api/note/update', {title: noteTitle, oldTitle: originalTitle, content: noteContent, path: path})
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader('Content-Type', 'application/json')
            .reply(200);

        const statistics = await updateNote(authToken, noteTitle, originalTitle, noteContent, path, true);
        expect(statistics.wordCount).toBe(3);
        expect(statistics.characterCount).toBe(20);
    });

    it('should handle API error with status code 400', async () => {
        const authToken = 'auth-token';
        const noteTitle = 'Test Note';
        const originalTitle = 'Original Note';
        const noteContent = 'Updated note content';
        const path = ["root", "folder1"];

        nock('http://127.0.0.1:3000')
            .put('/api/note/update', {title: noteTitle, oldTitle: originalTitle, content: noteContent, path: path})
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader('Content-Type', 'application/json')
            .reply(400, {error: "Error while renaming note"});

        expect(updateNote(authToken, noteTitle, originalTitle, noteContent, path, true)).rejects.toThrow("Error while renaming note: Invalid input");
    });

    it('should handle API error with status code 404', async () => {
        const authToken = 'auth-token';
        const noteTitle = 'Test Note';
        const originalTitle = 'Original Note';
        const noteContent = 'Updated note content';
        const path = ["root", "folder1"];

        nock('http://127.0.0.1:3000')
            .put('/api/note/update', {title: noteTitle, oldTitle: originalTitle, content: noteContent, path: path})
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader('Content-Type', 'application/json')
            .reply(404, {error: "Note not found"});

        expect(updateNote(authToken, noteTitle, originalTitle, noteContent, path, true)).rejects.toThrow("Error while renaming note: Note not found");
    });

    it('should handle API error with status code 401', async () => {
        const authToken = 'auth-token';
        const noteTitle = 'Test Note';
        const originalTitle = 'Original Note';
        const noteContent = 'Updated note content';
        const path = ["root", "folder1"];

        nock('http://127.0.0.1:3000')
            .put('/api/note/update', {title: noteTitle, oldTitle: originalTitle, content: noteContent, path: path})
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader('Content-Type', 'application/json')
            .reply(401, {error: "Unauthorized"});

        expect(updateNote(authToken, noteTitle, originalTitle, noteContent, path, true)).rejects.toThrow("Error while renaming note: Unauthorized");
    });

    it('should handle API error with status code 500', async () => {
        const authToken = 'auth-token';
        const noteTitle = 'Test Note';
        const originalTitle = 'Original Note';
        const noteContent = 'Updated note content';
        const path = ["root", "folder1"];

        nock('http://127.0.0.1:3000')
            .put('/api/note/update', {title: noteTitle, oldTitle: originalTitle, content: noteContent, path: path})
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader('Content-Type', 'application/json')
            .reply(500, {error: "Internal Server Error"});

        expect(updateNote(authToken, noteTitle, originalTitle, noteContent, path, true)).rejects.toThrow("Error while renaming note: Internal Server Error");
    });
});

describe('getNote', () => {
   it('should make a successful API call and return the note title, content, and statistics', async () => {
       const authToken = 'auth-token';
       const path = ["root", "folder1"];
       const title = 'Test Note';

       nock('http://127.0.0.1:3000')
           .post('/api/note/get/note', {title: title, path: path})
           .matchHeader('Authorization', 'Bearer auth-token')
           .matchHeader('Content-Type', 'application/json')
           .reply(200, {note: {name: 'Test Note', fileContent: 'This is a test note.'}});

       const note = await getNote(authToken, path, title, false, true);
       expect(note.noteTitle).toBe('Test Note');
       expect(note.noteContent).toBe('This is a test note.');
       expect(note.statistics.wordCount).toBe(5);
       expect(note.statistics.characterCount).toBe(20);
   });

   it('should handle API error with status code 404', async () => {
       const authToken = 'auth-token';
       const path = ["root", "folder1"];
       const title = 'Test Note';

       nock('http://127.0.0.1:3000')
           .post('/api/note/get/note', {title: title, path: path})
           .matchHeader('Authorization', 'Bearer auth-token')
           .matchHeader('Content-Type', 'application/json')
           .reply(404, {error: "Note not found"});

       expect(getNote(authToken, path, title, false, true)).rejects.toThrow("Error while loading note: Note not found");
   });

    it('should handle API error with status code 401', async () => {
        const authToken = 'auth-token';
        const path = ["root", "folder1"];
        const title = 'Test Note';

        nock('http://127.0.0.1:3000')
            .post('/api/note/get/note', {title: title, path: path})
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader('Content-Type', 'application/json')
            .reply(401, {error: "Unauthorized"});

        expect(getNote(authToken, path, title, false, true)).rejects.toThrow("Error while loading note: Unauthorized");
    });

    it('should handle API error with status code 500', async () => {
        const authToken = 'auth-token';
        const path = ["root", "folder1"];
        const title = 'Test Note';

        nock('http://127.0.0.1:3000')
            .post('/api/note/get/note', {title: title, path: path})
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader('Content-Type', 'application/json')
            .reply(500, {error: "Internal Server Error"});

        expect(getNote(authToken, path, title, false, true)).rejects.toThrow("Error while loading note: Internal Server Error");
    });
});
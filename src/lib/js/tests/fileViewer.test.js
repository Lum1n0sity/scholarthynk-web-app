import nock from 'nock';
import {describe, it, expect, afterEach, vi} from 'vitest';
import {getFVItems, deleteFolder, createFolder, createNote, renameFVItem} from "$lib/js/notes/fileViewer.js";

describe('getFVItems', () => {
    it('should make a successful API request and return the items', async () => {
        const authToken = 'auth-token';
        const path = ["root", "folder1"];
        const folder = "folder1";

        nock('http://127.0.0.1:3000')
            .post('/api/fileViewer/get', {folder: folder, path: path})
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader('Content-Type', 'application/json')
            .reply(200, {folders: ["folder1", "folder2"], files: ["file1", "file2"]});

        const result = await getFVItems(folder, path, authToken, true);
        expect(result).toEqual({folders: ["folder1", "folder2"], files: ["file1", "file2"]});
    });

    it('should handle API error with 401 status code', async () => {
        const authToken = 'auth-token';
        const path = ["root", "folder1"];
        const folder = "folder1";

        nock('http://127.0.0.1:3000')
            .post('/api/fileViewer/get', {folder: folder, path: path})
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader('Content-Type', 'application/json')
            .reply(401, {error: "Unauthorized"});

        expect(getFVItems(folder, path, authToken, true)).rejects.toThrow("Error while loading items: Unauthorized");
    });

    it('should handle API error with 500 status code', async () => {
        const authToken = 'auth-token';
        const path = ["root", "folder1"];
        const folder = "folder1";

        nock('http://127.0.0.1:3000')
            .post('/api/fileViewer/get', {folder: folder, path: path})
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader('Content-Type', 'application/json')
            .reply(500, {error: "Internal Server Error"});

        expect(getFVItems(folder, path, authToken, true)).rejects.toThrow("Error while loading items: Internal Server Error");
    });
});

describe('deleteFolder', () => {
    it('should make a successful API request and return true', async () => {
        const authToken = 'auth-token';
        const path = ["root", "folder1"];
        const folder = "folder1";

        nock('http://127.0.0.1:3000')
            .delete('/api/fileViewer/delete', {folder: folder, path: path})
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader('Content-Type', 'application/json')
            .reply(200);

        const result = await deleteFolder(folder, path, authToken, true);
        expect(result).toBe(true);
    });

    it('should handle API error with status code 400', async () => {
        const authToken = 'auth-token';
        const path = ["root", "folder1"];
        const folder = "folder1";

        nock('http://127.0.0.1:3000')
            .delete('/api/fileViewer/delete', {folder: folder, path: path})
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader('Content-Type', 'application/json')
            .reply(400, {error: "Invalid item"});

        expect(deleteFolder(folder, path, authToken, true)).rejects.toThrow("Error while deleting item: Invalid item");
    });

    it('should handle API error with status code 404', async () => {
        const authToken = 'auth-token';
        const path = ["root", "folder1"];
        const folder = "folder1";

        nock('http://127.0.0.1:3000')
            .delete('/api/fileViewer/delete', {folder: folder, path: path})
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader('Content-Type', 'application/json')
            .reply(404, {error: "Item not found"});

        expect(deleteFolder(folder, path, authToken, true)).rejects.toThrow("Error while deleting item: Item not found");
    });

    it('should handle API error with status code 401', async () => {
        const authToken = 'auth-token';
        const path = ["root", "folder1"];
        const folder = "folder1";

        nock('http://127.0.0.1:3000')
            .delete('/api/fileViewer/delete', {folder: folder, path: path})
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader('Content-Type', 'application/json')
            .reply(401, {error: "Unauthorized"});

        expect(deleteFolder(folder, path, authToken, true)).rejects.toThrow("Error while deleting item: Unauthorized");
    });

    it('should handle API error with status code 500', async () => {
        const authToken = 'auth-token';
        const path = ["root", "folder1"];
        const folder = "folder1";

        nock('http://127.0.0.1:3000')
            .delete('/api/fileViewer/delete', {folder: folder, path: path})
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader('Content-Type', 'application/json')
            .reply(500, {error: "Internal Server Error"});

        expect(deleteFolder(folder, path, authToken, true)).rejects.toThrow("Error while deleting item: Internal Server Error");
    });
});

describe('createFolder', () => {
    it('should make a successful API request and return true', async () => {
        const authToken = 'auth-token';
        const path = ["root", "folder1"];
        const folder = "folder1";

        nock('http://127.0.0.1:3000')
            .post('/api/fileViewer/create', {parentPath: path, folderName: folder})
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader('Content-Type', 'application/json')
            .reply(200);

        const result = await createFolder(folder, path, authToken, true);
        expect(result).toBe(true);
    });

    it('should handle API error with status code 400', async () => {
        const authToken = 'auth-token';
        const path = ["root", "folder1"];
        const folder = "folder1";

        nock('http://127.0.0.1:3000')
            .post('/api/fileViewer/create', {parentPath: path, folderName: folder})
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader('Content-Type', 'application/json')
            .reply(400, {error: "Invalid input"});

        expect(createFolder(folder, path, authToken, true)).rejects.toThrow("Error while creating new folder: Invalid input");
    });

    it('should handle API error with status code 409', async () => {
        const authToken = 'auth-token';
        const path = ["root", "folder1"];
        const folder = "folder1";

        nock('http://127.0.0.1:3000')
            .post('/api/fileViewer/create', {parentPath: path, folderName: folder})
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader('Content-Type', 'application/json')
            .reply(409, {error: "Folder already exists"});

        expect(createFolder(folder, path, authToken, true)).rejects.toThrow("Error while creating new folder: Folder already exists");
    });

    it('should handle API error with status code 401', async () => {
        const authToken = 'auth-token';
        const path = ["root", "folder1"];
        const folder = "folder1";

        nock('http://127.0.0.1:3000')
            .post('/api/fileViewer/create', {parentPath: path, folderName: folder})
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader('Content-Type', 'application/json')
            .reply(401, {error: "Unauthorized"});

        expect(createFolder(folder, path, authToken, true)).rejects.toThrow("Error while creating new folder: Unauthorized");
    });

    it('should handle API error with status code 500', async () => {
        const authToken = 'auth-token';
        const path = ["root", "folder1"];
        const folder = "folder1";

        nock('http://127.0.0.1:3000')
            .post('/api/fileViewer/create', {parentPath: path, folderName: folder})
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader('Content-Type', 'application/json')
            .reply(500, {error: "Internal Server Error"});

        expect(createFolder(folder, path, authToken, true)).rejects.toThrow("Error while creating new folder: Internal Server Error");
    });
});

describe('createNote', () => {
    it('should make a successful API request and return true', async () => {
        const authToken = 'auth-token';
        const path = ["root", "folder1"];

        nock('http://127.0.0.1:3000')
            .post('/api/note/new', {path: path})
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader('Content-Type', 'application/json')
            .reply(200);

        const result = await createNote(path, authToken, true);
        expect(result).toBe(true);
    });

    it('should handle API error with status code 400', async () => {
        const authToken = 'auth-token';
        const path = ["root", "folder1"];

        nock('http://127.0.0.1:3000')
            .post('/api/note/new', {path: path})
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader('Content-Type', 'application/json')
            .reply(400, {error: "Invalid input"});

        expect(createNote(path, authToken, true)).rejects.toThrow("Error while creating new note: Invalid input");
    });

    it('should handle API error with status code 401', async () => {
        const authToken = 'auth-token';
        const path = ["root", "folder1"];

        nock('http://127.0.0.1:3000')
            .post('/api/note/new', {path: path})
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader('Content-Type', 'application/json')
            .reply(401, {error: "Unauthorized"});

        expect(createNote(path, authToken, true)).rejects.toThrow("Error while creating new note: Unauthorized");
    });

    it('should handle API error with status code 500', async () => {
        const authToken = 'auth-token';
        const path = ["root", "folder1"];

        nock('http://127.0.0.1:3000')
            .post('/api/note/new', {path: path})
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader('Content-Type', 'application/json')
            .reply(500, {error: "Internal Server Error"});

        expect(createNote(path, authToken, true)).rejects.toThrow("Error while creating new note: Internal Server Error");
    });
});

describe('renameFVItem', () => {
    it('should return false if new name is empty', async () => {
        const authToken = 'auth-token';
        const path = ["root", "folder1"];
        const oldName = "folder1";
        const newName = "";

        const result = await renameFVItem(newName, oldName, path, authToken, true);
        expect(result).toBe(false);
    });

    it('should return false if new name is the same as the old name', async () => {
        const authToken = 'auth-token';
        const path = ["root", "folder1"];
        const oldName = "folder1";
        const newName = "folder1";

        const result = await renameFVItem(newName, oldName, path, authToken, true);
        expect(result).toBe(false);
    });

    it('should make a successful API request and return true', async () => {
        const authToken = 'auth-token';
        const path = ["root", "folder1"];
        const oldName = "folder1";
        const newName = "new folder name";

        nock('http://127.0.0.1:3000')
            .put('/api/fileViewer/rename', {path: path, oldName: oldName, newName: newName})
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader('Content-Type', 'application/json')
            .reply(200);

        const result = await renameFVItem(newName, oldName, path, authToken, true);
        expect(result).toBe(true);
    });

    it('should handle API error with status code 400', async () => {
        const authToken = 'auth-token';
        const path = ["root", "folder1"];
        const oldName = "folder1";
        const newName = "new folder name";

        nock('http://127.0.0.1:3000')
            .put('/api/fileViewer/rename', {path: path, oldName: oldName, newName: newName})
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader('Content-Type', 'application/json')
            .reply(400, {error: "Invalid name"});

        expect(renameFVItem(newName, oldName, path, authToken, true)).rejects.toThrow("Error while renaming item: Invalid name");
    });

    it('should handle API error with status code 404', async () => {
        const authToken = 'auth-token';
        const path = ["root", "folder1"];
        const oldName = "folder1";
        const newName = "new folder name";

        nock('http://127.0.0.1:3000')
            .put('/api/fileViewer/rename', {path: path, oldName: oldName, newName: newName})
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader('Content-Type', 'application/json')
            .reply(404, {error: "Item not found"});

        expect(renameFVItem(newName, oldName, path, authToken, true)).rejects.toThrow("Error while renaming item: Item not found");
    });

    it('should handle API error with status code 401', async () => {
        const authToken = 'auth-token';
        const path = ["root", "folder1"];
        const oldName = "folder1";
        const newName = "new folder name";

        nock('http://127.0.0.1:3000')
            .put('/api/fileViewer/rename', {path: path, oldName: oldName, newName: newName})
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader('Content-Type', 'application/json')
            .reply(401, {error: "Unauthorized"});

        expect(renameFVItem(newName, oldName, path, authToken, true)).rejects.toThrow("Error while renaming item: Unauthorized");
    });

    it('should handle API error with status code 500', async () => {
        const authToken = 'auth-token';
        const path = ["root", "folder1"];
        const oldName = "folder1";
        const newName = "new folder name";

        nock('http://127.0.0.1:3000')
            .put('/api/fileViewer/rename', {path: path, oldName: oldName, newName: newName})
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader('Content-Type', 'application/json')
            .reply(500, {error: "Internal Server Error"});

        expect(renameFVItem(newName, oldName, path, authToken, true)).rejects.toThrow("Error while renaming item: Internal Server Error");
    });
});
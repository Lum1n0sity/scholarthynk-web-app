import {logout} from "$lib/js/auth.js";
import {calculateNoteStatistics} from "$lib/js/notes/noteEditor.js";
import { writable } from 'svelte/store';
import {goto} from "$app/navigation";

let newNotification = null;

export let openNoteExternal = writable(false);
export let noteTitleExternal = writable("");
export let noteContentExternal = writable("");
export let noteWordCountExternal = writable(null);
export let noteCharacterCountExternal = writable(null);
export let notePathExternal = writable(["root"]);

export let createNoteExternal = writable(false);

/**
 * Sets a new notification callback function.
 *
 * If a callback function is provided, it updates the `newNotification` variable
 * to the provided callback.
 *
 * @param {Function|null} callback - The callback function to set as the new notification handler.
 */
export function newNotificationNDM(callback) {
    if (callback) {
        newNotification = callback;
    }
}

/**
 * Retrieves the path of a note, given its parent folder.
 *
 * @param {string} parent The name of the parent folder.
 * @param {string} noteId The unique identifier of the note.
 * @param {boolean} testing A flag to indicate if the function is being called for testing purposes.
 * @returns {Promise<string[]>} The path of the note as an array of strings.
 */
export async function getNotePath(parent, noteId, testing = false) {
    if (!parent) {
        return ["root"];
    }

    const response = await fetch("http://127.0.0.1:3000/api/note/get/notePath", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({parent: parent, noteId: noteId})
    });

    if (response.status === 200) {
        const data = await response.json();
        return data.path;
    } else if (response.status === 401) {
        if (!testing) {
            const err = await response.json();
            newNotification("error", "Unauthorized", err.error);
            setTimeout(() => {logout();}, 5000);
            return [];
        }

        throw new Error("Error while getting note path: Unauthorized");
    } else if (response.status === 500) {
        if (!testing) {
            const err = await response.json();
            newNotification("error", "Error while loading note directory", err.error);
            return [];
        }

        throw new Error("Error while getting note path: Internal Server Error");
    } else {
        newNotification("error", "Unable to load note directory", "There was an unexpected error. Please try again!");
        return [];
    }
}

/**
 * Opens a note in the note editor.
 *
 * This function sets the displayed view to "editor" and retrieves the note
 * data using `getNoteHelper`. If the note is specified as a new note, it
 * initializes with default content.
 *
 * @param {string} noteTitle - The title of the note to open.
 * @param {string} noteContent - The content of the note.
 * @param {string[]} path - The path to the folder containing the note.
 * @returns {Promise<void>} - A promise that resolves when the note is opened.
 */
export async function externalOpenNote(noteTitle, noteContent, path) {
    if (!noteTitle || !noteContent || !path) {
        newNotification("error", "Unable to open note", "Note title, content, or path is missing");
        return;
    }

    openNoteExternal.set(true);
    noteTitleExternal.set(noteTitle);
    noteContentExternal.set(noteContent);
    notePathExternal.set(path);

    let noteStatistics = calculateNoteStatistics(noteContent);
    noteWordCountExternal.set(noteStatistics.wordCount);
    noteCharacterCountExternal.set(noteStatistics.characterCount);

    goto('/notes');
}

/**
 * Opens the note editor in new note mode.
 *
 * This function sets the displayed view to "editor" and sets the note path
 * to the root directory. It also sets the `createNoteExternal` store to
 * `true`, indicating that the note editor should be in new note mode.
 *
 * @returns {void} - Nothing is returned.
 */
export function externalCreateNote() {
    notePathExternal.set(["root"]);
    createNoteExternal.set(true);
    goto('/notes');
}
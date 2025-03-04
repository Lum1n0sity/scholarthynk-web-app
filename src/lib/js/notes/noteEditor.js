import {logout} from "$lib/js/auth.js";

let newNotification = null;

export function newNotificationTNE(callback) {
    if (callback) {
        newNotification = callback;
    }
}

/**
 * Updates a note in the database with the given title and content.
 * @param {string} authToken The authentication token to use for the request.
 * @param {string} noteTitle The new title for the note.
 * @param {string} originalTitle The original title of the note.
 * @param {string} noteContent The content of the note.
 * @param {string[]} path The path to the folder containing the note.
 * @returns {Promise<Object>} An object containing the updated note's statistics (word and character count).
 *                            If the note cannot be updated, an empty object is returned.
 */
export async function updateNote(authToken, noteTitle, originalTitle, noteContent, path) {
    if (authToken) {
        const response = await fetch('http://127.0.0.1:3000/api/update-note', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({title: noteTitle, oldTitle: originalTitle, content: noteContent, path: path})
        });

        if (response.status === 400) {
            newNotification("error", "Error while renaming note", await response.json().error);
            return {};
        } else if (response.status === 404) {
            newNotification("error", "Unable to find note", await response.json().error);
            return {};
        } else if (response.status === 500) {
            newNotification("error", "Error while updating note", await response.json().error);
            return {};
        } else if (response.status === 401) {
            newNotification("error", "Unauthorized", await response.json().error);
            setTimeout(() => {logout();}, 5000);
            return {};
        } else if (response.status !== 200) {
            newNotification("error", "Unable to update note", "There was an unexpected error. Please try again!");
            return {};
        }

        return calculateNoteStatistics(noteContent);
    }
}

/**
 * Fetches a note from the server and calculates its statistics.
 *
 * @param {string} authToken - The authentication token for the API request.
 * @param {string[]} path - The path to the folder containing the note.
 * @param {string} title - The title of the note to retrieve.
 * @param {boolean} isNewNote - Indicates if the note is newly created.
 *
 * @returns {Promise<Object>} An object containing the note's title, content, and statistics (word and character count),
 *                            or an empty object if the note cannot be loaded.
 */
export async function getNote(authToken, path, title, isNewNote) {
    if (authToken) {
        const response = await fetch('http://127.0.0.1:3000/api/get-note', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({title: title, path: path})
        });

        if (response.status === 200) {
            const data = await response.json();

            let satistics = calculateNoteStatistics(data.note.fileContent);
            return {noteTitle: data.note.name, noteContent: data.note.fileContent, statistics: satistics};
        } else if (response.status === 404) {
            newNotification("error", "Unable to find note", await response.json().error);
            return {};
        } else if (response.status === 401) {
            newNotification("error", "Unauthorized", await response.json().error);
            setTimeout(() => {logout();}, 5000);
            return {};
        } else if (response.status === 500) {
            newNotification("error", "Error while loading note", await response.json().error);
            return {};
        } else {
            newNotification("error", "Unable to load note", "There was an unexpected error. Please try again!");
            return {};
        }
    }
}

/**
 * Calculates word count and character count for a given note content.
 * @param {string} content The content of the note.
 * @returns {Object} An object containing the word count and character count.
 */
export function calculateNoteStatistics(content) {
    let wordCount = content.trim().split(/\s+/).length;
    let characterCount = content.length;

    if (wordCount === 0 || characterCount === 0) {
        newNotification("warning", "Unable to calculate statistics", "There were no words or characters in this note.");
    }

    return {wordCount: wordCount, characterCount: characterCount}
}
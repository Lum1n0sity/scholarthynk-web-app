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

        if (response.status !== 200) {
            // showErrorMsg('Unable to update note.');
            // TODO: Implement error handling
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
        } else {
            // if (!isNewNote) showErrorMsg('Unable to load note.');
            return {};
        }
    }
}

/**
 * Calculates word count and character count for a given note content.
 * @param {string} content The content of the note.
 * @returns {Object} An object containing the word count and character count.
 */
function calculateNoteStatistics(content) {
    let wordCount = content.trim().split(/\s+/).length;
    let characterCount = content.length;

    return {wordCount: wordCount, characterCount: characterCount}
}
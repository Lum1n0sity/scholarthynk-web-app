import {logout} from "$lib/js/auth.js";

let newNotification = null;

export function newNotificationTFV(callback) {
    if (callback) {
        newNotification = callback;
    }
}

/**
 * Fetches the items in the file viewer.
 * @param {string} folder the name of the folder to fetch items from
 * @param {string[]} path the path to the parent folder
 * @param {string} authToken the authentication token
 * @param {boolean} testing A flag to indicate if the function is being called for testing purposes.
 * @returns {Promise<{folders: string[], files: string[]}>} an object containing the folders and files in the folder
 */
export async function getFVItems(folder, path, authToken, testing = false) {
    if (authToken) {
        const response = await fetch('http://127.0.0.1:3000/api/fileViewer/get', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({folder: folder, path: path})
        });

        if (response.status === 200) {
            const data = await response.json();

            return {folders: data.folders, files: data.files};
        } else if (response.status === 401) {
            if (!testing) {
                const err = await response.json();
                newNotification("error", "Unauthorized", err.error);
                setTimeout(() => {logout();}, 5000);
                return {folders: [], files: []};
            }

            throw new Error("Error while loading items: Unauthorized");
        } else if (response.status === 500) {
            if (!testing) {
                const err = await response.json();
                newNotification("error", "Error while loading items", err.error);
                return {folders: [], files: []};
            }

            throw new Error("Error while loading items: Internal Server Error");
        } else {
            newNotification("error", "Unable to load items", "There was an unexpected error. Please try again!");
            return {folders: [], files: []};
        }
    }
}

/**
 * Delete a folder in the file viewer.
 * @param {string} selectedItemName the name of the folder to be deleted
 * @param {string[]} path the path to the parent folder
 * @param {string} authToken the authentication token
 * @param {boolean} testing A flag to indicate if the function is being called for testing purposes.
 * @returns {Promise<boolean>} `true` if the folder was deleted successfully, `false` otherwise
 */
export async function deleteFolder(selectedItemName, path, authToken, testing = false) {
    if (authToken) {
        const response = await fetch('http://127.0.0.1:3000/api/fileViewer/delete', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({folder: selectedItemName, path: path})
        });

        if (response.status === 200) {
            return true;
        } else if (response.status === 400) {
            if (!testing) {
                const err = await response.json();
                newNotification("error", "Invalid item", err.error);
                return false;
            }

            throw new Error("Error while deleting item: Invalid item");
        } else if (response.status === 404) {
            if (!testing) {
                const err = await response.json();
                newNotification("error", "Error while deleting item", err.error);
                return false;
            }

            throw new Error("Error while deleting item: Item not found");
        } else if (response.status === 401) {
            if (!testing) {
                const err = await response.json();
                newNotification("error", "Unauthorized", err.error);
                setTimeout(() => {logout();}, 5000);
                return false;
            }

            throw new Error("Error while deleting item: Unauthorized");
        } else if (response.status === 500) {
            if (!testing) {
                const err = await response.json();
                newNotification("error", "Error while deleting item", err.error);
                return false;
            }

            throw new Error("Error while deleting item: Internal Server Error");
        } else {
            newNotification("error", "Unable to delete item", "There was an unexpected error. Please try again!");
            return false;
        }
    }
}

/**
 * Create a new folder in the file viewer.
 * @param {string} newFolderName the name of the new folder
 * @param {string[]} path the path to the parent folder
 * @param {string} authToken the authentication token
 * @param {boolean} testing A flag to indicate if the function is being called for testing purposes.
 * @returns {Promise<boolean>} `true` if the folder was created successfully, `false` otherwise
 */
export async function createFolder(newFolderName, path, authToken, testing = false) {
    if (authToken) {
        const response = await fetch('http://127.0.0.1:3000/api/fileViewer/create', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({parentPath: path, folderName: newFolderName})
        });

        if (response.status === 200) {
            return true;
        } else if (response.status === 400) {
            if (!testing) {
                const err = await response.json();
                newNotification("error", "Error while creating new folder", err.error);
                return false;
            }

            throw new Error("Error while creating new folder: Invalid input");
        } else if (response.status === 409) {
            if (!testing) {
                const err = await response.json();
                newNotification("error", "Error while creating new folder", err.error);
                return false;
            }

            throw new Error("Error while creating new folder: Folder already exists");
        } else if (response.status === 401) {
            if (!testing) {
                const err = await response.json();
                newNotification("error", "Unauthorized", err.error);
                setTimeout(() => {logout();}, 5000);
                return false;
            }

            throw new Error("Error while creating new folder: Unauthorized");
        } else if (response.status === 500) {
            if (!testing) {
                const err = await response.json();
                newNotification("error", "Error while creating new folder", err.error);
                return false;
            }

            throw new Error("Error while creating new folder: Internal Server Error");
        } else {
            newNotification("error", "Unable to create new folder", "There was an unexpected error. Please try again!");
            return false;
        }
    }
}

/**
 * Create a new note in the file viewer.
 * @param {string[]} path the path to the parent folder
 * @param {string} authToken the authentication token
 * @param {boolean} testing A flag to indicate if the function is being called for testing purposes.
 * @returns {Promise<boolean>} `true` if the creation was successful, `false` otherwise
 */
export async function createNote(path, authToken, testing = false) {
    if (authToken) {
        const response = await fetch('http://127.0.0.1:3000/api/note/new', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({path: path})
        });

        if (response.status === 200) {
            return true;
        } else if (response.status === 400) {
            if (!testing) {
                const err = await response.json();
                newNotification("error", "Error while creating new note", err.error);
                return false;
            }

            throw new Error("Error while creating new note: Invalid input");
        } else if (response.status === 401) {
            if (!testing) {
                const err = await response.json();
                newNotification("error", "Unauthorized", err.error);
                setTimeout(() => {logout();}, 5000);
                return false;
            }

            throw new Error("Error while creating new note: Unauthorized");
        } else if (response.status === 500) {
            if (!testing) {
                const err = await response.json();
                newNotification("error", "Error while creating new note", err.error);
                return false;
            }

            throw new Error("Error while creating new note: Internal Server Error");
        } else {
            newNotification("error", "Unable to create new note", "There was an unexpected error. Please try again!");
            return false;
        }
    }
}

/**
 * Rename a file or folder in the file viewer.
 * @param {string} newItemName the new name of the item
 * @param {string} selectedItem the name of the item to be renamed
 * @param {string[]} path the path to the parent folder
 * @param {string} authToken the authentication token
 * @param {boolean} testing A flag to indicate if the function is being called for testing purposes.
 * @returns {Promise<boolean>} `true` if the rename was successful, `false` otherwise
 */
export async function renameFVItem(newItemName, selectedItem, path, authToken, testing = false) {
    if (authToken) {
        if (newItemName === "") {
            if (!testing) newNotification("error", "Invalid name", "New name cannot be empty!");
            return false;
        }

        if (newItemName === selectedItem) {
            if (!testing) newNotification("error", "Invalid name", "New name cannot be the same as the old name.");
            return false;
        }

        const response = await fetch('http://127.0.0.1:3000/api/fileViewer/rename', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({path: path, oldName: selectedItem, newName: newItemName})
        });

        if (response.status === 200) {
            return true;
        } else if (response.status === 400) {
            if (!testing) {
                const err = await response.json();
                newNotification("error", "Invalid name", err.error);
                return false;
            }

            throw new Error("Error while renaming item: Invalid name");
        } else if (response.status === 404) {
            if (!testing) {
                const err = await response.json();
                newNotification("error", "Item not found", err.error);
                return false;
            }

            throw new Error("Error while renaming item: Item not found");
        } else if (response.status === 401) {
            if (!testing) {
                const err = await response.json();
                newNotification("error", "Unauthorized", err.error);
                setTimeout(() => {logout();}, 5000);
                return false;
            }

            throw new Error("Error while renaming item: Unauthorized");
        } else if (response.status === 500) {
            if (!testing) {
                const err = await response.json();
                newNotification("error", "Error while renaming item", err.error);
                return false;
            }

            throw new Error("Error while renaming item: Internal Server Error");
        } else {
            newNotification("error", "Unable to rename item", "There was an unexpected error. Please try again!");
            return false;
        }
    }
}
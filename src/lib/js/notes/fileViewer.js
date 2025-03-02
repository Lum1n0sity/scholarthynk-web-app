/**
 * Fetches the items in the file viewer.
 * @param {string} folder the name of the folder to fetch items from
 * @param {string[]} path the path to the parent folder
 * @param {string} authToken the authentication token
 * @returns {Promise<{folders: string[], files: string[]}>} an object containing the folders and files in the folder
 */
export async function getFVItems(folder, path, authToken) {
    if (authToken) {
        const response = await fetch('http://127.0.0.1:3000/api/get-fv-items', {
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
        } else {
            // showErrorMsg('Unable to fetch file viewer items.');
            // Implement error handling
            return {folders: [], files: []};
        }
    }
}

/**
 * Open a folder in the file viewer.
 * @param {string} folder the name of the folder to be opened
 * @param {string[]} path the path to the parent folder
 * @returns {Promise<string[]>} the new path to the folder
 */
export async function openFolder(folder, path) {
    if (folder !== "root") {
        return [...path, folder];
    }
    return folder;
}

/**
 * Delete a folder in the file viewer.
 * @param {string} selectedItemName the name of the folder to be deleted
 * @param {string[]} path the path to the parent folder
 * @param {string} authToken the authentication token
 * @returns {Promise<boolean>} `true` if the folder was deleted successfully, `false` otherwise
 */
export async function deleteFolder(selectedItemName, path, authToken) {
    if (authToken) {
        const response = await fetch('http://127.0.0.1:3000/api/delete-fv-items', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({folder: selectedItemName, path: path})
        });

        if (response.status === 200) {
            // await getFVItems(path[path.length - 1]);
            return true;
        } else {
            // showErrorMsg('Unable to delete item.');
            // TODO: Implement error handling
            return false;
        }
    }
}

/**
 * Create a new folder in the file viewer.
 * @param {string} newFolderName the name of the new folder
 * @param {string[]} path the path to the parent folder
 * @param {string} authToken the authentication token
 * @returns {Promise<boolean>} `true` if the folder was created successfully, `false` otherwise
 */
export async function createFolder(newFolderName, path, authToken) {
    if (authToken) {
        console.log(path, newFolderName);

        const response = await fetch('http://127.0.0.1:3000/api/create-folder', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({folder: path, name: newFolderName})
        });

        if (response.status === 200) {
            return true;
            // cancelNewFolder();
            // await getFVItems(path[path.length - 1]);
        } else if (response.status === 400) {
            // showErrorMsg('Folder name cannot be empty.');
            return false;
        } else if (response.status === 409) {
            // showErrorMsg('Folder already exists.');
            return false;
        } else {
            // showErrorMsg('Unable to create folder.');
            return false;
        }
    }
}

/**
 * Create a new note in the file viewer.
 * @param {string[]} path the path to the parent folder
 * @param {string} authToken the authentication token
 * @returns {Promise<boolean>} `true` if the creation was successful, `false` otherwise
 */
export async function createNote(path, authToken) {
    if (authToken) {
        const response = await fetch('http://127.0.0.1:3000/api/new-note', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({path: path})
        });

        if (response.status === 200) {
            return true;
            // await openNote("Untitled", true);
        } else {
            // showErrorMsg('Unable to create note.');
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
 * @returns {Promise<boolean>} `true` if the rename was successful, `false` otherwise
 */
export async function renameFVItem(newItemName, selectedItem, path, authToken) {
    if (authToken) {
        if (newItemName === "") {
            // showErrorMsg("New name cannot be empty!");
            // closeModal("renameItem");
            return false;
        }

        if (newItemName === selectedItem) {
            // showErrorMsg("New name cannot be the same as the old name!");
            // closeModal("renameItem");
            return false;
        }

        const response = await fetch('http://127.0.0.1:3000/api/rename-fv-item', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({path: path, oldName: selectedItem, newName: newItemName})
        });

        if (response.status === 200) {
            const index = path.indexOf(selectedItem);
            if (index !== -1) {
                path.splice(index, 1);
            }

            return true;
        } else if (response.status === 400) {
            // showErrorMsg(await response.json().error);
            return false;
        } else {
            // showErrorMsg('Unable to rename item.');
            return false;
        }
    }
}
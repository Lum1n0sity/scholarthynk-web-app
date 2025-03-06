<script>
    import logo from '$lib/assets/logo.svg';
    import {onMount} from 'svelte';
    import DOMPurify from 'dompurify';
    import {getAuthToken, logout} from "$lib/js/auth.js";
    import {getUserData, getProfilePic, displayUserCardHandler, newNotificationU} from "$lib/js/user.js";
    import {
        getFVItems,
        deleteFolder,
        createNote,
        createFolder,
        renameFVItem,
        newNotificationTFV,
    } from "$lib/js/notes/fileViewer.js";
    import {
        updateNote,
        getNote,
        newNotificationTNE,
    } from "$lib/js/notes/noteEditor.js";
    import {
        openNoteExternal,
        noteTitleExternal,
        noteContentExternal,
        noteWordCountExternal,
        noteCharacterCountExternal,
        notePathExternal,
        createNoteExternal,
        newNotificationNDM
    } from "$lib/js/notes/noteDisplayManager.js";
    import {notifications, addNotification, clearNotifications} from "$lib/js/notifications.js";
    import {getFullCurrentDate, formatDate} from "$lib/js/utils.js";


    let bindTestEditor = null;
    let content = "";


    const authToken = getAuthToken();

    let profilePicture = '';

    let username = '';
    let email = '';

    let displayUserCard = false;
    let displayNotifications = false;

    let messageQueue = [];
    let displayMessage = false;
    let popupMessage = '';
    let popupType = '';

    let displayNewNotification = false;

    /**
     * Adds a new notification to the notification queue and displays it immediately if the queue was previously empty
     *
     * The notification will be added to the top of the queue and will be displayed immediately if the queue was previously empty.
     * If the queue was not empty, the notification will be added to the top of the queue and will be displayed once the previous message has been displayed for 5 seconds.
     *
     * @function newNotificationNotes
     * @param {string} type - The type of the notification. Can be "error", "warning", or "info".
     * @param {string} title - The title of the notification.
     * @param {string} message - The message of the notification.
     */
    function newNotificationNotes(type, title, message) {
        addNotification(type, title, message, getFullCurrentDate());
        displayNewNotification = true;

        messageQueue.push({type, title, message});
        if (!displayMessage) {
            showNextMessage();
        }
    }

    // Export newNotification function to external js files
    newNotificationTFV(newNotificationNotes);
    newNotificationTNE(newNotificationNotes);
    newNotificationNDM(newNotificationNotes);
    newNotificationU(newNotificationNotes);

    /**
     * Displays the next message in the queue, or does nothing if the queue is empty
     *
     * When called, the function will display the next message in the queue and start a timer.
     * When the timer expires, the function will hide the current message and call itself again.
     *
     * @function showNextMessage
     */
    function showNextMessage() {
        if (messageQueue.length === 0) return;

        const nextMessage = messageQueue.shift();
        popupMessage = nextMessage.title;
        popupType = nextMessage.type;
        displayMessage = true;

        setTimeout(() => {
            displayMessage = false;
            showNextMessage();
        }, 5000);
    }

    onMount(async () => {
        let userData = await getUserData(authToken);
        username = userData.username;
        email = userData.email;

        profilePicture = await getProfilePic(authToken);

        await refreshFV("root");
        document.addEventListener("click", closeFVContextMenu);

        // Load noteContent into note editor
        // This is for when the user opens a note from another page
        noteEditor.innerHTML = noteContent;
    });

    // Notes

    let displayedView = 'files';

    let fileViewerContextMenu;
    let showFVContext = false;
    let contextInitIsFolder = false;
    let selectedItemName = "";
    let menuX = 0;
    let menuY = 0;

    let folders = [];
    let files = [];
    let path = ["root"];

    let isCreatingFolder = false;
    let newFolderName = "";

    let isRenamingItem = false;
    let newItemName = "";
    let selectedItem = "";

    let originalTitle = "";
    let noteTitle = "";
    let noteContent = "";

    let noteEditor;
    let timeoutNoteEditor;

    let wordCount;
    let characterCount;

    $: displayedView, refreshFV(path[path.length - 1]);
    $: {
        if ($openNoteExternal) externalLoadNote();
        if ($createNoteExternal) externalNewNote();
    }

    /**
     * Loads a note from external sources.
     *
     * Checks if the external note title, content, character count, and word count are set.
     * If any of these are missing, it displays an error message and doesn't open the note.
     *
     * Sets the note title, content, character count, and word count to the external values.
     * Sets the displayed view to "editor".
     *
     * @function externalLoadNote
     */
    function externalLoadNote() {
        displayedView = "editor";

        if (!$noteTitleExternal || !$noteContentExternal) {
            newNotificationNotes("error", "Missing data", "The note data is missing or incomplete. Please try again.");

            displayedView = "files";
            openNoteExternal.set(false);

            return;
        }

        if (!$noteCharacterCountExternal || !$noteWordCountExternal) {
            newNotificationNotes("warning", "Missing data", "The note statistics are missing or incomplete.");
        }

        originalTitle = $noteTitleExternal;
        noteTitle = $noteTitleExternal;
        noteContent = $noteContentExternal;

        wordCount = $noteWordCountExternal;
        characterCount = $noteCharacterCountExternal;

        openNoteExternal.set(false);
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
    async function externalNewNote() {
        let success = await createNote($notePathExternal, authToken);
        if (success) {
            await openNoteHelper("Untitled", true);
        }
        createNoteExternal.set(false);
    }

    /**
     * Opens a folder in the file viewer.
     *
     * If the folder is not "root", the current path is updated to include the
     * folder. The contents of the folder are then fetched using `getFVItems` and
     * the `folders` and `files` variables are updated with the new contents.
     *
     * @param {string} folder - The name of the folder to open.
     * @returns {Promise<void>} - A promise that resolves when the folder has been
     * opened.
     */
    async function openFolderHelper(folder) {
        if (folder !== "root") {
            path = [...path, folder];
        }

        await refreshFV(folder);
    }

    /**
     * Opens a note in the editor view.
     *
     * This function sets the displayed view to "editor" and retrieves the note
     * data using `getNoteHelper`. If the note is specified as a new note, it
     * initializes with default content.
     *
     * @param {string} note - The name or identifier of the note to open.
     * @param {boolean} isNewNote - Indicates whether the note is new or existing.
     * @returns {Promise<void>} - A promise that resolves when the note is opened.
     */
    async function openNoteHelper(note, isNewNote) {
        displayedView = "editor";
        await getNoteHelper(note, isNewNote);
    }

    /**
     * Navigate to a specific folder in the file viewer.
     *
     * This function modifies the current path to navigate to the folder at the specified index,
     * and then updates the `folders` and `files` variables with the contents of that folder.
     *
     * @param {number} index - The index in the path array to navigate to.
     * @param {string} folder - The name of the folder to navigate to.
     * @returns {Promise<void>} - A promise that resolves when the navigation is complete.
     */
    async function navigateTo(index, folder) {
        path = path.slice(0, index + 1);

        await refreshFV(folder);
    }

    /**
     * Delete the selected folder in the file viewer.
     *
     * This function is an event handler for the button to delete a folder in the
     * file viewer. It calls `deleteFolder` to delete the folder, and if the folder
     * was deleted successfully, it calls `refreshFV` to refresh the file viewer
     * with the folder removed.
     */
    async function deleteFolderHelper() {
        let success = await deleteFolder(selectedItemName, path, authToken);
        if (success) {
            await refreshFV(path[path.length - 1]);
        }
    }

    /**
     * Create a new folder in the file viewer.
     *
     * This function is an event handler for the button to create a new folder in
     * the file viewer. It prevents the default action of the button click event,
     * and then calls `createFolder` to create a new folder. After `createFolder`
     * has completed, it calls `cancelNewFolder` to cancel the new folder input
     * field, and then calls `refreshFV` to refresh the file viewer with the newly
     * created folder.
     *
     * @returns {Promise<void>} a promise that resolves when the creation of the
     * folder has completed
     */
    async function createFolderHelper() {
        let success = await createFolder(newFolderName, path, authToken);
        if (success) {
            cancelNewFolder();
            await refreshFV(path[path.length - 1]);
        }
    }

    /**
     * Refresh the file viewer by fetching the items in the given folder.
     *
     * This function will call `getFVItems` to fetch the items in the given folder,
     * and then update the `folders` and `files` variables with the newly fetched
     * items.
     *
     * @param {string} folder the name of the folder to fetch items from
     * @returns {Promise<void>} a promise that resolves when the file viewer has
     * been refreshed
     */
    async function refreshFV(folder) {
        let fvItems = await getFVItems(folder, path, authToken);

        if (fvItems && typeof fvItems === "object") {
            folders = fvItems.folders || [];
            files = fvItems.files || [];
        }

    }

    /**
     * Create a new note in the file viewer.
     *
     * This function is an event handler for the button to create a new note in the
     * file viewer. It prevents the default action of the button click event, and
     * then calls `createNote` to create a new note. After `createNote` has
     * completed, it opens the newly created note with `openNoteHelper`.
     *
     * @returns {Promise<void>} a promise that resolves when the note has been
     * created and opened
     */
    async function createNoteHelper() {
        let success = await createNote(path, authToken);
        if (success) {
            await openNoteHelper("Untitled", true);
        }
    }

    /**
     * Rename a file or folder in the file viewer.
     *
     * This function is an event handler for the button to rename a file or folder
     * in the file viewer context menu. It prevents the default action of the button
     * click event, and then calls `renameFVItem` to rename the file or folder. After
     * `renameFVItem` has completed, it closes the rename item modal, and if the
     * rename was successful, it refreshes the file viewer.
     */
    async function renameFVItemHelper() {
        let success = await renameFVItem(newItemName, selectedItem, path, authToken);
        closeModal("renameItem");
        if (success) {
            await refreshFV(path[path.length - 1]);
        }
    }

    /**
     * Open the file viewer context menu.
     *
     * This function is an event handler for the right-click event on the file
     * viewer. It prevents the default action of the right-click event, and then
     * shows the file viewer context menu at the position of the right-click.
     *
     * @param {MouseEvent} event the right-click event that triggered this function
     */
    function openFVContextMenu(event) {
        event.preventDefault();

        contextInitIsFolder = false;

        if (event.target.classList.contains("folder")) contextInitIsFolder = true;

        selectedItemName = event.target.closest(".fv-item.parent").querySelector(".folder-name").textContent;

        menuX = event.clientX;
        menuY = event.clientY;

        showFVContext = true;
    }

    /**
     * Closes the file viewer context menu.
     *
     * This resets the state used to handle the context menu, including the menu's
     * visibility, whether the item that was right-clicked is a folder, and the name
     * of the item that was right-clicked.
     */
    function closeFVContextMenu() {
        showFVContext = false;
        contextInitIsFolder = false;
        selectedItemName = "";
    }

    /**
     * Closes the given modal.
     *
     * If the modal is `"renameItem"`, it also resets the rename item state.
     *
     * @param {string} modal - The modal to close.
     * @returns {void}
     */
    function closeModal(modal) {
        if (modal === "renameItem") {
            isRenamingItem = false;
            newItemName = "";
        }
    }

    /**
     * Cancels the creation of a new folder.
     *
     * Sets `isCreatingFolder` to `false` and resets `newFolderName` to an empty string.
     *
     * @returns {void}
     */
    function cancelNewFolder() {
        isCreatingFolder = false;
        newFolderName = "";
    }

    /**
     * Handles input events in the note editor by setting a 2-second debounce timer.
     * If the timer completes, it updates the note with the current content of the
     * note editor.
     *
     * @returns {Promise<void>}
     */
    function handleNoteInput() {
        noteContent = DOMPurify.sanitize(noteEditor.innerHTML);
        // noteEditor.innerHTML = noteContent;

        clearTimeout(timeoutNoteEditor);

        timeoutNoteEditor = setTimeout(async () => {
            await updateNoteHelper();
        }, 2000);
    }

    /**
     * Retrieves and displays a note in the editor view.
     *
     * This function fetches the note data using `getNote` and updates the
     * editor with the note's title and content. It also sets the word and
     * character count statistics for the note. The editor view is activated
     * to display the note content.
     *
     * @param {string} note - The name or identifier of the note to retrieve.
     * @param {boolean} isNewNote - Indicates whether the note is new or existing.
     * @returns {Promise<void>} - A promise that resolves when the note data is retrieved and displayed.
     */
    async function getNoteHelper(note, isNewNote) {
        let noteData = await getNote(authToken, path, note, isNewNote);

        originalTitle = noteData.noteTitle;
        noteTitle = noteData.noteTitle;
        noteContent = noteData.noteContent;

        wordCount = noteData.statistics.wordCount;
        characterCount = noteData.statistics.characterCount;

        noteEditor.innerHTML = noteContent;

        displayedView = "editor";

        // Set cursor to the end of the input after content is loaded
        noteEditor.focus();

        let range = document.createRange();
        let selection = window.getSelection();

        range.selectNodeContents(noteEditor);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
    }

    /**
     * Updates the currently open note with the new content in the note editor.
     * If the update was successful, it also reloads the note content.
     */
    async function updateNoteHelper() {
        let success = await updateNote(authToken, noteTitle, originalTitle, noteContent, path);
        if (success) {
            await getNoteHelper(noteTitle, false);
        }
    }

    /**
     * Toggles a specific style property on the selected text within the note editor.
     *
     * This function applies or removes a specified style to the current text selection
     * by wrapping it in a <span> element with the given style. If the selected text
     * already has the specified style, it will be removed. If the selection is empty,
     * or if the selection is not within the note editor, the function does nothing.
     * After modifying the selection, any adjacent spans with the same style are merged,
     * and the note input handler is triggered to update the note content.
     *
     * @param {string} styleProperty - The CSS style property to toggle (e.g., "font-weight").
     * @param {string} styleValue - The value of the style property to apply or remove (e.g., "bold").
     */
    function toggleStyle(styleProperty, styleValue) {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        if (range.collapsed) return;

        if (!noteEditor.contains(range.commonAncestorContainer)) return;

        let parent = range.commonAncestorContainer;
        while (parent && parent !== noteEditor) {
            if (parent.nodeType === Node.ELEMENT_NODE && parent.tagName === "SPAN") {
                const currentStyle = parent.style[styleProperty];
                if (currentStyle === styleValue) {
                    parent.style[styleProperty] = "";

                    if (!parent.style.cssText.trim()) {
                        const textNode = document.createTextNode(parent.textContent);
                        parent.replaceWith(textNode);
                    }
                    return;
                }
            }
            parent = parent.parentNode;
        }

        const span = document.createElement("span");
        span.style[styleProperty] = styleValue;

        span.appendChild(range.extractContents());
        range.deleteContents();
        range.insertNode(span);

        mergeAdjacentSpans(span);

        selection.removeAllRanges();

        handleNoteInput();
    }

    /**
     * Merge adjacent spans with the same style.
     *
     * Given a span element, merge its content with any adjacent spans that have the same style.
     *
     * @param {HTMLElement} span The span to merge adjacent spans with.
     */
    function mergeAdjacentSpans(span) {
        if (!span || span.tagName !== "SPAN") return;

        const prev = span.previousSibling;
        const next = span.nextSibling;

        if (prev && prev.nodeType === Node.ELEMENT_NODE && prev.tagName === "SPAN" &&
            prev.style.cssText === span.style.cssText) {
            prev.innerHTML += span.innerHTML;
            span.remove();
            span = prev;
        }

        if (next && next.nodeType === Node.ELEMENT_NODE && next.tagName === "SPAN" &&
            next.style.cssText === span.style.cssText) {
            span.innerHTML += next.innerHTML;
            next.remove();
        }
    }

    /**
     * Resets formatting within the selected text range in the note editor.
     *
     * This function removes any <span> elements within the selection by replacing
     * them with their text content, effectively clearing any styling applied.
     * The selection is then cleared and the note editor is focused.
     * Finally, the note input handler is triggered to update the note content.
     */
    function resetFormatting() {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        if (range.collapsed) return;

        if (!noteEditor.contains(range.commonAncestorContainer)) return;

        let parent = range.commonAncestorContainer;
        const nodesToRemove = [];

        while (parent && parent !== noteEditor) {
            if (parent.nodeType === Node.ELEMENT_NODE && parent.tagName === "SPAN") {
                const textNode = document.createTextNode(parent.textContent);
                parent.replaceWith(textNode);
                nodesToRemove.push(parent);
            }
            parent = parent.parentNode;
        }

        nodesToRemove.forEach(node => node.remove());
        selection.removeAllRanges();

        handleNoteInput();
    }
</script>

<div class="body">
    <div class="nav-bar">
        <div class="logo">
            <img src={logo} alt="logo" class="logo-img"/>
            <h1 class="logo-name">SCHOLARTHYNK</h1>
        </div>
        <div class="button-group-nav" style="width: 19.3%">
            <a href="/home" class="nav">Dashboard</a>
            <button class="profile-pic" on:click={() => {displayUserCard = displayUserCardHandler(displayUserCard)}}>
                <img src={profilePicture}
                     alt="Your Profile Picture"
                     class="profile-pic-img"/></button>
        </div>
    </div>
    <div class="page-content">
        {#if displayedView === 'files'}
            <div class="file-viewer">
                <div class="breadcrumbs">
                    {#each path as folder, index}
                        <span class="breadcrumb" on:click={() => {navigateTo(index, folder)}}>{folder}</span>
                        {#if index < path.length - 1}
                            <span class="separator">/</span>
                        {/if}
                    {/each}
                </div>
                <div class="files">
                    {#each folders as folder, index}
                        <button class="fv-item folder parent" on:contextmenu={openFVContextMenu}
                                on:click={openFolderHelper(folder.name)}>
                            <div class="fv-item-left folder">
                                <span class="material-symbols-rounded fv-icon folder">folder</span>
                                <p class="folder folder-name">{folder.name}</p>
                            </div>
                            <p class="fv-item-right folder">{formatDate(folder.lastEdited)}</p>
                        </button>
                    {/each}
                    {#each files as file, index}
                        <button class="fv-item parent" on:contextmenu={openFVContextMenu}
                                on:click={openNoteHelper(file.name, false)}>
                            <div class="fv-item-left"><span class="material-symbols-rounded fv-icon">article</span>
                                {#if isRenamingItem && selectedItemName === file.name}
                                    <input type="text" placeholder="File name..." class="new-folder-input"
                                           bind:value={newItemName} on:blur={renameFVItemHelper}>
                                {:else}
                                    <p class="folder-name">{file.name}</p>
                                {/if}
                            </div>
                            <p class="fv-item-right">{formatDate(file.lastEdited)}</p>
                        </button>
                    {/each}
                    {#if isCreatingFolder}
                        <div class="fv-item fv-new-folder">
                            <span class="material-symbols-rounded fv-icon">folder</span>
                            <input type="text" placeholder="Folder name..." class="new-folder-input"
                                   bind:value={newFolderName} on:blur={createFolderHelper}>
                            <button class="close-btn" on:click={cancelNewFolder}><span class="material-symbols-rounded">close</span>
                            </button>
                        </div>
                    {/if}
                </div>
                <div class="fv-btns">
                    <button class="new-btn" on:click={createNoteHelper}><span
                            class="material-symbols-rounded">add_notes</span> New Note
                    </button>
                    <button class="new-btn" on:click={() => {isCreatingFolder = true}}><span
                            class="material-symbols-rounded">create_new_folder</span> New Folder
                    </button>
                    <button class="refresh-fv-btn" on:click={() => {refreshFV(path[path.length - 1])}}><span
                            class="material-symbols-rounded">refresh</span></button>
                </div>
            </div>
        {:else if displayedView === 'editor'}
            <div class="note-editor">
                <div class="editor">
                    <input class="open-note-title" placeholder="Note title..." bind:value={noteTitle}
                           on:input={handleNoteInput}>
                    <div id="note" class="note" contenteditable="true" bind:this={noteEditor} on:input={handleNoteInput}></div>
                </div>
                <div class="note-options">
                    <div class="formatting-btns">
                        <button class="formatting-btn" on:click={() => {toggleStyle("font-weight", "bold")}}><span
                                class="material-symbols-rounded">format_bold</span></button>
                        <button class="formatting-btn" on:click={() =>{toggleStyle("text-decoration", "underline")}}>
                            <span class="material-symbols-rounded">format_underlined</span></button>
                        <button class="formatting-btn" on:click={() =>{toggleStyle("font-style", "italic")}}><span
                                class="material-symbols-rounded">format_italic</span></button>
                        <button class="formatting-btn" on:click={resetFormatting}><span
                                class="material-symbols-rounded">format_color_reset</span></button>
                    </div>
                    <div class="note-statistics">
                        <p class="note-statistic">Words: {wordCount}</p>
                        <p class="note-statistic">Characters: {characterCount}</p>
                        <p class="note-statistic">Owner: N/A</p>
                        <button class="share-btn"><span class="material-symbols-rounded">share</span> Share</button>
                        <button class="back-fv" on:click={() => {displayedView = 'files'}}><span
                                class="material-symbols-rounded">folder</span></button>
                    </div>
                </div>
            </div>
        {/if}
    </div>
</div>

{#if displayNotifications}
    <div class="notifications">
        <div class="notifications-header">
            <h2 class="notifications-title">Notifications</h2>
            <button class="notifications-close" on:click={displayNotifications = false}><span
                    class="material-symbols-rounded">remove</span></button>
        </div>
        {#if $notifications.length > 0}
            <button class="notifications-clear" on:click={() => {clearNotifications()}}><span
                    class="material-symbols-rounded">delete</span> Clear
            </button>
        {/if}
        <div class="notifications-list">
            {#each $notifications as notification}
                {#if notification.type === "error"}
                    <div class="notification notifications-error">
                        <h3 class="notification-title notifications-content"
                            style="grid-area: notification-title;">{notification.title}:</h3>
                        <p class="notifications-message notifications-content"
                           style="grid-area: notification-msg;">{notification.message}</p>
                        <p class="notifications-timestamp notifications-content"
                           style="grid-area: notification-timestamp;">{notification.timestamp}</p>
                        <span class="material-symbols-rounded error-icon"
                              style="grid-area: notification-icon;">error</span>
                    </div>
                {:else if notification.type === "warning"}
                    <div class="notification notifications-warning">
                        <h3 class="notification-title notifications-content"
                            style="grid-area: notification-title;">{notification.title}:</h3>
                        <p class="notifications-message notifications-content"
                           style="grid-area: notification-msg;">{notification.message}</p>
                        <p class="notifications-timestamp notifications-content"
                           style="grid-area: notification-timestamp;">{notification.timestamp}</p>
                        <span class="material-symbols-rounded warning-icon" style="grid-area: notification-icon;">warning</span>
                    </div>
                {:else if notification.type === "info"}
                    <div class="notification notifications-info">
                        <h3 class="notification-title notifications-content"
                            style="grid-area: notification-title;">{notification.title}:</h3>
                        <p class="notifications-message notifications-content"
                           style="grid-area: notification-msg;">{notification.message}</p>
                        <p class="notifications-timestamp notifications-content"
                           style="grid-area: notification-timestamp;">{notification.timestamp}</p>
                        <span class="material-symbols-rounded info-icon"
                              style="grid-area: notification-icon;">info</span>
                    </div>
                {/if}
            {/each}
        </div>
    </div>
{/if}

{#if isRenamingItem}
    <div class="modal-block">
        <div class="modal rename-modal">
            <div class="modal-header rename-modal-header">
                <h3 class="modal-title">Rename "{selectedItem}"</h3>
                <button class="modal-close" on:click={() => {closeModal("renameItem")}}><span
                        class="material-symbols-rounded">close</span></button>
            </div>
            <input type="text" placeholder="File name..." class="rename-input" bind:value={newItemName}>
            <button class="button update-item" on:click={renameFVItemHelper}>Update</button>
        </div>
    </div>
{/if}

{#if showFVContext}
    <div class="fv-context-menu" bind:this={fileViewerContextMenu}
         style="top: {menuY}px; left: {menuX}px; height: {contextInitIsFolder ? '30%' : '20%'}">
        {#if contextInitIsFolder}
            <button class="fv-context-menu-item" on:click={createNoteHelper}>New Note</button>
            <button class="fv-context-menu-item"
                    on:click={() => {openFolderHelper(selectedItemName); isCreatingFolder = true}}>New Folder
            </button>
        {/if}
        <button class="fv-context-menu-item">Download</button>
        <button class="fv-context-menu-item" on:click={() =>{isRenamingItem = true; selectedItem = selectedItemName}}>
            Rename
        </button>
        <button class="fv-context-menu-item" on:click={deleteFolderHelper}>Delete</button>
        <button class="fv-context-menu-item">Share</button>
    </div>
{/if}

{#if displayUserCard}
    <div class="user-card">
        <div class="upper-section"></div>
        <!-- svelte-ignore a11y_img_redundant_alt -->
        <img src={profilePicture} alt="Your Profile Picture" class="card-profile-pic">
        <div class="card-user-data">
            <h2>{username}</h2>
            <p>{email}</p>
        </div>
        <div class="card-fabs">
            <button class="card-fab">
                <span class="material-symbols-rounded">group</span>
            </button>
            <button class="card-fab">
                <span class="material-symbols-rounded">settings</span>
            </button>
            <button class="card-fab"
                    on:click={() => {displayNotifications = true; displayUserCard = false; displayNewNotification = false; displayMessage = false;}}>
                <span class="material-symbols-rounded">{displayNewNotification ? 'notifications_unread' : 'notifications'}</span>
            </button>
            <button class="card-fab" on:click={logout}>
                <span class="material-symbols-rounded">logout</span>
            </button>
        </div>
        <div class="card-btns">
            <button class="card-btn dark-light-toggle"><span class="material-symbols-rounded">contrast</span>
                <p>Dark/Light Mode</p></button>
            <button class="card-btn switch-account"><span class="material-symbols-rounded">switch_account</span>
                <p>Switch Account</p></button>
        </div>
    </div>
{/if}

{#if displayMessage}
    <button class="message-popup {popupType === 'error' ? 'error-popup' : popupType === 'warning' ? 'warning-popup' : 'info-popup'}"
            on:click={() => {displayNotifications = true; displayUserCard = false; displayNewNotification = false; displayMessage = false;}}>
        <h1 class="popup-message">{popupMessage}</h1>
        <span class="material-symbols-rounded {popupType === 'error' ? 'error-popup-icon' : popupType === 'warning' ? 'warning-popup-icon' : 'info-popup-icon'}">{popupType === "error" ? "error" : popupType === "warning" ? "warning" : "info"}</span>
    </button>
{/if}

<style>
    @import "$lib/style/global.css";
    @import "$lib/style/notes.css";
</style>
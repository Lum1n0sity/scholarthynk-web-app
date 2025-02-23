<script>
    import logo from '$lib/assets/logo.svg';
    import { browser } from '$app/environment';
    import { onMount } from 'svelte';

    let profilePicture = '';
    const authToken = browser ? localStorage.getItem('authToken') : null;

    let error = '';
    let timeout;

    let username = '';
    let email = '';

    let displayUserCard = false;

    onMount(async () => {
        await openFolder("root");
        await getUserData();
        await getProfilePic();
        document.addEventListener("click", closeFVContextMenu);
    });

    async function getUserData() {
        if (authToken) {
            const response = await fetch('http://127.0.0.1:3000/api/get-user-data', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 200) {
                const data = await response.json();
                username = data.user.name;
                email = data.user.email;
            } else {
                showErrorMsg('Unable to fetch user data.');
            }
        }
    }

    async function getProfilePic() {
        if (authToken) {
            const response = await fetch('http://127.0.0.1:3000/api/get-profile-pic', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 200) {
                const imageBlob = await response.blob();
                profilePicture = URL.createObjectURL(imageBlob);

            } else {
                showErrorMsg('Unable to fetch your profile picture.');
            }
        } else {
            window.location.href = '/login';
        }
    }

    function displayUserCardHandler() {
        displayUserCard = displayUserCard === false ? true : false;
    }

    function showErrorMsg(err) {
        if (err) {
            error = err;
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                error = '';
            }, 5000);
        }
    }

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

    async function getFVItems(folder) {
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
                folders = data.folders;
                files = data.files;
            } else {
                showErrorMsg('Unable to fetch file viewer items.');
            }
        }
    }

    async function openFolder(folder) {
        if (folder !== "root") {
            path = [...path, folder];
        }
        await getFVItems(folder);
    }

    async function openNote(note, isNewNote) {
        displayedView = 'editor';
        await getNote(note, isNewNote);
    }

    async function navigateTo(index) {
        path = path.slice(0, index + 1);
        await getFVItems(path[index]);
    }

    async function deleteFolder() {
        if (authToken) {
            path.push(selectedItemName);
            const response = await fetch('http://127.0.0.1:3000/api/delete-fv-items', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({folder: selectedItemName, path: path})
            });

            if (response.status === 200) {
                const index = path.indexOf(selectedItemName);
                path.splice(index, 1);
                await getFVItems(path[path.length - 1]);
            } else {
                showErrorMsg('Unable to delete folder.');
            }
        }
    }

    async function createFolder() {
        if (authToken) {
            const response = await fetch('http://127.0.0.1:3000/api/create-folder', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({folder: path, name: newFolderName})
            });

            if (response.status === 200) {
                cancelNewFolder();
                await getFVItems(path[path.length - 1]);
            } else if (response.status === 400) {
                showErrorMsg('Folder name cannot be empty.');
            } else if (response.status === 409) {
                showErrorMsg('Folder already exists.');
            } else {
                showErrorMsg('Unable to create folder.');
            }
        }
    }

    async function createNote() {
        if (authToken) {
            displayedView = "editor";

            const response = await fetch('http://127.0.0.1:3000/api/new-note', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({path: path})
            });

            if (response.status === 200) {
                await openNote("Untitled", true);
            } else {
                showErrorMsg('Unable to create note.');
            }
        }
    }

    async function renameFVItem() {
        if (authToken) {
            path.push(selectedItem);

            if (newItemName === "") {
                showErrorMsg("New name cannot be empty!");
                closeModal("renameItem");
                return;
            }

            if (newItemName === selectedItem) {
                showErrorMsg("New name cannot be the same as the old name!");
                closeModal("renameItem");
                return;
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
                isRenamingItem = false;
                newItemName = "";

                const index = path.indexOf(selectedItem);
                if (index !== -1) {
                    path.splice(index, 1);
                }

                closeModal("renameItem");
                await getFVItems(path[path.length - 1]);
            } else if (response.status === 400) {
                showErrorMsg(await response.json().error);
            } else {
                showErrorMsg('Unable to rename item.');
            }
        }
    }

    function cancelNewFolder() {
        isCreatingFolder = false;
        newFolderName = "";
    }

    function openFVContextMenu(event) {
        event.preventDefault();

        if (event.target.classList.contains("folder")) contextInitIsFolder = true;

        selectedItemName = event.target.closest(".fv-item.parent").querySelector(".folder-name").textContent;

        menuX = event.clientX;
        menuY = event.clientY;

        showFVContext = true;
    }

    function closeFVContextMenu() {
        showFVContext = false;
        contextInitIsFolder = false;
        selectedItemName = "";
    }

    function closeModal(modal) {
        if (modal === "renameItem") {
            isRenamingItem = false;
            newItemName = "";
        }
    }

    // editor
    let originalTitle = "";
    let noteTitle = "";
    let noteContent = "";

    let noteEditor;
    let timeoutNoteEditor;

    let wordCount;
    let characterCount;

    async function handleNoteInput() {
        noteContent = noteEditor.innerHTML;

        clearTimeout(timeoutNoteEditor);

        timeoutNoteEditor = setTimeout(async () => {
            await updateNote();
        }, 2000);
    }

    async function updateNote() {
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
                showErrorMsg('Unable to update note.');
            }

            calculateNoteStatistics();
        }
    }

    async function getNote(title, isNewNote) {
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

                originalTitle = data.note.name;

                noteTitle = data.note.name;
                noteContent = data.note.fileContent;
                noteEditor.innerHTML = data.note.fileContent;

                calculateNoteStatistics();
            } else {
                if (!isNewNote) showErrorMsg('Unable to load note.');
            }
        }
    }

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
        noteEditor.focus();

        handleNoteInput();
    }

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

    function calculateNoteStatistics() {
        const content = noteEditor.textContent;

        wordCount = content.trim().split(/\s+/).length;
        characterCount = content.length;
    }

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
        noteEditor.focus();

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
            <!-- svelte-ignore a11y_img_redundant_alt -->
            <button class="profile-pic" on:click={displayUserCardHandler}><img src={profilePicture}
                                                                               alt="Your Profile Picture"
                                                                               class="profile-pic-img"/></button>
        </div>
    </div>
    <div class="page-content">
        {#if displayedView === 'files'}
            <div class="file-viewer">
                <div class="breadcrumbs">
                    {#each path as folder, index}
                        <span class="breadcrumb" on:click={() => {navigateTo(index)}}>{folder}</span>
                        {#if index < path.length - 1}
                            <span class="separator">/</span>
                        {/if}
                    {/each}
                </div>
                <div class="files">
                    {#each folders as folder, index}
                        <button class="fv-item folder parent" on:contextmenu={openFVContextMenu} on:click={openFolder(folder.name)}>
                            <div class="fv-item-left folder">
                                <span class="material-symbols-rounded fv-icon folder">folder</span>
                                <p class="folder folder-name">{folder.name}</p>
                            </div>
                            <p class="fv-item-right folder">{folder.lastEdited}</p>
                        </button>
                    {/each}
                    {#each files as file, index}
                        <button class="fv-item" on:contextmenu={openFVContextMenu} on:click={openNote(file.name, false)}>
                            <div class="fv-item-left"><span class="material-symbols-rounded fv-icon">article</span>
                                {#if isRenamingItem && selectedItemName === file.name}
                                    <input type="text" placeholder="File name..." class="new-folder-input"
                                           bind:value={newItemName} on:blur={renameFVItem()}>
                                {:else}
                                    <p class="folder folder-name">{file.name}</p>
                                {/if}
                            </div>
                            <p class="fv-item-right">{file.lastEdited}</p>
                        </button>
                    {/each}
                    {#if isCreatingFolder}
                        <div class="fv-item fv-new-folder">
                            <span class="material-symbols-rounded fv-icon">folder</span>
                            <input type="text" placeholder="Folder name..." class="new-folder-input"
                                   bind:value={newFolderName} on:blur={createFolder}>
                            <button class="close-btn" on:click={cancelNewFolder}><span class="material-symbols-rounded">close</span></button>
                        </div>
                    {/if}
                </div>
                <div class="fv-btns">
                    <button class="new-btn" on:click={createNote}><span class="material-symbols-rounded">add_notes</span> New Note</button>
                    <button class="new-btn" on:click={() => {isCreatingFolder = true}}><span
                            class="material-symbols-rounded">create_new_folder</span> New Folder
                    </button>
                </div>
            </div>
        {:else if displayedView === 'editor'}
            <div class="note-editor">
                <div class="editor">
                    <input class="open-note-title" placeholder="Note title..." bind:value={noteTitle} on:input={handleNoteInput}>
                    <div id="note" class="note" contenteditable="true" bind:this={noteEditor} on:input={handleNoteInput}></div>
                </div>
                <div class="note-options">
                    <div class="formatting-btns">
                        <button class="formatting-btn" on:click={() => {toggleStyle("font-weight", "bold")}}><span class="material-symbols-rounded">format_bold</span></button>
                        <button class="formatting-btn" on:click={() =>{toggleStyle("text-decoration", "underline")}}><span class="material-symbols-rounded">format_underlined</span></button>
                        <button class="formatting-btn" on:click={() =>{toggleStyle("font-style", "italic")}}><span class="material-symbols-rounded">format_italic</span></button>
                        <button class="formatting-btn" on:click={resetFormatting}><span class="material-symbols-rounded">format_color_reset</span></button>
                    </div>
                    <div class="note-statistics">
                        <p class="note-statistic">Words: {wordCount}</p>
                        <p class="note-statistic">Characters: {characterCount}</p>
                        <p class="note-statistic">Owner: N/A</p>
                        <button class="share-btn"><span class="material-symbols-rounded">share</span> Share</button>
                        <button class="back-fv" on:click={() => {displayedView = 'files'}}><span class="material-symbols-rounded">folder</span></button>
                    </div>
                </div>
            </div>
        {/if}
    </div>
</div>

{#if isRenamingItem}
    <div class="modal-block">
        <div class="modal rename-modal">
            <div class="modal-header rename-modal-header">
                <h3 class="modal-title">Rename "{selectedItem}"</h3>
                <button class="modal-close" on:click={() => {closeModal("renameItem")}}><span class="material-symbols-rounded">close</span></button>
            </div>
            <input type="text" placeholder="File name..." class="rename-input" bind:value={newItemName}>
            <button class="button update-item" on:click={renameFVItem()}>Update</button>
        </div>
    </div>
{/if}

{#if showFVContext}
    <div class="fv-context-menu" bind:this={fileViewerContextMenu}
         style="top: {menuY}px; left: {menuX}px; height: {contextInitIsFolder ? '30%' : '20%'}">
        {#if contextInitIsFolder}
            <button class="fv-context-menu-item" on:click={createNote()}>New Note</button>
            <button class="fv-context-menu-item" on:click={() => {openFolder(selectedItemName); isCreatingFolder = true}}>New Folder</button>
        {/if}
        <button class="fv-context-menu-item">Download</button>
        <button class="fv-context-menu-item" on:click={() =>{isRenamingItem = true; selectedItem = selectedItemName}}>Rename</button>
        <button class="fv-context-menu-item" on:click={deleteFolder}>Delete</button>
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
            <button class="card-fab">
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

{#if error}
    <div class="error-wrapper">
        <h1 class="error">{error}</h1>
    </div>
{/if}

<style>
    @import "$lib/style/global.css";
    @import "$lib/style/notes.css";
</style>
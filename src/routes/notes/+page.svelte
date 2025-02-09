<script>
    import logo from '$lib/assets/logo.svg';
    import {browser} from '$app/environment';
    import {onMount} from 'svelte';
    import {get} from 'svelte/store';
    import {text} from '@sveltejs/kit';

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
        displayUserCard = displayUserCard == false ? true : false;
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
    let displayedView = 'files'

    let fileViewerContextMenu;
    let showFVContext = false;
    let contextInitIsFolder = false;
    let selectedFolderName = "";
    let menuX = 0;
    let menuY = 0;

    let folders = [];
    let files = [];
    let path = ["root"];

    let isCreatingFolder = false;
    let newFolderName = "";

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

    async function navigateTo(index) {
        path = path.slice(0, index + 1);
        await getFVItems(path[index]);
    }

    async function deleteFolder() {
        if (authToken) {
            path.push(selectedFolderName);
            const response = await fetch('http://127.0.0.1:3000/api/delete-fv-items', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({folder: selectedFolderName, path: path})
            });

            if (response.status === 200) {
                const index = path.indexOf(selectedFolderName);
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

            const response = await fetch('http://127.0.0.1:3000/api/create-note', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({folder: path[path.length - 1]})
            });

            if (response.status === 200) {
                await getFVItems(path[path.length - 1]);
            } else {
                showErrorMsg('Unable to create note.');
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
        else contextInitIsFolder = false;

        selectedFolderName = event.target.closest(".fv-item.parent").querySelector(".folder-name").textContent;

        menuX = event.clientX;
        menuY = event.clientY;

        showFVContext = true;
    }

    function closeFVContextMenu() {
        showFVContext = false;
        selectedFolderName = "";
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
                    {#each folders as folder}
                        <button class="fv-item folder parent" on:contextmenu={openFVContextMenu} on:click={openFolder(folder.name)}>
                            <div class="fv-item-left folder">
                                <span class="material-symbols-rounded fv-icon folder">folder</span>
                                <p class="folder folder-name">{folder.name}</p>
                            </div>
                            <p class="fv-item-right folder">{folder.lastEdited}</p>
                        </button>
                    {/each}
                    {#each files as file}
                        <button class="fv-item" on:contextmenu={openFVContextMenu}>
                            <div class="fv-item-left"><span class="material-symbols-rounded fv-icon">description</span>
                                <p>{file.name}</p></div>
                            <p class="fv-item-right">{file.lastEdited}</p></button>
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
                    <button class="new-btn"><span class="material-symbols-rounded">note_add</span> New Note</button>
                    <button class="new-btn" on:click={() => {isCreatingFolder = true}}><span
                            class="material-symbols-rounded">create_new_folder</span> New Folder
                    </button>
                </div>
            </div>
        {:else if displayedView === 'editor'}
            <div class="note-editor">

            </div>
        {/if}
    </div>
</div>

{#if showFVContext}
    <div class="fv-context-menu" bind:this={fileViewerContextMenu}
         style="top: {menuY}px; left: {menuX}px; height: {contextInitIsFolder ? '30%' : '20%'}">
        {#if contextInitIsFolder}
            <button class="fv-context-menu-item" on:click={createNote()}>New Note</button>
            <button class="fv-context-menu-item" on:click={() => {openFolder(selectedFolderName); isCreatingFolder = true}}>New Folder</button>
        {/if}
        <button class="fv-context-menu-item">Duplicate</button>
        <button class="fv-context-menu-item">Download</button>
        <button class="fv-context-menu-item">Rename</button>
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
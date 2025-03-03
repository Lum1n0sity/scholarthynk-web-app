<script>
    import {onMount} from 'svelte';
    import {browser} from '$app/environment';
    import logo from '$lib/assets/logo.svg';
    import {logout} from "$lib/js/auth.js";

    let isToSChecked = false;
    let isPPChecked = false;
    let openTosPPPopup = false;
    let openDeleteWarningPopup = false;

    let displayToSPPSection = true;
    let displayProfilePicSection = false;

    let popupTitle = '';
    let popupText = '';

    let error = '';
    let timeout;

    let username = '';
    let userId = '';
    let imgWrapper;

    let fileInput;
    let file;

    onMount(() => {
        if (browser) {
            const authToken = localStorage.getItem('authToken');
            if (!authToken) {
                window.location.href = '/signup';
            }
        }
    });

    /**
     * Opens a popup for either Terms of Service or Privacy Policy.
     *
     * This function sets the appropriate title for the popup and attempts to fetch
     * the respective text content from a file. If the fetch is successful, the text
     * is displayed in the popup; otherwise, an error message is shown. In case of
     * any fetch error, an error message is displayed through `showErrorMsg`.
     *
     * @param {string} popupType - The type of popup to open, either "Terms of Service" or "Privacy Policy".
     */
    async function openTosPPPopupHandler(popupType) {
        openTosPPPopup = true;
        popupTitle = popupType;

        if (popupType === "Terms of Service") {
            try {
                const response = await fetch('/src/lib/assets/Onboarding/ToS-DEV.txt');
                if (response.ok) {
                    popupText = await response.text();
                } else {
                    popupText = 'Failed to load Terms of Service';
                }
            } catch (error) {
                showErrorMsg(error);
            }
        } else if (popupType === "Privacy Policy") {
            try {
                const response = await fetch('/src/lib/assets/Onboarding/PP-DEV.txt');
                if (response.ok) {
                    popupText = await response.text();
                } else {
                    popupText = 'Failed to load Privacy Policy';
                }
            } catch (error) {
                showErrorMsg(error);
            }
        }
    }

    /**
     * Deletes the user's account and logs them out.
     *
     * This function is called when the user clicks the "Continue" button in the
     * "Delete Account" warning popup. It attempts to delete the user's account by
     * sending a POST request to the server with the user's authentication token.
     * If the request is successful and the server responds with a success status,
     * the user is logged out and redirected to the login page. Otherwise, an error
     * message is displayed.
     */
    async function continueDeleteHandler() {
        let authToken;
        if (browser) {
            authToken = localStorage.getItem('authToken');
        }

        if (authToken) {
            try {
                fetch('http://localhost:3000/api/delete-account', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    },
                })
                    .then(response => response.json())
                    .then(data => {
                        if (browser && data.success) {
                            localStorage.removeItem('authToken');
                            window.location.href = '/';
                        } else {
                            showErrorMsg(data.error);
                        }
                    })
                    .catch(error => {
                        showErrorMsg(error);
                    })
            } catch (error) {
                showErrorMsg(error);
            }
        } else {
            showErrorMsg('Unable to delete account');
        }
    }

    /**
     * If the user has checked the Terms of Service and Privacy Policy checkboxes,
     * this function will hide the Terms of Service/Privacy Policy section and show
     * the Profile Picture section. It will then call `generateProfilePic` to
     * generate the user's default profile picture.
     */
    function tosPPContinue() {
        if (isToSChecked && isPPChecked) {
            displayToSPPSection = false;
            displayProfilePicSection = true;
            generateProfilePic();
        }
    }

    /**
     * Simulates a click on the hidden file input element, which will allow the user
     * to select a file from their device.
     */
    function selectProfilePic() {
        fileInput.click();
    }

    /**
     * Handles changes to the hidden file input element.
     *
     * When a file is selected, an img element is created and appended to the
     * imgWrapper element. The img element's src is set to the URL of the selected
     * file, and its height and width are set to 100%. If no file is selected, an
     * error message is displayed.
     */
    function handleFileChange(event) {
        file = event.target.files[0];

        const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg'];

        let isFileTypeValid = allowedTypes.includes(file.type);

        if (!isFileTypeValid) {
            showErrorMsg('Invalid file type');
            return;
        }

        if (file) {
            imgWrapper.innerHTML = '';
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.borderRadius = '6px';
            imgWrapper.appendChild(img);
        } else {
            showErrorMsg('Error selecting file');
        }
    }

    /**
     * Converts a Data URL to a blob.
     *
     * @param {string} dataURL - A Data URL, e.g. "data:image/png;base64,iVBORw0KGg..."
     *
     * @returns {Blob} - A blob containing the data described by the Data URL.
     *
     * @example
     * const dataURL = "data:image/png;base64,iVBORw0KGg...";
     * const blob = dataURLToBlob(dataURL);
     */
    function dataURLToBlob(dataURL) {
        const byteString = atob(dataURL.split(',')[1]);
        const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];

        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);

        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }

        return new Blob([ab], {type: mimeString});
    }

    /**
     * Skips the user's profile picture and uploads a default one to the server.
     *
     * This function is called when the user clicks the "Skip" button in the
     * "Upload Profile Picture" section. If the user has not selected a file, or if
     * the user is not authorized, an error message is displayed. Otherwise, a
     * default profile picture is generated and uploaded to the server. If the
     * upload is successful, the user is redirected to the home page. Otherwise, an
     * error message is displayed.
     */
    async function skipProfilePic() {
        if (imgWrapper && imgWrapper.firstChild) {
            const firstEL = imgWrapper.firstChild;
            if (firstEL instanceof HTMLCanvasElement) {
                const dataUrl = firstEL.toDataURL('image/png');

                const blob = dataURLToBlob(dataUrl);

                if (!blob) {
                    showErrorMsg('Profile picture cannot be empty');
                    return;
                }

                if (!userId) {
                    showErrorMsg('Unauthorized!');
                    await continueDeleteHandler();
                    setTimeout(() => {logout();}, 5000);
                    return;
                }

                const formData = new FormData();
                formData.append('profilePic', blob);
                formData.append('userId', userId);

                try {
                    const authToken = browser ? localStorage.getItem('authToken') : null;

                    const response = await fetch('http://localhost:3000/api/upload-profile-pic', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${authToken}`,
                        },
                        body: formData,
                    });

                    const data = await response.json();
                    if (data.success) {
                        window.location.href = '/home';
                    } else {
                        showErrorMsg(data.error);
                    }
                } catch (error) {
                    showErrorMsg(error);
                }
            } else {
                showErrorMsg("Unexpected error");
            }
        } else {
            showErrorMsg("Unexpected error!");
        }
    }

    /**
     * Submits the user's selected profile picture to the server.
     *
     * If the user is not logged in, it logs them out and redirects them to the login page.
     * If the user has not selected a profile picture, it shows an error message and waits 5 seconds
     * before calling `skipProfilePic`.
     *
     * Otherwise, it sends a POST request to the server with the user's profile picture and
     * authentication token. If the request is successful, it redirects the user to the home page.
     * Otherwise, it shows an error message with the server's response.
     */
    async function continueProfilePic() {
        if (file) {
            if (!userId) {
                showErrorMsg('Unauthorized!');
                await continueDeleteHandler();
                setTimeout(() => {logout();}, 5000);
                return;
            }

            const formData = new FormData();
            formData.append('profilePic', file);
            formData.append('userId', userId);

            try {
                const authToken = browser ? localStorage.getItem('authToken') : null;

                const response = await fetch('http://localhost:3000/api/upload-profile-pic', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                    },
                    body: formData,
                });

                const data = await response.json();
                if (data.success) {
                    window.location.href = '/home';
                } else {
                    showErrorMsg(data.error);
                }
            } catch (error) {
                showErrorMsg(error);
            }
        } else {
            await skipProfilePic();
        }
    }

    /**
     * Generates a default profile picture for the user.
     *
     * This asynchronous function retrieves user data from the server using the
     * authentication token stored in local storage. It then generates a canvas
     * element with the user's initials displayed in the center, using a randomly
     * generated background color. The generated canvas is appended to the
     * `imgWrapper` element. If the user data fetch is unsuccessful or if the
     * canvas cannot be generated, an error message is displayed.
     *
     * The function requires the `imgWrapper` element to be present and to have
     * non-zero dimensions. It also depends on the `generateBgColor` function to
     * provide a suitable background color for the canvas.
     */
    async function generateProfilePic() {
        let authToken;
        if (browser) {
            authToken = localStorage.getItem('authToken');
        }

        if (authToken) {
            try {
                const response = await fetch('http://localhost:3000/api/get-user-data', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json',
                    },
                });

                const data = await response.json();

                if (data.success) {
                    username = data.user.name;
                    userId = data.user.userId;
                    if (imgWrapper && imgWrapper.offsetWidth > 0 && imgWrapper.offsetHeight > 0) {
                        const canvas = document.createElement('canvas');

                        canvas.width = imgWrapper.offsetWidth;
                        canvas.height = imgWrapper.offsetHeight;

                        canvas.style.borderRadius = '6px';

                        const ctx = canvas.getContext('2d');

                        ctx.fillStyle = generateBgColor();
                        ctx.fillRect(0, 0, canvas.width, canvas.height);

                        ctx.font = 'bold 80px Arial';
                        ctx.fillStyle = '#FFFFFF';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';

                        const initials = username.split(' ').map(name => name[0]).join('').toUpperCase();
                        ctx.fillText(initials, canvas.width / 2, canvas.height / 2);

                        imgWrapper.innerHTML = '';
                        imgWrapper.appendChild(canvas);
                    } else {
                        showErrorMsg('Unable to generate profile picture');
                    }
                } else {
                    showErrorMsg(data.error);
                }
            } catch (error) {
                showErrorMsg(error);
            }
        }
    }

    /**
     * Generates a random hex color with a brightness between 125 and 220
     * (inclusive).
     *
     * The function repeatedly generates a random hex color and calculates its
     * brightness until it finds a color with a suitable brightness. The
     * brightness is calculated using the W3C formula for relative luminance.
     *
     * @returns {string} A random hex color with a suitable brightness.
     */
    function generateBgColor() {
        let color;
        let brightness;
        do {
            color = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;

            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            brightness = (r * 299 + g * 587 + b * 114) / 1000;
        } while (brightness < 125 || brightness > 220);

        return color;
    }

    /**
     * Displays an error message for a specified duration.
     *
     * This function sets the global `error` variable to the provided error message
     * and displays it. If an error message is already being displayed, the current
     * timeout is cleared before starting a new one. The error message is automatically
     * cleared after 5 seconds.
     *
     * @param {string} err - The error message to display.
     */
    function showErrorMsg(err) {
        if (err) {
            error = err;
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                error = '';
            }, 5000);
        }
    }
</script>

<div class="body">
    <div class="nav-bar">
        <a href="/" class="logo">
            <img src={logo} alt="logo" class="logo-img"/>
            <h1 class="logo-name">SCHOLARTHYNK</h1>
        </a>
        <h1 class="page-title">Onboarding</h1>
    </div>
    {#if displayToSPPSection}
        <div class="tos-pp-wrapper">
            <h1 class="wrapper-title">Terms of Service & Privacy Policy</h1>
            <div class="tos-wrapper">
                <label>
                    <input type="checkbox" class="material-symbols-rounded" bind:checked={isToSChecked}>
                    <span class="custom-checkbox tos-box"></span>
                    Accept Terms of Service
                </label>
                <button class="button" on:click={async () => await openTosPPPopupHandler("Terms of Service")}>Read Terms
                    of Service
                </button>
            </div>
            <div class="pp-wrapper">
                <label>
                    <input type="checkbox" class="material-symbols-rounded" bind:checked={isPPChecked}>
                    <span class="custom-checkbox pp-box"></span>
                    Accept Privacy Policy
                </label>
                <button class="button" on:click={async () => await openTosPPPopupHandler("Privacy Policy")}>Read Privacy
                    Policy
                </button>
            </div>
            <div class="button-wrapper">
                <button class="back" on:click={openDeleteWarningPopup = true}><span class="material-symbols-rounded">arrow_back</span>
                    <p>Back</p></button>
                <button class="continue" on:click={tosPPContinue}><p>Continue</p> <span
                        class="material-symbols-rounded">arrow_forward</span></button>
            </div>
        </div>
    {/if}
    {#if displayProfilePicSection}
        <div class="profile-pic-wrapper">
            <h1 class="wrapper-title">Upload your Profile Picture</h1>
            <div class="img-wrapper" bind:this={imgWrapper}>
            </div>
            <div class="button-wrapper profile-pic-btn-wrapper">
                <button class="button upload" on:click={selectProfilePic}>Upload</button>
                <button class="button continue continue-profile-pic" on:click={continueProfilePic}><p>Continue</p> <span
                        class="material-symbols-rounded">arrow_forward</span></button>
            </div>
            <input type="file" bind:this={fileInput} on:change={(event) => {handleFileChange(event);}} style="display: none;"/>
        </div>
    {/if}
</div>

{#if openDeleteWarningPopup}
    <div class="popup-wrapper delete-warning">
        <div class="delete-warning-popup">
            <h1 class="popup-title">Warning!</h1>
            <h2 class="popup-text">Going back will delete your account!</h2>
            <div class="warning-button-wrapper">
                <button class="button cancel" on:click={openDeleteWarningPopup = false}>Cancel</button>
                <button class="button continue-delete" on:click={continueDeleteHandler}>Continue</button>
            </div>
        </div>
    </div>
{/if}

{#if openTosPPPopup}
    <div class="popup-wrapper">
        <div class="tos-pp-popup">
            <div class="popup-header">
                <h1 class="popup-title tos-pp-popup-title">{popupTitle}</h1>
                <button class="close-btn" on:click={() => {openTosPPPopup = false; popupText = ''; popupTitle = '';}}>
                    <span class="material-symbols-rounded">close</span></button>
            </div>
            <div class="popup-content">
                <p class="popup-text">{@html popupText}</p>
            </div>
        </div>
    </div>
{/if}

{#if error}
    <div class="message-popup error-popup">
        <h1 class="popup-message">{error}</h1>
        <span class="material-symbols-rounded error-popup-icon">error</span>
    </div>
{/if}

<style>
    @import "$lib/style/global.css";
    @import "$lib/style/onboarding.css";

    .body {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
</style>
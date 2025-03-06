<script>
    import {browser} from '$app/environment';
    import logo from '$lib/assets/logo.svg';
    import {hashPassword} from "$lib/js/user.js";

    let error = '';
    let timeout;

    let isPasswordVisible = false;

    let email;
    let password;

    /**
     * Shows an error message for 5 seconds.
     *
     * @param {string} err The error message to be displayed.
     */
    function showErrorMsg(err) {
        error = err
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            error = '';
        }, 5000);
    }

    /**
     * Toggles the visibility of the password input.
     *
     * When the password input is focused and this function is called, it toggles the
     * `type` attribute of the input between "password" and "text", effectively
     * showing or hiding the password.
     */
    function showHidePassword() {
        isPasswordVisible = !isPasswordVisible;
    }

    /**
     * Handles the login form submission.
     *
     * This function hashes the user's password and sends a POST request to the login API
     * endpoint with the user's email and hashed password. Based on the server's response,
     * it performs the following actions:
     * - If the response status is 200 and an auth token is received, it stores the token
     *   in local storage and redirects the user to the home page.
     * - If the response status is 401, it shows an error message indicating invalid credentials.
     * - If the response status is 500, it shows an error message indicating a server error.
     * - For any other response status, it shows an "Unexpected error" message.
     *
     * @returns {Promise<void>} A promise that resolves when the login process is complete.
     */
    async function handleSubmit() {
        let hashedPassword = await hashPassword(password);

        const userData = JSON.stringify({
            email: email,
            password: hashedPassword,
        });

        const response = await fetch('http://localhost:3000/api/user/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: userData
        });

        if (response.status === 200) {
            const data = await response.json();
            if (browser && data.authToken) {
                localStorage.setItem('authToken', data.authToken);
                window.location.href = '/home';
            } else {
                showErrorMsg("Invalid server response!");
            }
        } else if (response.status === 401) {
            showErrorMsg("Invalid credentials!");
        } else if (response.status === 500) {
            showErrorMsg("Error logging in!");
        } else {
            showErrorMsg("Unexpected error!");
        }
    }
</script>

<div class="body">
    <div class="nav-bar">
        <a href="/" class="logo">
            <img src={logo} alt="logo" class="logo-img"/>
            <h1 class="logo-name">SCHOLARTHYNK</h1>
        </a>
        <h1 class="page-title">Login</h1>
    </div>
    <div class="inputs">
        <div class="input-section">
            <h2 class="input-name">Email</h2>
            <div class="input-wrapper">
                <input type="text" class="input" bind:value={email}>
            </div>
        </div>
        <div class="input-section">
            <h2 class="input-name">Password</h2>
            <div class="input-wrapper">
                <input type={isPasswordVisible ? 'text' : 'password'} class="input" style="border-top-right-radius: 0; border-bottom-right-radius: 0;" bind:value={password}>
                <button class="togglePW" on:click={showHidePassword}><span class="material-symbols-rounded">{isPasswordVisible ? 'visibility_off' : 'visibility'}</span></button>
            </div>
        </div>
    </div>
    <button class="button login" on:click={handleSubmit}>Login</button>
</div>

{#if error}
    <div class="message-popup error-popup">
        <h1 class="popup-message">{error}</h1>
        <span class="material-symbols-rounded error-popup-icon">error</span>
    </div>
{/if}

<style>
    @import "$lib/style/global.css";
    @import "$lib/style/login.css";
</style>
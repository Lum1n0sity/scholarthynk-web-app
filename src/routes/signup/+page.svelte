<script>
    import {browser} from '$app/environment';
    import logo from '$lib/assets/logo.svg';
    import {hashPassword} from "$lib/js/user.js";

    // Error handling
    let error = '';
    let timeout;

    function showErrorMsg(err) {
        error = err
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            error = '';
        }, 5000);
    }

    let isPasswordVisible = false;

    let name;
    let email;
    let password;

    async function handleSubmit() {
        let hashedPassword = await hashPassword(password);

        const userData = JSON.stringify({
            name: name,
            email: email,
            password: hashedPassword,
        });

        const response = await fetch('http://localhost:3000/api/user/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: userData
        });

        if (response.status === 200) {
            const data = await response.json();
            if (browser) {
                localStorage.setItem('authToken', data.authToken);
                window.location.href = '/onboarding';
            }
        } else if (response.status === 400) {
            showErrorMsg("Invalid input!");
        } else if (response.status === 409) {
            showErrorMsg("User already exists!");
        } else if (response.status === 500) {
            showErrorMsg("Error signing up!");
        } else {
            showErrorMsg("Unexpected error!");
        }
    }

    function showHidePassword() {
        isPasswordVisible = !isPasswordVisible;
    }
</script>

<div class="body">
    <div class="nav-bar">
        <a href="/" class="logo">
            <img src={logo} alt="logo" class="logo-img"/>
            <h1 class="logo-name">SCHOLARTHYNK</h1>
        </a>
        <h1 class="page-title">Sign Up</h1>
    </div>
    <div class="input-wrapper top-wrapper">
        <h1 class="input-name">Name</h1>
        <input type="text" class="input" bind:value={name}>
    </div>
    <div class="input-wrapper">
        <h1 class="input-name">E-Mail</h1>
        <input type="email" class="input" bind:value={email}>
    </div>
    <div class="input-wrapper input-wrapper-pw">
        <h1 class="input-name">Password</h1>
        <div class="password-wrapper">
            <input type={isPasswordVisible ? 'text' : 'password'} class="input input-password" bind:value={password}>
            <button class="show-hide-btn" on:click={showHidePassword}><span
                    class="material-symbols-rounded show-hide-icon">{isPasswordVisible ? 'visibility_off' : 'visibility'}</span>
            </button>
        </div>
    </div>
    <button class="button signup" on:click={handleSubmit}>Sign Up</button>
</div>

{#if error}
    <div class="message-popup error-popup">
        <h1 class="popup-message">{error}</h1>
        <span class="material-symbols-rounded error-popup-icon">error</span>
    </div>
{/if}

<style>
    @import "$lib/style/global.css";
    @import "$lib/style/signup.css";
</style>
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

    let email;
    let password;

    function showHidePassword() {
        isPasswordVisible = !isPasswordVisible;
    }

    async function handleSubmit() {
        let hashedPassword = await hashPassword(password);

        const userData = JSON.stringify({
            email: email,
            password: hashedPassword,
        });

        fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: userData
        })
            .then(response => {
                if (response.status != 200) {
                    response.json().then(data => {
                        showErrorMsg(data.error);
                    });
                    return;
                }
                return response.json();
            })
            .then(data => {
                if (browser && data.authToken) {
                    localStorage.setItem('authToken', data.authToken);
                    window.location.href = '/home';
                } else {
                    showErrorMsg('An error occurred. Please try again later.');
                }
            })
            .catch(error => {
                showErrorMsg(error);
            });
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
                <input type="password" class="input" style="border-top-right-radius: 0; border-bottom-right-radius: 0;" bind:value={password}>
                <button class="togglePW" on:click={showHidePassword}><span class="material-symbols-rounded">{isPasswordVisible ? 'visibility_off' : 'visibility'}</span></button>
            </div>
        </div>
    </div>
    <button class="button login" on:click={handleSubmit}>Login</button>
</div>

{#if error}
    <div class="error-wrapper">
        <h1 class="error">{error}</h1>
    </div>
{/if}

<style>
    @import "$lib/style/global.css";
    @import "$lib/style/login.css";
</style>
<script>
    import {onMount} from 'svelte';
    import logo from '$lib/assets/logo.svg';
    import github from '$lib/assets/Landingpage/github-dark.svg';

    let terms = '';

    onMount(async () => {
        terms = await getTermsOfService();
    });

    async function getTermsOfService() {
        try {
            const response = await fetch('/src/lib/assets/Onboarding/ToS-DEV.txt');
            if (response.ok) {
                return await response.text();
            } else {
                return 'Failed to load Terms of Service';
            }
        } catch (error) {
            return 'Failed to load Terms of Service';
        }
    }
</script>

<div class="body">
    <div class="nav-bar-landing">
        <a href="/" class="logo-landing">
            <img src={logo} alt="logo" class="logo-img-landing"/>
            <h1 class="logo-name-landing">SCHOLARTHYNK</h1>
        </a>
        <div class="button-group-landing">
            <a href="/login" class="button-landing login-landing">Login</a>
            <a href="/signup" class="button-landing signup-landing">Sign Up</a>
        </div>
    </div>
    <p class="terms">{@html terms}</p>
    <div class="footer-landing">
        <div class="footer-left">
            <img src={logo} alt="logo" class="logo-img-landing">
            <a href="/terms" class="footer-links">Terms of Service</a>
            <a href="/privacy" class="footer-links">Privacy Policy</a>
        </div>
        <div class="footer-right">
            <a href="https://github.com/Lum1n0sity/scholarthynk-web-app" class="github-link"><img src={github} alt="github logo"></a>
        </div>
    </div>
</div>

<style>
    @import "$lib/style/landing.css";

    * {
        font-family: 'Inter', sans-serif;
        margin: 0;
        padding: 0;
    }

    *::-webkit-scrollbar {
        width: 5px;
    }

    *::-webkit-scrollbar-track {
        background: transparent;
        border-radius: 8px;
    }

    *::-webkit-scrollbar-thumb {
        background: #dadada;
        border-radius: 8px;
        cursor: pointer;
    }

    *::-webkit-scrollbar-thumb:hover {
        background: #dadada;
    }

    .body {
        position: absolute;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: #171717 !important;
        display: flex;
        flex-direction: column;
        align-items: center;
        overflow-x: hidden;
        overflow-y: auto;
    }

    .terms {
        color: #fff;
        font-size: 1.5rem;
        margin-top: 2%;
        margin-bottom: 2%;
        margin-left: 10%;
        margin-right: 10%;
    }
</style>
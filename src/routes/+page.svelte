<script>
    import { onMount } from 'svelte';
    import logo from '$lib/assets/logo.svg';
    import descImg from '$lib/assets/Landingpage/desc-img.png';
    import github from '$lib/assets/Landingpage/github-dark.svg';
    import assignmentsImg from '$lib/assets/Landingpage/assignments.png';
    import calendarImg from '$lib/assets/Landingpage/important-dates.png';
    import noteEditor from '$lib/assets/Landingpage/notes.png'
    import recommendations from '$lib/assets/Landingpage/recomendations.png';

    let authToken = '';

    onMount(() => {
        authToken = localStorage.getItem('authToken') || '';
        verifyToken();
    });

    function verifyToken() {
        if (authToken) {
            fetch('http://localhost:3000/api/user/verify', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
            })
                .then(response => {
                    if (response.status !== 200) {
                        localStorage.removeItem('authToken');
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        window.location.href = '/home';
                    }
                })
                .catch(error => {
                    console.error(error);
                });
        }
    }
</script>

<div class="body">
    <div class="nav-bar-landing">
        <div class="logo-landing">
            <img src={logo} alt="logo" class="logo-img-landing"/>
            <h1 class="logo-name-landing">SCHOLARTHYNK</h1>
        </div>
        <div class="button-group-landing">
            <a href="/login" class="button-landing login-landing">Login</a>
            <a href="/signup" class="button-landing signup-landing">Sign Up</a>
        </div>
    </div>
    <div class="content-landing">
        <img src={descImg} alt="Image of the dashboard" class="desc-img-landing">
        <div class="section">
            <div class="s1-l">
                <h1 class="section-title s1-title">Stay on Top of Your Tasks</h1>
                <p class="section-text s1-text">Never miss a deadline again. Manage your assignments effortlessly with an intuitive dashboard that helps you track and complete tasks with ease.</p>
            </div>
            <img src={assignmentsImg} alt="An image of the assignments section" class="section-img s1-img">
        </div>
        <div class="section">
            <img src={calendarImg} alt="An image of the assignments section" class="section-img s2-img">
            <div class="s1-l">
                <h1 class="section-title s1-title">Your Calendar, Smarter</h1>
                <p class="section-text s1-text">Plan ahead with our integrated calendar. Quickly view all events for any selected date and stay organized every step of your way.</p>
            </div>
        </div>
        <div class="section">
            <div class="s1-l">
                <h1 class="section-title s1-title">Your Thoughts, organized</h1>
                <p class="section-text s1-text">Capture ideas and class notes directly in Scholarthynk. Our note editor makes it easy to organize and access your study materials anytime.</p>
            </div>
            <img src={noteEditor} alt="An image of the assignments section" class="section-img s1-img">
        </div>
        <div class="section">
            <img src={recommendations} alt="An image of the assignments section" class="section-img s2-img">
            <div class="s1-l">
                <h1 class="section-title s1-title">Study Smarter, Not Harder</h1>
                <p class="section-text s1-text">Get personalized study suggestions based on your upcoming tests and assignments. Scholarthynk helps you focus on what matters most - no extra planning required.</p>
            </div>
        </div>
        <div class="section cfa">
            <h1 class="section-title cfa-title">Join Scholarthynk now and transform the way you manage your school life!</h1>
            <a href="/signup" class="join-btn">Join</a>
        </div>
    </div>
    <div class="footer-landing">
        <div class="footer-left">
            <img src={logo} alt="logo" class="logo-img-landing">
            <a href="/" class="footer-links">Terms of Service</a>
            <a href="/" class="footer-links">Privacy Policy</a>
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

</style>
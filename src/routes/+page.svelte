<script>
    import { onMount } from 'svelte';
    import logo from '$lib/assets/logo.svg';
    import descImg from '$lib/assets/Landingpage/desc-img.png';

    let authToken = '';

    onMount(() => {
        authToken = localStorage.getItem('authToken') || '';
        verifyToken();
    });

    console.log(authToken);

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
    <div class="nav-bar">
        <div class="logo">
            <img src={logo} alt="logo" class="logo-img"/>
            <h1 class="logo-name">SCHOLARTHYNK</h1>
        </div>
        <div class="button-group">
            <a href="/login" class="button login">Login</a>
            <a href="/signup" class="button signup">Sign Up</a>
        </div>
    </div>
    <h1 class="title">Mange Your Study Sessions With <span class="underline">Ease</span></h1>
    <div class="promotion-wrapper">
        <span class="material-symbols-rounded analytics-icon">analytics</span>
        <h2>Track assignments, plan study sessions, and stay organized.</h2>
    </div>
    <a href="/signup" class="button get-started">Get Started</a>
    <div class="desc-wrapper">
        <img class="desc-img" src={descImg} alt="the app">
        <div class="desc-text-wrapper">
            <h3 class="desc-text"><span class="underline">Timetable Management</span> - Create and manage your weekly study schedule with ease.</h3>
            <h3 class="desc-text"><span class="underline">Assignment Tracker</span> - Keep track of assignments and due dates.</h3>
            <h3 class="desc-text"><span class="underline">Notes</span> - Save your class notes and access them anytime.</h3>
        </div>
    </div>
</div>

<style>
    .material-symbols-rounded {
        font-family: 'Material Symbols Rounded';
        font-weight: normal;
        font-style: normal;
        display: inline-block;
        line-height: 1;
        text-transform: none;
        letter-spacing: normal;
        word-wrap: normal;
        white-space: nowrap;
        direction: ltr;
    }

    * {
        font-family: 'Inter', sans-serif;
        margin: 0;
        padding: 0;
    }

    .body {
        position: absolute;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: linear-gradient(0deg, rgba(255,255,255,1) 20%, rgba(201,201,201,1) 100%) !important;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .nav-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background-color: #ffffff;
        width: 100%;
        height: 12%;
        border-bottom: 1px solid #C9C9C9;
    }

    .logo {
        cursor: pointer !important;
        display: flex;
        align-items: center;
    }

    .logo-img {
        width: 15%;
        height: auto;
        margin-right: 1rem;
    }

    .logo-name {
        font-size: 3rem;
        font-weight: 700;
        color: #E65A41;
    }

    .button-group {
        display: flex;
        align-items: center;
        justify-content: space-evenly;
        margin-right: 1rem;
        width: 20%;
        height: 80%;
    }

    .button {
        color: white;
        width: 43%;
        height: 60%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        border-radius: 6px;
        cursor: pointer;
        text-decoration: none;
    }

    .login {
        background-color: #10222F;
        font-weight: bold;
    }

    .signup {
        background-color: #E65A41;
        font-weight: bold;
    }

    .title {
        color: #E65A41;
        font-weight: bold;
        font-size: 3rem;
        margin-top: 2%;
    }

    .underline {
        text-decoration: underline;
        text-underline-offset: 0.6rem;
    }

    .analytics-icon {
        font-size: 8rem;
        color: #E65A41;
        font-weight: 700;
    }

    .promotion-wrapper {
        display: flex;
        flex-direction: row;
        align-items: center;
        margin-top: 2%;
        width: 35%;
    }

    .promotion-wrapper h2 {
        font-size: 2.2rem;
        font-weight: 500;
        color: black;
        margin-left: 1rem;
        font-weight: bold;
    }

    .get-started {
        background-color: #E65A41;
        color: white;
        font-size: 2.5rem;
        font-weight: bold;
        border-radius: 6px;
        margin-top: 2%;
        width: 15%;
        height: 8%;
        box-shadow: 0px 0px 93.7px 2px rgba(0,0,0,0.47);
    }

    .desc-wrapper {
        width: 88%;
        height: 40%;
        background-color: #E65A41;
        margin-top: 3%;
        border-radius: 10px;
        display: flex;
        flex-direction: row;
        align-items: center;
    }

    .desc-img {
        width: 45%;
        height: 100%;
        background-size: cover;
        background-position: center;
        border-radius: 10px 0 0 10px;
    }

    .desc-text-wrapper {
        width: 60%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        display: flex;
        flex-direction: column;
        justify-content: space-evenly;
        margin-left: 2%;
    }

    .desc-text {
        color: #fff;
        font-size: 2.4rem;
        font-weight: bold;
        line-height: 1.3;
    }
</style>
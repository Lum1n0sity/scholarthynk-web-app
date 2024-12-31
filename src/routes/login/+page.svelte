<script>
  import { browser } from '$app/environment';
  import logo from '$lib/assets/logo.png';
  let isRememberChecked = false;
  let isPasswordVisible = false;

  let error = '';
  let timeout;

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
      remember: isRememberChecked,
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
          //window.location.href = '/home';
        } else {
          console.log('no token');
          //window.location.href = '/home';
        }
      })
      .catch(error => {showErrorMsg(error);});
  }

  async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  function showErrorMsg(err) {
    error = err
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      error = '';
    }, 5000);
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
  <div class="input-wrapper top-wrapper">
    <h1 class="input-name">E-Mail</h1>
    <input type="email" class="input" bind:value={email}>
  </div>
  <div class="input-wrapper input-wrapper-pw">
    <h1 class="input-name">Password</h1>
    <div class="password-wrapper">
      <input type={isPasswordVisible ? 'text' : 'password'} class="input input-password" bind:value={password}>
      <button class="show-hide-btn" on:click={showHidePassword}><span class="material-symbols-rounded show-hide-icon">{isPasswordVisible ? 'visibility_off' : 'visibility'}</span></button>
    </div>
  </div>
  <label>
    <input type="checkbox" class="material-symbols-rounded" bind:checked={isRememberChecked}>
    <span class="custom-checkbox"></span>
    Remember Me
  </label>
  <button class="button login" on:click={handleSubmit}>Login</button>
</div>

{#if error}
  <div class="error-wrapper">
    <h1 class="error">{error}</h1>
  </div>
{/if}

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

  .error-wrapper {
    width: 25%;
    height: 10%;
    background-color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    position: absolute;
    bottom: 5%;
    right: 3%;
    border-right: 5px solid #E65A41;
    box-shadow: 0px 0px 93.7px 2px rgba(0,0,0,0.47);
    transition: .5s;
    display: flex;
  }

  .error {
    font-size: 2.5rem;
    padding-left: 2%;
  }

  .nav-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #ffffff;
    width: 95%;
    height: 12%;
    margin-top: 2.5%;
    border-radius: 10px;
  }

  .logo {
    display: flex;
    align-items: center;
    text-decoration: none;
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

  .page-title {
    font-size: 3rem;
    font-weight: 700;
    color: #E65A41;
    margin-right: 2%;
  }

  .top-wrapper {
    margin-top: 5% !important;
  }

  .input-wrapper {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin-top: 3%;
    width: 40%;
    height: 12%;
  }

  .input {
    background-color: #C2C2C2;
    border: none;
    outline: none;
    width: 100%;
    height: 100%;
    border-radius: 10px;
    margin-top: 1%;
    font-size: 3rem;
    padding: 2%;
  }

  .input-name {
    font-size: 2.7rem;
    font-weight: bold;
  }

  .input-wrapper-pw {
    height: 15%;
    width: 41.7%;
    margin-left: 1.6%;
  }

  .password-wrapper {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    width: 100%;
    height: 100%;
    margin-top: .5%;
  }

  .input-password {
    width: 90%;
    height: 100%;
    margin: 0;
    padding: 0;
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
    padding-left: 2%;
  }

  .show-hide-btn {
    display: flex;
    align-items: center;
    justify-content: center;    
    border-top-right-radius: 10px;
    border-bottom-right-radius: 10px;
    border: none;
    outline: none;
    background-color: #C2C2C2;
    margin-left: auto;
    width: 13%;
    height: 100%;
    border-left: 1px solid #000;
    cursor: pointer;
  }

  .show-hide-icon {
    font-size: 4rem;
    font-weight: bold;
  }

  label {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    width: 40%;
    height: 10%;
    margin-top: 1%;
  }

  input[type="checkbox"] {
    display: none;
  }

  /* Custom checkbox container */
  .custom-checkbox {
    width: 7%;
    height: 54%;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    position: relative;
    cursor: pointer;
    background-color: #C2C2C2;
    margin-right: 1%;
  }

  /* Add a checkmark when checked */
  input[type="checkbox"]:checked + .custom-checkbox::after {
    content: "";
    display: inline-block;
    font-family: 'Material Symbols Rounded';
    font-weight: normal;
    font-style: normal;
    font-size: 3rem;
    color: white;
    content: 'check'
  }

  /* Background color for checked state */
  input[type="checkbox"]:checked + .custom-checkbox {
    background-color: #E65A41;
  }

  label {
    font-size: 2.7rem;
    font-weight: bold;
  }

  .button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 15%;
    height: 10%;
    background-color: #E65A41;
    border: none;
    outline: none;
    border-radius: 10px;
    margin-top: 2%;
    cursor: pointer;
  }

  .login {
    font-size: 2.7rem;
    font-weight: bold;
    color: white;
    margin-top: 4% !important;
  }
</style>
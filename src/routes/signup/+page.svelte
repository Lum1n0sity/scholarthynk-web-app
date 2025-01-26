<script>
  import { browser } from '$app/environment';
  import logo from '$lib/assets/logo.svg';
  let isPasswordVisible = false;

  let error = '';
  let timeout;

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

    fetch('http://localhost:3000/api/signup', {
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
      if (browser) {
        localStorage.setItem('authToken', data.authToken);
        window.location.href = '/onboarding';
      }
    })
    .catch(error => {showErrorMsg(error);});
  };

  function showHidePassword() {
    isPasswordVisible = !isPasswordVisible;
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
      <button class="show-hide-btn" on:click={showHidePassword}><span class="material-symbols-rounded show-hide-icon">{isPasswordVisible ? 'visibility_off' : 'visibility'}</span></button>
    </div>
  </div>
  <button class="button signup" on:click={handleSubmit}>Sign Up</button>
</div>

{#if error}
  <div class="error-wrapper">
    <h1 class="error">{error}</h1>
  </div>
{/if}

<style>
  @import "$lib/style/global.css";
  @import "$lib/style/signup.css";
</style>
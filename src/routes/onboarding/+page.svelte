<script>
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import logo from '$lib/assets/logo.svg';

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

  async function openTosPPPopupHandler(popupType) {
    openTosPPPopup = true;
    popupTitle = popupType;

    if (popupType == "Terms of Service") {
      try {
        const response = await fetch('/src/lib/assets/ToS-DEV.txt');
        if (response.ok) {
          popupText = await response.text();
        } else {
          popupText = 'Failed to load Terms of Service';
        }
      } catch (error) {
        console.error(error);
        showErrorMsg(error);
      }
    } else if (popupType == "Privacy Policy") {
      try {
        const response = await fetch('/src/lib/assets/PP-DEV.txt');
        if (response.ok) {
          popupText = await response.text();
        } else {
          popupText = 'Failed to load Privacy Policy';
        }
      } catch (error) {
        console.error(error);
        showErrorMsg(error);
      }
    }
  }

  function openDeleteWarningPopupHandler() {
    openDeleteWarningPopup = true;
  }

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
         console.error(error);
         showErrorMsg(error);
       })
      } catch (error) {
        console.error(error);
        showErrorMsg(error);
      }
    }
  }

  function closeTosPPPopupHandler() {
    openTosPPPopup = false;
    popupText = '';
    popupTitle = '';
  }

  function closeDeleteWarningPopupHandler() {
    openDeleteWarningPopup = false;
  }

  function tosPPContinue() {
    if (isToSChecked && isPPChecked) {
      displayToSPPSection = false;
      displayProfilePicSection = true;
      generateProfilePic();
    }
  }

  function selectProfilePic() {
    fileInput.click();
  }

  function handleFileChange() {
    file = event.target.files[0];
    if (file) {
      imgWrapper.innerHTML = '';
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.borderRadius = '6px';
      imgWrapper.appendChild(img);
    } else {
      showErrorMsg('Unable to select file');
    }
  }

  function dataURLToBlob(dataURL) {
    const byteString = atob(dataURL.split(',')[1]);
    const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];

    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ab], { type: mimeString });
  }

  async function skipProfilePic() {
    if (imgWrapper && imgWrapper.firstChild)  {
      const canvas = imgWrapper.firstChild;

      const dataURL = canvas.toDataURL('image/png');
      const blob = dataURLToBlob(dataURL);

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
        console.error(error);
        showErrorMsg(error);
      }
    }
  }

  async function continueProfilePic() {
    if (file) {
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
        console.error(error);
        showErrorMsg(error);
      }
    } else {
       await skipProfilePic();
    }
  }

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

            const bgColor = generateBgColor();
            ctx.fillStyle = bgColor;
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
        console.error(error);
        showErrorMsg(error);
      }
    }
  }

  function generateBgColor() {
    let color;
    let brightness;
    do {
        // Generate a random hex color
        color = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;

        // Calculate the brightness by summing the RGB values
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        brightness = (r * 299 + g * 587 + b * 114) / 1000;
    } while (brightness < 125 || brightness > 220); // Avoid colors that are too dark or too light

    return color;
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
        <button class="button" on:click={async () => await openTosPPPopupHandler("Terms of Service")}>Read Terms of Service</button>
      </div>
      <div class="pp-wrapper">
        <label>
          <input type="checkbox" class="material-symbols-rounded" bind:checked={isPPChecked}>
          <span class="custom-checkbox pp-box"></span>
          Accept Privacy Policy
        </label>
        <button class="button" on:click={async () => await openTosPPPopupHandler("Privacy Policy")}>Read Privacy Policy</button>
      </div>
      <div class="button-wrapper">
        <button class="back" on:click={openDeleteWarningPopupHandler}><span class="material-symbols-rounded">arrow_back</span> <p>Back</p></button>
        <button class="continue" on:click={tosPPContinue}><p>Continue</p> <span class="material-symbols-rounded">arrow_forward</span></button>
      </div>
    </div>
  {/if}
  {#if displayProfilePicSection}
    <div class="profile-pic-wrapper">
      <h1 class="wrapper-title">Upload your Profile Picture</h1>
      <div class="img-wrapper" bind:this={imgWrapper}>
      </div>
      <div class="button-wrapper profile-pic-btn-wrapper">
        <button class="button skip" on:click={skipProfilePic}>Skip</button>
        <button class="button upload" on:click={selectProfilePic}>Upload</button>
        <button class="button continue continue-profile-pic" on:click={continueProfilePic}><p>Continue</p> <span class="material-symbols-rounded">arrow_forward</span></button>
      </div>
      <input type="file" bind:this={fileInput} on:change={handleFileChange} style="display: none;" />
    </div>
  {/if}
</div>

{#if openDeleteWarningPopup}
  <div class="popup-wrapper delete-warning">
    <div class="delete-warning-popup">
      <h1 class="popup-title">Warning!</h1>
      <h2 class="popup-text">Going back will delete your account!</h2>
      <div class="warning-button-wrapper">
        <button class="button cancel" on:click={closeDeleteWarningPopupHandler}>Cancel</button>
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
        <button class="close-btn" on:click={closeTosPPPopupHandler}><span class="material-symbols-rounded">close</span></button>
      </div>
      <div class="popup-content">
        <p class="popup-text">{@html popupText}</p>
      </div>
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
  @import "$lib/style/onboarding.css";

  .body {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
</style>
<script>
    import logo from '$lib/assets/logo.svg';
    import {onMount} from 'svelte';
    import {getAuthToken, logout} from "$lib/js/auth.js";
    import {getUserData, getProfilePic, displayUserCardHandler, newNotificationU} from "$lib/js/user.js";
    import {notifications, addNotification, clearNotifications} from "$lib/js/notifications.js";
    import {getFullCurrentDate} from "$lib/js/utils.js";

    const authToken = getAuthToken();

    let profilePicture = '';

    let username = '';
    let email = '';

    let displayUserCard = false;
    let displayNotifications = false;

    let messageQueue = [];
    let displayMessage = false;
    let popupMessage = '';
    let popupType = '';

    let displayNewNotification = false;
    let isAdmin = false;

    /**
     * Adds a new notification to the notification queue and displays it immediately if the queue was previously empty
     *
     * The notification will be added to the top of the queue and will be displayed immediately if the queue was previously empty.
     * If the queue was not empty, the notification will be added to the top of the queue and will be displayed once the previous message has been displayed for 5 seconds.
     *
     * @function newNotificationNotes
     * @param {string} type - The type of the notification. Can be "error", "warning", or "info".
     * @param {string} title - The title of the notification.
     * @param {string} message - The message of the notification.
     */
    function newNotification(type, title, message) {
        addNotification(type, title, message, getFullCurrentDate());
        displayNewNotification = true;

        messageQueue.push({type, title, message});
        if (!displayMessage) {
            showNextMessage();
        }
    }

    // Pass newNotification function to external js files
    newNotificationU(newNotification);

    /**
     * Displays the next message in the queue, or does nothing if the queue is empty
     *
     * When called, the function will display the next message in the queue and start a timer.
     * When the timer expires, the function will hide the current message and call itself again.
     *
     * @function showNextMessage
     */
    function showNextMessage() {
        if (messageQueue.length === 0) return;

        const nextMessage = messageQueue.shift();
        popupMessage = nextMessage.title;
        popupType = nextMessage.type;
        displayMessage = true;

        setTimeout(() => {
            displayMessage = false;
            showNextMessage();
        }, 5000);
    }

    onMount(async () => {
        let userData = await getUserData(authToken);
        username = userData.username;
        email = userData.email;
        isAdmin = userData.role === "admin";

        profilePicture = await getProfilePic(authToken);
    });
</script>

<div class="body">
    <div class="nav-bar">
        <div class="logo">
            <img src={logo} alt="logo" class="logo-img"/>
            <h1 class="logo-name">SCHOLARTHYNK</h1>
        </div>
        <div class="button-group-nav-admin">
            <a href="/home" class="nav">Dashboard</a>
            <a href="/notes" class="nav">Notes</a>
            <!-- svelte-ignore a11y_img_redundant_alt -->
            <button class="profile-pic" on:click={() => {displayUserCard = displayUserCardHandler(displayUserCard)}}>
                <img src={profilePicture}
                     alt="Your Profile Picture"
                     class="profile-pic-img"/></button>
        </div>
    </div>
</div>

{#if displayUserCard}
    <div class="user-card">
        <div class="upper-section"></div>
        <!-- svelte-ignore a11y_img_redundant_alt -->
        <img src={profilePicture} alt="Your Profile Picture" class="card-profile-pic">
        <div class="card-user-data">
            <h2>{username}</h2>
            <p>{email}</p>
        </div>
        <div class="card-fabs">
            <button class="card-fab">
                <span class="material-symbols-rounded">group</span>
            </button>
            <button class="card-fab">
                <span class="material-symbols-rounded">settings</span>
            </button>
            <button class="card-fab"
                    on:click={() => {displayNotifications = true; displayUserCard = false; displayNewNotification = false; displayMessage = false;}}>
                <span class="material-symbols-rounded">{displayNewNotification ? 'notifications_unread' : 'notifications'}</span>
            </button>
            <button class="card-fab" on:click={logout}>
                <span class="material-symbols-rounded">logout</span>
            </button>
        </div>
        <div class="card-btns">
            <button class="card-btn dark-light-toggle"><span class="material-symbols-rounded">contrast</span>
                <p>Dark/Light Mode</p></button>
            <button class="card-btn switch-account"><span class="material-symbols-rounded">switch_account</span>
                <p>Switch Account</p></button>
        </div>
    </div>
{/if}

{#if displayNotifications}
    <div class="notifications">
        <div class="notifications-header">
            <h2 class="notifications-title">Notifications</h2>
            <button class="notifications-close" on:click={displayNotifications = false}><span
                    class="material-symbols-rounded">remove</span></button>
        </div>
        {#if $notifications.length > 0}
            <button class="notifications-clear" on:click={() => {clearNotifications()}}><span
                    class="material-symbols-rounded">delete</span> Clear
            </button>
        {/if}
        <div class="notifications-list">
            {#each $notifications as notification}
                {#if notification.type === "error"}
                    <div class="notification notifications-error">
                        <h3 class="notification-title notifications-content"
                            style="grid-area: notification-title;">{notification.title}:</h3>
                        <p class="notifications-message notifications-content"
                           style="grid-area: notification-msg;">{notification.message}</p>
                        <p class="notifications-timestamp notifications-content"
                           style="grid-area: notification-timestamp;">{notification.timestamp}</p>
                        <span class="material-symbols-rounded error-icon"
                              style="grid-area: notification-icon;">error</span>
                    </div>
                {:else if notification.type === "warning"}
                    <div class="notification notifications-warning">
                        <h3 class="notification-title notifications-content"
                            style="grid-area: notification-title;">{notification.title}:</h3>
                        <p class="notifications-message notifications-content"
                           style="grid-area: notification-msg;">{notification.message}</p>
                        <p class="notifications-timestamp notifications-content"
                           style="grid-area: notification-timestamp;">{notification.timestamp}</p>
                        <span class="material-symbols-rounded warning-icon" style="grid-area: notification-icon;">warning</span>
                    </div>
                {:else if notification.type === "info"}
                    <div class="notification notifications-info">
                        <h3 class="notification-title notifications-content"
                            style="grid-area: notification-title;">{notification.title}:</h3>
                        <p class="notifications-message notifications-content"
                           style="grid-area: notification-msg;">{notification.message}</p>
                        <p class="notifications-timestamp notifications-content"
                           style="grid-area: notification-timestamp;">{notification.timestamp}</p>
                        <span class="material-symbols-rounded info-icon"
                              style="grid-area: notification-icon;">info</span>
                    </div>
                {/if}
            {/each}
        </div>
    </div>
{/if}

{#if displayMessage}
    <button class="message-popup {popupType === 'error' ? 'error-popup' : popupType === 'warning' ? 'warning-popup' : 'info-popup'}"
            on:click={() => {displayNotifications = true; displayUserCard = false; displayNewNotification = false; displayMessage = false;}}>
        <h1 class="popup-message">{popupMessage}</h1>
        <span class="material-symbols-rounded {popupType === 'error' ? 'error-popup-icon' : popupType === 'warning' ? 'warning-popup-icon' : 'info-popup-icon'}">{popupType === "error" ? "error" : popupType === "warning" ? "warning" : "info"}</span>
    </button>
{/if}

<style>
    @import "$lib/style/global.css";
    @import "$lib/style/admin.css";
</style>
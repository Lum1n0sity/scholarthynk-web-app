<script>
    import logo from '$lib/assets/logo.svg';
    import {onMount} from 'svelte';
    import {goto} from "$app/navigation";
    import {getAuthToken, logout} from "$lib/js/auth.js";
    import {getUserData, getProfilePic, displayUserCardHandler, newNotificationU} from "$lib/js/user.js";
    import {notifications, addNotification, clearNotifications} from "$lib/js/notifications.js";
    import {formatDate, getFullCurrentDate} from "$lib/js/utils.js";
    import {newNotificationAM, getLogs, updateLogSorting, translateLogLevel, deleteLog, deleteAllLogs} from "$lib/js/admin/logs.js";

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
    newNotificationAM(newNotification);

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
        if (userData.role !== "admin") {
            goto('/home');
            newNotification("error", "Unauthorized", "You are not authorized to access the admin page! If you keep trying to do so, your account will be disabled by the system.");
        }

        profilePicture = await getProfilePic(authToken);

        await loadLogs();
    });

    $: logsSortType, displayedLogs = updateLogSorting(logs, logsSortType);

    let logs;
    let displayedLogs;
    let logsSortType = "displayAll";

    let logMessage = "";
    let logType = "info";
    let logEndpoint = "";
    let logMethod = "";
    let logId = "";

    let isLogModalOpen = false;
    let isMaintenanceEnabled = false;
    let isForceLogoutEnabled = false;
    let isRegistrationsDisabled = false;
    let isUserModalOpen = false;

    function openLogModal(index) {
        isLogModalOpen = true;
        logMessage = displayedLogs[index].msg;
        logType = translateLogLevel(displayedLogs[index].level);
        logId = displayedLogs[index].id;

        if ('url' in displayedLogs[index] && displayedLogs[index].url !== "") {
            logEndpoint = displayedLogs[index].url;
        } else if (displayedLogs[index].msg === "Server running on port 3000" || displayedLogs[index].msg === "MongoDB connected!") {
            logEndpoint = "SERVER-START";
        } else if (displayedLogs[index].msg.includes("Cron")) {
            logEndpoint = "CRON-JOB";
        } else {
            logEndpoint = "NONE";
        }

        if ('method' in displayedLogs[index] && displayedLogs[index].method !== "") {
            logMethod = displayedLogs[index].method;
        } else {
            logMethod = "NONE";
        }
    }

    async function handleLogDelete() {
        const success = await deleteLog(logId);

        if (success) {
            await loadLogs();
            handleLogModalClose();
        }
    }

    function handleLogModalClose() {
        isLogModalOpen = false;

        logMessage = "";
        logType = "info";
        logEndpoint = "";
        logMethod = "";
        logId = "";
    }

    async function handleDeleteALlLogs() {
        const success = await deleteAllLogs();

        if (success) {
            await loadLogs();
        }
    }

    async function loadLogs() {
        logs = await getLogs();
        logs = logs.logs.reverse();
        displayedLogs = logs;
        logsSortType = "displayAll";
    }
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
    <div class="dashboard-content">
        <div class="logs-column">
            <h1 class="logs-title">Logs</h1>
            <div class="logs">
                {#each displayedLogs as log, index (log.id)}
                    <div class="log-item" on:click={() => {openLogModal(index)}}>
                        <span class="material-symbols-rounded log-icon">{translateLogLevel(log.level)}</span>
                        <h2 class="log-item-title">{log.msg}</h2>
                        <h2 class="log-item-date">{formatDate(log.time)}</h2>
                    </div>
                {/each}
            </div>
            <div class="log-actions">
                <select class="sort-method" bind:value={logsSortType}>
                    <option value="displayAll">Display All</option>
                    <option value="traceOnly">Trace Only</option>
                    <option value="debugOnly">Debug Only</option>
                    <option value="infoOnly">Info Only</option>
                    <option value="warningOnly">Warnings Only</option>
                    <option value="errorOnly">Errors Only</option>
                    <option value="fatalsOnly">Fatals Only</option>
                </select>
                <button class="delete-logs" on:click={handleDeleteALlLogs}>Clear Logs</button>
                <button class="refresh-logs" on:click={loadLogs}><span class="material-symbols-rounded">refresh</span></button>
            </div>
        </div>
        <div class="statistic-column">
            <div class="uptime">
                <h2 class="statistic-title">Uptime</h2>
            </div>
            <div class="error-count">
                <h2 class="statistic-title">Error count</h2>
            </div>
            <a href="/admin" class="statistic-view-all">View All</a>
        </div>
        <div class="users-maintenance-column">
            <div class="users">
                <h1 class="users-title">Users</h1>
                <div class="user-list-wrapper">
                    <div class="user-search">
                        <input type="text" class="user-search-input" placeholder="Username...">
                        <button class="search"><span class="material-symbols-rounded">search</span></button>
                    </div>
                    <div class="user-item" on:click={isUserModalOpen = true}>
                        <h2 class="username">Username</h2>
                        <div class="user-actions">
                            <button class="user-action"><span class="material-symbols-rounded">settings</span></button>
                            <button class="user-action"><span class="material-symbols-rounded">account_circle_off</span></button>
                            <button class="user-action"><span class="material-symbols-rounded">add_moderator</span></button>
                            <button class="user-action user-action-delete"><span class="material-symbols-rounded">delete</span></button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="maintenance">
                <div class="checkboxes">
                    <label>
                        <input type="checkbox" class="material-symbols-rounded" bind:checked={isMaintenanceEnabled}>
                        <span class="custom-checkbox pp-box"></span>
                        Maintenance Mode
                    </label>
                    <label>
                        <input type="checkbox" class="material-symbols-rounded" bind:checked={isForceLogoutEnabled}>
                        <span class="custom-checkbox pp-box"></span>
                        Force logout all users
                    </label>
                    <label>
                        <input type="checkbox" class="material-symbols-rounded" bind:checked={isRegistrationsDisabled}>
                        <span class="custom-checkbox pp-box"></span>
                        Disable new registrations
                    </label>
                </div>
            </div>
        </div>
    </div>
</div>

{#if isUserModalOpen}
    <div class="user-modal-wrapper">
        <div class="user-modal">
            <div class="user-modal-header">
                <div class="profile-picture"></div>
                <h2 class="modal-username">Username</h2>
                <div class="modal-role">
                    <span class="material-symbols-rounded">admin_panel_settings</span>
                </div>
                <div class="close-wrapper">
                    <button class="close-user-modal" on:click={isUserModalOpen = false}><span class="material-symbols-rounded">close</span></button>
                </div>
            </div>
            <div class="info-wrapper">
                <h2>Status</h2>
                <div class="user-info">
                    <h3>Online</h3>
                </div>
            </div>
            <div class="info-wrapper">
                <h2>Last Login</h2>
                <div class="user-info">
                    <h3>07.04.2025</h3>
                </div>
            </div>
            <div class="info-wrapper">
                <h2>Email</h2>
                <!-- TODO: Add copy when email is clicked (copy to clipboard) -->
                <div class="user-info">
                    <h3>raphael221@outlook.de</h3>
                </div>
            </div>
        </div>
    </div>
{/if}

{#if isLogModalOpen}
    <div class="log-modal-wrapper">
        <div class="log-modal">
            <div class="log-header">
                <h1 class="log-title">{logMessage}</h1>
                <button class="close-modal" on:click={handleLogModalClose}><span class="material-symbols-rounded">close</span></button>
            </div>
            <div class="log-details">
                <div class="log-type">
                    <span class="material-symbols-rounded">{logType === "info" ? "info" : logType === "warning" ? "warning" : "error"}</span>
                </div>
                <div class="endpoint">
                    <p>{logEndpoint}</p>
                </div>
                <div class="method">
                    <p>{logMethod}</p>
                </div>
                <button class="delete-log" on:click={handleLogDelete}><span class="material-symbols-rounded">delete</span></button>
            </div>
            <textarea class="log-text" readonly bind:value={logMessage}></textarea>
        </div>
    </div>
{/if}

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
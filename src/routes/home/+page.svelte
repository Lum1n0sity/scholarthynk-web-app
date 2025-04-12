<script>
    import logo from '$lib/assets/logo.svg';
    import {goto} from '$app/navigation';
    import {onMount} from 'svelte';
    import {writable} from "svelte/store";
    import {getAuthToken, logout} from "$lib/js/auth.js";
    import {getUserData, getProfilePic, displayUserCardHandler, newNotificationU} from "$lib/js/user.js";
    import {
        newAssignmentData,
        addAssignment,
        getAssignments,
        updateAssignment,
        updateAssignmentsSorting,
        deleteAssignment,
        newNotificationTA
    } from '$lib/js/home/assignments.js';
    import {
        getCurrentDate,
        getMonthData,
        getFormattedCurrentDate,
        goBackMonth,
        goForwardMonth,
        getMonthsForNextYears,
        handleDateClick,
        getFullDate,
        handleNewEventClick,
        addEvent,
        getDateEvents,
        deleteEvent,
        newNotificationTC
    } from "$lib/js/home/calendar.js";
    import {notifications, addNotification, clearNotifications} from "$lib/js/notifications.js";
    import {getFullCurrentDate, formatDate, capitalizeFirstLetter} from "$lib/js/utils.js";
    import {getRecentNotes, newNotificationTN} from '$lib/js/home/notes.js';
    import {externalOpenNote, newNotificationNDM, getNotePath, externalCreateNote} from "$lib/js/notes/noteDisplayManager.js";

    const authToken = getAuthToken();

    let initialize = true;

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
    newNotificationTC(newNotification);
    newNotificationTA(newNotification);
    newNotificationTN(newNotification);
    newNotificationNDM(newNotification);
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
        selectedMonth = monthSelectOptions[0];

        currentDateDisplay = getFormattedCurrentDate();
        let monthData = getMonthData(selectedMonth);
        dates = monthData.dates;
        emptyDates = monthData.emptyDates;

        let userData = await getUserData(authToken);
        username = userData.username;
        email = userData.email;
        isAdmin = userData.role === "admin";

        profilePicture = await getProfilePic(authToken);
        assignments.set(await getAssignments(authToken, sortType));

        recentNotes = await getRecentNotes(authToken);
        initialize = false;
    });

    // Runes
    $: sortType, assignments.set(updateAssignmentsSorting($assignments, sortType));
    $: if (addAssignment && addAssignmentBtn) addAssignmentBtn.focus();
    $:{
        if (!isAddingAssignment && prevStateIsAddingAssignment) {
            getAssignmentsHelper(authToken);
            prevStateIsAddingAssignment = false;
        }
    }

    $: selectedMonth, updateCalendarHelper();

    let recentNotes = [];

    let assignments = writable([]);

    let expandedAssignment = null;

    let addAssignmentBtn;
    let prevStateIsAddingAssignment = false;
    let isAddingAssignment = false;

    let sortType = "subject";
    const subjectColors = {
        "math": "#4A90E2",
        "science": "#50E3C2",
        "german": "#D0021B",
        "history": "#8B3513",
        "geography": "#008C8C",
        "politics": "#9B4F96",
        "english": "#F8E71C",
        "pe": "#F8E71C",
        "art": "#FF33CC",
        "music": "#FFD700",
        "computer_sience": "#50B7F5",
        "religion": "#9B7DFF",
        "eac": "#636363",
        "other": "#D3D3D3"
    };

    let calendar;
    let selectedMonth = '';

    let dates = [];
    let emptyDates = [];
    let currentDateDisplay = '';

    const daysOfWeek = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const monthSelectOptions = getMonthsForNextYears();
    const monthLookup = {
        jan: 'January',
        feb: 'February',
        mar: 'March',
        apr: 'April',
        may: 'May',
        jun: 'June',
        jul: 'July',
        aug: 'August',
        sep: 'September',
        oct: 'October',
        nov: 'November',
        dec: 'December'
    };

    let clickedDate = null;
    let bottomOfCalendar = null;
    let calendarWidth;
    let eventList;
    let events;
    let eventIsEditing = false;
    let newEventName;

    /**
     * Handles the expansion of an assignment's details on click.
     *
     * @param {number} index The index of the assignment in the assignments array.
     * @param {Event} e The event that triggered this function.
     *
     * @returns {void}
     */
    function handleExpandClick(index, e) {
        e.stopPropagation();
        !e.target.closest('.assignment-details-wrapper') ? expandedAssignment = toggleAssignmentDetails(expandedAssignment, index, e) : null;
    }

    /**
     * Toggle the visibility of an assignment's details.
     *
     * @param {assignment} expandedAssignment The currently expanded assignment.
     * @param {number} index The index of the assignment in the assignments array.
     * @param {Event} e The event that triggered this function.
     *
     * @returns {Promise<void>}
     */
    function toggleAssignmentDetails(expandedAssignment, index, e) {
        return expandedAssignment === index ? null : index;
    }

    /**
     * Updates an assignment in the database, then fetches the assignments list
     * and updates the assignments store if the update was successful.
     *
     * @param {string} authToken The authentication token to use for the request.
     * @param {assignment} assignment The assignment to update.
     *
     * @returns {Promise<void>}
     */
    async function updateAssignmentHelper(authToken, assignment) {
        const success = !initialize ? await updateAssignment(authToken, assignment) : false;
        if (success) {
            await getAssignmentsHelper(authToken);
        }
    }

    /**
     * Fetches the assignments list from the server and updates the assignments
     * store with the new data.
     *
     * @param {string} authToken The authentication token to use for the request.
     *
     * @returns {Promise<void>}
     */
    async function getAssignmentsHelper(authToken) {
        if (!initialize) {
            const newAssignments = await getAssignments(authToken);
            assignments.set(newAssignments);
        }
    }

    /**
     * Deletes an assignment from the database and updates the assignments list if the
     * deletion was successful.
     *
     * @param {string} authToken The authentication token to use for the request.
     * @param {number} index The index of the assignment to delete in the assignments
     *     array.
     * @param {assignment[]} assignments The array of assignments from which to delete
     *     the assignment.
     *
     * @returns {Promise<void>}
     */
    async function deleteAssignmentHelper(authToken, index, assignments) {
        const success = await deleteAssignment(authToken, index, assignments);
        if (success) {
            await getAssignmentsHelper(authToken);
        }
    }

    /**
     * Updates the `dates` and `emptyDates` variables by calling `getMonthData` with
     * the current `selectedMonth`.
     *
     * @returns {void}
     */
    function updateCalendarHelper() {
        let monthData = getMonthData(selectedMonth);
        dates = monthData.dates;
        emptyDates = monthData.emptyDates;
    }

    /**
     * Handles a click event on the calendar.
     *
     * If the clicked date is not the same as the previously clicked date, the
     * function calls `handleDateClick` and, if the response indicates that the
     * date selection should be opened, it updates the `bottomOfCalendar`, `events`,
     * and `clickedDate` variables. Additionally, it updates the CSS style of the
     * calendar by setting the `border-top-right-radius` and `border-top-left-radius`
     * properties to '0px'.
     *
     * If the clicked date is the same as the previously clicked date, the function
     * sets the `events` and `clickedDate` variables to null and resets the CSS
     * style of the calendar by setting the `border-top-right-radius` and
     * `border-top-left-radius` properties to '6px'.
     *
     * @param {number} date - The day of the month.
     * @param {Event} event - The click event object.
     *
     * @returns {Promise<void>}
     */
    async function dateClickHelper(date, event) {
        const dateClick = await handleDateClick(date, clickedDate, calendar, authToken, selectedMonth);
        if (dateClick.action === "open") {
            bottomOfCalendar = dateClick.bottomOfCalendar;
            events = dateClick.events;
            clickedDate = dateClick.clickedDate;
            calendarWidth = dateClick.width;

            events !== [] ? updateTopEventClass() : null;

            calendar.style.borderTopRightRadius = '0px';
            calendar.style.borderTopLeftRadius = '0px';
        } else {
            events = null;
            clickedDate = null;
            calendar.style.borderTopRightRadius = '6px';
            calendar.style.borderTopLeftRadius = '6px';
        }
    }

    /**
     * Updates the `top-event` class of the elements in the `eventList` so that
     * only the first element has the class.
     *
     * @returns {void}
     */
    const updateTopEventClass = () => {
        if (eventList?.children.length > 0) {
            Array.from(eventList.children).forEach((child) =>
                child.classList.remove('top-event')
            );

            eventList.children[0].classList.add('top-event');
        }
    };

    /**
     * Resets the calendar's CSS style and sets the `clickedDate` variable to null.
     *
     * @returns {void}
     */
    function closeEventModalHandler() {
        events = null;
        clickedDate = null;
        calendar.style.borderTopRightRadius = '6px';
        calendar.style.borderTopLeftRadius = '6px';
    }

    /**
     * Handles the submission of a new event.
     *
     * If the event list is empty, it adds the 'top-event' class to the "Add Event"
     * button. It then sends a request to add the event to the server. If the
     * request is successful, it updates the `events` variable and calls
     * `updateTopEventClass` to update the `top-event` class of the elements in the
     * event list. It also resets the `newEventName` and `eventIsEditing` variables.
     *
     * @param {Event} event - The event that triggered the function.
     * @param {string} authToken - The authentication token for the API request.
     *
     * @returns {Promise<void>}
     */
    async function addEventHelper(event, authToken) {
        eventList?.childElementCount === 1 ? document.querySelector('.add-event').classList.add('top-event') : '';
        const success = await addEvent(event, newEventName, clickedDate, selectedMonth, authToken);
        if (success) {
            events = await getDateEvents(clickedDate, authToken, selectedMonth);
            events !== [] ? updateTopEventClass() : null;
            newEventName = '';
            eventIsEditing = false;
        }
    }

    /**
     * Toggles the display of event information on hover.
     *
     * This function changes the text and styling of a span element within the
     * event button. When hovering, it displays 'delete' with a 'material-symbols-rounded'
     * class. When not hovering, it reverts to the event's name and removes the class.
     *
     * @param {Event} e - The DOM event object containing the current target element.
     * @param {Object} eventData - The event data object containing event details.
     * @param {boolean} isHovering - A flag indicating whether the event is being hovered.
     *
     * @returns {void}
     */
    function handleEventHover(e, eventData, isHovering) {
        const spanElement = e.currentTarget.querySelector('span');

        if (isHovering) {
            spanElement.textContent = 'delete';
            spanElement.classList.add('material-symbols-rounded');
        } else {
            spanElement.textContent = eventData.name;
            spanElement.classList.remove('material-symbols-rounded');
        }
    }

    /**
     * Handles the deletion of an event.
     *
     * If the deletion is successful, this function updates the list of events and
     * updates the CSS class of the first event button to have 'top-event'.
     *
     * @param {Object} event - The event object containing the name of the event to delete.
     * @param {string} authToken - The authentication token for the API request.
     *
     * @returns {Promise<void>}
     */
    async function deleteEventHelper(event, authToken) {
        const success = await deleteEvent(event, clickedDate, selectedMonth, authToken);
        if (success) {
            events = await getDateEvents(clickedDate, authToken, selectedMonth);
            console.log(events);
            events.length !== 0 ? updateTopEventClass() : document.querySelector('.add-event').classList.add('top-event');
        }
    }
</script>

<div class="body">
    <div class="nav-bar">
        <div class="logo">
            <img src={logo} alt="logo" class="logo-img"/>
            <h1 class="logo-name">SCHOLARTHYNK</h1>
        </div>
        <div class="button-group-nav" style="{!isAdmin ? 'width: 15%;' : ''}">
            {#if isAdmin}
                <a href="/admin" class="nav">Admin</a>
            {/if}
            <a href="/notes" class="nav">Notes</a>
            <!-- svelte-ignore a11y_img_redundant_alt -->
            <button class="profile-pic" on:click={() => {displayUserCard = displayUserCardHandler(displayUserCard)}}>
                <img src={profilePicture}
                     alt="Your Profile Picture"
                     class="profile-pic-img"/></button>
        </div>
    </div>
    <div class="dashboard-content">
        <div class="recent-notes" style="grid-area: box-1">
            <h1 class="section-title">Recent Notes</h1>
            <div class="note-list">
                {#each recentNotes as note}
                    <button class="note-list-item" on:click={async () => {externalOpenNote(note.name, note.fileContent, await getNotePath(note.parentFolder, note._id))}}>
                        <h2 class="note-list-item-title">{note.name}</h2>
                        <h2>{formatDate(note.lastEdited)}</h2>
                    </button>
                {/each}
            </div>
            <div class="note-btn-wrapper">
                <button class="note-button" on:click={goto('/notes')}>More</button>
                <button class="note-button" on:click={externalCreateNote}>New Note</button>
            </div>
        </div>
        <div class="calendar" id="calendar" bind:this={calendar} style="grid-area: box-2">
            <div class="calendar-header">
                <h1>{currentDateDisplay}</h1>
            </div>
            <div class="month-selector">
                <select id="month-select" class="month-dropdown" bind:value={selectedMonth}>
                    {#each monthSelectOptions as monthOption}
                        {@const [month, year] = monthOption.split('-')}
                        <option value={monthOption}>{monthLookup[month.toLowerCase()] || 'Invalid month'} {year}</option>
                    {/each}
                </select>
                <div class="month-select-manual-wrapper">
                    <button class="month-select-btn month-select-back"
                            on:click={() => {selectedMonth = goBackMonth(selectedMonth)}}><span
                            class="material-symbols-rounded">arrow_back_ios</span></button>
                    <button class="month-select-btn month-select-forward"
                            on:click={() => {selectedMonth = goForwardMonth(selectedMonth)}}><span
                            class="material-symbols-rounded">arrow_forward_ios</span></button>
                </div>
            </div>
            <div class="calendar-body" id="calendar-body">
                {#each daysOfWeek as day}
                    <p class="calendar-body-day">{day}</p>
                {/each}

                <!-- Empty slots for alignment -->
                {#each emptyDates as _}
                    <div class="calendar-body-day-empty"></div>
                {/each}

                <!-- Dates of the month -->
                {#each dates as date}
                    <button class="calendar-body-date {date === getCurrentDate().getDate() && getCurrentDate().getMonth() === new Date(selectedMonth).getMonth() && getCurrentDate().getFullYear() === new Date(selectedMonth).getFullYear() ? 'current-date' : ''} {clickedDate === date && getCurrentDate().getMonth() === new Date(selectedMonth).getMonth() && getCurrentDate().getFullYear() === new Date(selectedMonth).getFullYear() ? 'selected-date' : ''}"
                            on:click={(event) => dateClickHelper(date, event)}>{date}</button>
                {/each}
            </div>
        </div>
        <div class="assignments" style="grid-area: box-3">
            <h1 class="section-title">Assignments</h1>
            <div class="sort-options-wrapper">
                <h2>Filter by</h2>
                <select id="assignment-sort-select" class="assignment-sort-select" bind:value={sortType}>
                    <option value="subject">Subject</option>
                    <option value="status">Status</option>
                    <option value="priority">Priority</option>
                    <option value="date">Date</option>
                </select>
            </div>
            <div class="assignments-wrapper">
                <div class="assignments-list">
                    {#each $assignments as assignment, index (assignment.title)}
                        <button class="assignment {expandedAssignment === index ? 'expanded' : ''}"
                                style="border: 1px solid {subjectColors[assignment.subject.toLowerCase()]}"
                                on:click={(e) => {handleExpandClick(index, e)}}>
                            <div class="assignment-base-info">
                                <p class="assignment-title">{assignment.title}</p>
                                <div class="right-assignment">
                                    <span class="material-symbols-rounded priority {assignment.priority === "lowest" || assignment.priority == "low" ? "low" : assignment.priority == "medium" ? "medium" : assignment.priority == "high" || assignment.priority == "highest" ? "high" : ""}">{assignment.priority === "lowest" ? "keyboard_double_arrow_down" : assignment.priority === "low" ? "keyboard_arrow_down" : assignment.priority === "medium" ? "equal" : assignment.priority === "high" ? "keyboard_arrow_up" : "keyboard_double_arrow_up"}</span>
                                    <h3 class="due-date">{assignment.dueDate}</h3>
                                </div>
                            </div>
                            {#if expandedAssignment === index}
                                <div class="assignment-details-wrapper">
                                    <div class="assignment-details">
                                        <div class="assignment-details-info">
                                            <select id="assignment-status" class="assignment-select"
                                                    bind:value={assignment.status}
                                                    on:change={() => {updateAssignmentHelper(authToken, assignment)}}>
                                                <option value="open">Open</option>
                                                <option value="inProgress">In Progress</option>
                                                <option value="done">Done</option>
                                            </select>
                                            <select id="assignment-priority" class="assignment-select priority-select"
                                                    bind:value={assignment.priority}
                                                    on:change={() => {updateAssignmentHelper(authToken, assignment)}}>
                                                <option value="lowest">Lowest</option>
                                                <option value="low">Low</option>
                                                <option value="medium">Medium</option>
                                                <option value="high">High</option>
                                                <option value="highest">Highest</option>
                                            </select>
                                        </div>
                                        <p class="assignment-subject">{capitalizeFirstLetter(assignment.subject)}</p>
                                        <!-- svelte-ignore a11y_click_events_have_key_events -->
                                        <!-- svelte-ignore a11y_no_static_element_interactions -->
                                        <span class="material-symbols-rounded delete"
                                              on:click={(e) => {deleteAssignmentHelper(authToken, index, $assignments)}}>delete</span>
                                    </div>
                                    <textarea id="assignment-description" class="assignment-description"
                                              placeholder="Description..." bind:value={assignment.description}
                                              on:blur={() => {updateAssignmentHelper(authToken, assignment)}}></textarea>
                                </div>
                            {/if}
                        </button>
                    {/each}
                    {#if isAddingAssignment}
                        <button class="assignment expanded" bind:this={addAssignmentBtn}
                                on:keydown={async (e) => {isAddingAssignment = await addAssignment(authToken, e); prevStateIsAddingAssignment = !isAddingAssignment}}>
                            <div class="assignment-base-info">
                                <input class="assignment-title assignment-input" placeholder="Title..."
                                       bind:value={newAssignmentData.title}>
                                <div class="right-assignment">
                                    <input class="due-date assignment-input due-date-input" type="date"
                                           bind:value={newAssignmentData.dueDate}>
                                </div>
                            </div>
                            <div class="assignment-details-wrapper">
                                <div class="assignment-details">
                                    <div class="assignment-details-info">
                                        <select id="assignment-priority" class="assignment-select"
                                                bind:value={newAssignmentData.priority}>
                                            <option value="lowest">Lowest</option>
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                            <option value="highest">Highest</option>
                                        </select>
                                        <select class="assignment-select subject-select"
                                                bind:value={newAssignmentData.subject}>
                                            <option value="math">Math</option>
                                            <option value="science">Science</option>
                                            <option value="german">German</option>
                                            <option value="english">English</option>
                                            <option value="history">History</option>
                                            <option value="geography">Geography</option>
                                            <option value="politics">Politics</option>
                                            <option value="pe">PE</option>
                                            <option value="art">Art</option>
                                            <option value="music">Music</option>
                                            <option value="computer_siecne">Computer Sience</option>
                                            <option value="religion">Religion</option>
                                            <option value="eac">EaC</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                                    <span class="material-symbols-rounded addAssignment" style="font-size: 2rem"
                                          on:click={async (e) => {isAddingAssignment = await addAssignment(authToken, e); prevStateIsAddingAssignment = !isAddingAssignment}}>add</span>
                                </div>
                                <textarea id="assignment-description" class="assignment-description"
                                          placeholder="Description..."
                                          bind:value={newAssignmentData.description}></textarea>
                            </div>
                        </button>
                    {/if}
                </div>
                <button class="add-assignment" on:click={()=>{isAddingAssignment = true; prevStateIsAddingAssignment = false}}><span
                        class="material-symbols-rounded">add</span>
                    <h1>Add Assignment</h1></button>
            </div>
        </div>
        <div class="placeholderDashboard" style="grid-area: box-4">

        </div>
    </div>
</div>

{#if clickedDate}
    <div class="event-modal" style="bottom: calc({bottomOfCalendar}px - 2%); width: {calendarWidth}px">
        <div class="event-modal-header">
            <div>
                <h1>{clickedDate ? getFullDate(clickedDate, selectedMonth) : 'N/A'}</h1>
            </div>
            <button class="close-btn" on:click={closeEventModalHandler}><span
                    class="material-symbols-rounded">close</span></button>
        </div>
        <div class="event-list" bind:this={eventList}>
            {#each events as event}
                <!-- svelte-ignore a11y_mouse_events_have_key_events -->
                <button class="event top-event" on:mouseover={(e) =>  handleEventHover(e, event, true)}
                        on:mouseout={(e) => handleEventHover(e, event, false)}
                        on:click={() => deleteEventHelper(event, authToken)}>
                    <span>{event.name}</span></button>
            {/each}
            {#if eventIsEditing}
                <input class="event new-event-input {eventList?.childElementCount === 1 ? 'top-event' : ''}" type="text"
                       bind:value={newEventName} on:keydown={() => addEventHelper(event, authToken)}
                       on:blur={() => addEventHelper(event, authToken)} placeholder="Enter event name...">
            {/if}
            <button class="event add-event bottom-event {eventList?.childElementCount === 1 ? 'top-event' : ''}"
                    on:click={() => {newEventName = ''; eventIsEditing = true; handleNewEventClick()}}><span
                    class="material-symbols-rounded">add</span>
                <p>New Event</p></button>
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
    @import "$lib/style/home.css";
</style>
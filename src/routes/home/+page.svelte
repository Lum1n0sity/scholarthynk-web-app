<script>
    import logo from '$lib/assets/logo.svg';
    import {browser} from '$app/environment';
    import {onMount} from 'svelte';
    import {get} from 'svelte/store';
    import {text} from '@sveltejs/kit';

    let profilePicture = '';
    const authToken = browser ? localStorage.getItem('authToken') : null;

    let error = '';
    let timeout;

    let username = '';
    let email = '';

    let displayUserCard = false;

    onMount(async () => {
        selectedMonth = monthSelectOptions[0];

        formatCurrentDate();
        getMonthData();

        await getUserData();
        await getProfilePic();
        await getAssignments();
    });

    async function getUserData() {
        if (authToken) {
            const response = await fetch('http://127.0.0.1:3000/api/get-user-data', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 200) {
                const data = await response.json();
                username = data.user.name;
                email = data.user.email;
            } else {
                showErrorMsg('Unable to fetch user data.');
            }
        }
    }

    async function getProfilePic() {
        if (authToken) {
            const response = await fetch('http://127.0.0.1:3000/api/get-profile-pic', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 200) {
                const imageBlob = await response.blob();
                profilePicture = URL.createObjectURL(imageBlob);

            } else {
                showErrorMsg('Unable to fetch your profile picture.');
            }
        } else {
            window.location.href = '/login';
        }
    }

    function displayUserCardHandler() {
        displayUserCard = displayUserCard == false ? true : false;
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

    // Calendar
    let selectedMonth = '';

    $: selectedMonth, getMonthData();

    let dates = [];
    let emptyDates = [];
    let currentDateDisplay = '';
    const currentDate = new Date();
    const currentDay = currentDate.getDate();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

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
    let eventList;
    let events;
    let eventIsEditing = false;
    let newEventName;

    function getMonthData() {
        const [month, year] = selectedMonth.split('-');
        const monthIndex = new Date(`${month} 1, ${year}`).getMonth();
        const firstDayOfMonth = new Date(year, monthIndex, 1);
        let startDay = firstDayOfMonth.getDay(); // Sunday = 0, Monday = 1, ...

        // Adjust startDay for Monday as the first day of the week
        startDay = (startDay === 0) ? 6 : startDay - 1;

        const lastDayOfMonth = new Date(year, monthIndex + 1, 0);
        const totalDays = lastDayOfMonth.getDate();

        // Calculate empty slots before the first day of the month
        emptyDates = Array.from({length: startDay}, () => null); // Empty slots
        dates = Array.from({length: totalDays}, (_, i) => i + 1); // Dates of the month
    }

    function goBackMonth() {
        if (!selectedMonth) {
            console.error("Invalid selectedMonth: ", selectedMonth);
            return;
        }

        const [month, year] = selectedMonth.split('-');
        const monthIndex = new Date(`${month} 1, ${year}`).getMonth();
        const yearIndex = parseInt(year);

        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();

        if (yearIndex === currentYear && monthIndex === currentMonth) {
            return;
        }

        let newMonthIndex = monthIndex;
        let newYearIndex = yearIndex;

        if (monthIndex === 0) {
            newMonthIndex = 11;
            newYearIndex -= 1;
        } else {
            newMonthIndex -= 1;
        }

        selectedMonth = `${new Date(newYearIndex, newMonthIndex).toLocaleString('default', {month: 'short'}).toLowerCase()}-${newYearIndex}`;
    }

    function goForwardMonth() {
        const [month, year] = selectedMonth.split('-');
        let monthIndex = new Date(`${month} 1, ${year}`).getMonth();
        let yearIndex = parseInt(year);

        if (monthIndex === 11) {
            monthIndex = 0;
            yearIndex += 1;
        } else {
            monthIndex += 1;
        }

        selectedMonth = `${new Date(yearIndex, monthIndex).toLocaleString('default', {month: 'short'}).toLowerCase()}-${yearIndex}`;
    }

    function formatCurrentDate() {
        const today = new Date();
        const options = {weekday: 'short', month: 'short', day: '2-digit'};
        currentDateDisplay = today.toLocaleDateString('en-US', options);
    }

    function getMonthsForNextYears() {
        const currentYear = new Date().getFullYear();
        const months = [];

        // Loop through each year
        for (let year = currentYear; year < currentYear + 10; year++) {
            // Loop through each month of the current year
            for (let month = 0; month < 12; month++) {
                // Format the month and year as "Jan-2025"
                const monthName = new Date(year, month).toLocaleString('default', {month: 'short'}).toLowerCase();
                months.push(`${monthName}-${year}`);
            }
        }

        return months;
    }

    function getFullDate(date) {
        const [month, year] = selectedMonth.split('-');
        const monthIndex = new Date(`${month} 1, ${year}`).getMonth();
        const currentYear = new Date().getFullYear();

        const formattedDay = date < 10 ? `0${date}` : date;
        const formattedMonth = monthIndex < 10 ? `0${monthIndex + 1}` : monthIndex + 1;

        return `${formattedDay}.${formattedMonth}.${currentYear}`;
    }

    const updateTopEventClass = () => {
        if (eventList?.children.length > 0) {
            Array.from(eventList.children).forEach((child) =>
                child.classList.remove('top-event')
            );

            eventList.children[0].classList.add('top-event');
        }
    };

    async function handleDateClick(date, event) {
        const calendar = document.getElementById('calendar');
        if (clickedDate === date) {
            clickedDate = null;

            calendar.style.borderTopRightRadius = '6px';
            calendar.style.borderTopLeftRadius = '6px';
        } else {
            clickedDate = date;

            const rect = calendar.getBoundingClientRect();
            bottomOfCalendar = rect.height + window.innerHeight * 0.02;

            calendar.style.borderTopRightRadius = '0px';
            calendar.style.borderTopLeftRadius = '0px';

            events = await getDateEvents(date);
            events != [] ? updateTopEventClass() : null;
        }
    }

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

    function closeEventModalHandler() {
        clickedDate = null;
        calendar.style.borderTopRightRadius = '6px';
        calendar.style.borderTopLeftRadius = '6px';
    }

    async function getDateEvents(date) {
        if (authToken) {
            const response = await fetch('http://127.0.0.1:3000/api/get-events', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({date: getFullDate(date)})
            });

            if (response.status === 200) {
                const data = await response.json();
                events = data.events;

                return events;
            } else {
                showErrorMsg('Unable to fetch events.');
            }
        } else {
            window.location.href = '/login';
        }
    }

    function handleNewEventClick() {
        eventIsEditing = true;
        document.querySelector('.add-event').classList.remove('top-event');
        setTimeout(() => {
            document.querySelector('.new-event-input').focus();
        }, 100);
        newEventName = '';
    }

    async function addEvent(event) {
        eventList?.childElementCount === 1 ? document.querySelector('.add-event').classList.add('top-event') : '';

        if (event.type == "blur" || event.key == "Enter") {
            eventIsEditing = false;
            if (newEventName && authToken) {
                const response = await fetch('http://127.0.0.1:3000/api/new-event', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({name: newEventName, date: getFullDate(clickedDate)})
                });

                if (response.status == 200) {
                    events = await getDateEvents(clickedDate);
                    events != [] ? updateTopEventClass() : null;
                    newEventName = '';
                } else {
                    showErrorMsg('Unable to add event.');
                }
            } else if (!authToken) {
                window.location.href = '/login';
            }
        } else if (event.key == "Escape") {
            eventIsEditing = false;
            newEventName = '';
        }
    }

    async function deleteEvent(event) {
        if (authToken) {
            const response = await fetch('http://127.0.0.1:3000/api/delete-event', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({name: event.name, date: getFullDate(clickedDate)})
            });

            if (response.status === 200) {
                events = await getDateEvents(clickedDate);
                events != [] ? updateTopEventClass() : null;
            } else {
                showErrorMsg('Unable to delete event.');
            }
        } else {
            window.location.href = '/login';
        }
    }

    // Assignments
    let addAssignmentBtn;
    let expandedAssignment;
    let assignments = [];
    let sortType = "subject";
    let addAssignment = false;
    let newAssignmentData = {
        title: "",
        dueDate: new Date(),
        subject: "math",
        priority: "medium",
        description: ""
    };

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

    $: sortType, updateAssignmentsSorting();
    $: newAssignmentData.dueDate, formatSelectedDueDate();
    $: if (addAssignment && addAssignmentBtn) addAssignmentBtn.focus();

    async function getAssignments() {
        if (authToken) {
            const response = await fetch('http://127.0.0.1:3000/api/get-assignments', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 200) {
                const data = await response.json();
                assignments = data.assignments;
                updateAssignmentsSorting();
            } else {
                showErrorMsg('Unable to fetch assignments.');
            }
        }
    }

    async function updateAssignmentsSorting() {
        if (sortType == "subject") {
            assignments = [...assignments].sort((a, b) => a.subject.localeCompare(b.subject));
        } else if (sortType == "date") {
            assignments = [...assignments].sort((a, b) => {
                const parseDate = (dateString) => {
                    const [day, month, year] = dateString.split('.');
                    return new Date(`${year}-${month}-${day}`);
                };

                return parseDate(a.dueDate) - parseDate(b.dueDate);
            });
        } else if (sortType == "status") {
            assignments = [...assignments].sort((a, b) => {
                const statusOrder = {
                    open: 0,
                    inProgress: 1,
                    done: 2,
                };

                return statusOrder[a.status] - statusOrder[b.status];
            });
        } else if (sortType == "priority") {
            assignments = [...assignments].sort((a, b) => {
                const priorityOrder = {
                    lowest: 0,
                    low: 1,
                    medium: 2,
                    high: 3,
                    highest: 4
                };

                return priorityOrder[a.priority] - priorityOrder[b.priority];
            });
        }
    }

    async function updateAssignment(assignment) {
        if (authToken) {
            const response = await fetch('http://127.0.0.1:3000/api/update-assignment', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({assignment})
            });

            if (response.status === 200) {
                await getAssignments();
            } else {
                showErrorMsg('Unable to update assignment.');
            }
        }
    }

    async function toggleAssignmentDetails(index, e) {
        if (e.target.closest('.assignment-details-wrapper')) {
            return;
        }
        expandedAssignment = expandedAssignment === index ? null : index;
    }

    async function deleteAssignmentHandler(index) {
        if (authToken) {
            const response = await fetch('http://127.0.0.1:3000/api/delete-assignment', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({assignment: assignments[index]})
            });

            if (response.status === 200) {
                await getAssignments();
            } else {
                showErrorMsg('Unable to delete assignment.');
            }
        }
    }

    function formatSelectedDueDate() {
        const dateObj = new Date(newAssignmentData.dueDate);
        return `${dateObj.getDate()}.${dateObj.getMonth() + 1}.${dateObj.getFullYear()}`;
    }

    async function addAssignmentHandler(e) {
        if (e.key == "Escape") {
            addAssignment = false;
            newAssignmentData = {
                title: "",
                dueDate: new Date(),
                subject: "math",
                priority: "medium",
                description: ""
            };
        } else if (e.target == document.querySelector('.addAssignment')) {
            if (authToken) {
                const response = await fetch('http://127.0.0.1:3000/api/add-assignment', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(newAssignmentData)
                });

                if (response.status === 200) {
                    await getAssignments();
                    addAssignment = false;
                    newAssignmentData = {
                        title: "",
                        dueDate: new Date(),
                        subject: "math",
                        priority: "medium",
                        description: ""
                    };
                } else {
                    showErrorMsg('Unable to add assignment.');
                }
            }
        }
    }
</script>

<div class="body">
    <div class="nav-bar">
        <div class="logo">
            <img src={logo} alt="logo" class="logo-img"/>
            <h1 class="logo-name">SCHOLARTHYNK</h1>
        </div>
        <div class="button-group-nav">
            <a href="/notes" class="nav">Notes</a>
            <!-- svelte-ignore a11y_img_redundant_alt -->
            <button class="profile-pic" on:click={displayUserCardHandler}><img src={profilePicture}
                                                                               alt="Your Profile Picture"
                                                                               class="profile-pic-img"/></button>
        </div>
    </div>
    <div class="dashboard-content">
        <div class="double-section">
            <div class="recent-notes">
                <h1 class="section-title">Recent Notes</h1>
                <div class="notes-list">
                    <div class="notes-list-item">
                        <p class="note-title">Study Tips for Final Exams</p>
                        <p>02.01.2025</p>
                    </div>
                </div>
                <div class="button-wrapper">
                    <button class="button view-all-notes">View All</button>
                    <button class="button add-note"><span class="material-symbols-rounded">add_notes</span>
                        <p>New Note</p></button>
                </div>
            </div>
            <div class="calendar" id="calendar">
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
                        <button class="month-select-btn month-select-back" on:click={goBackMonth}><span
                                class="material-symbols-rounded">arrow_back_ios</span></button>
                        <button class="month-select-btn month-select-forward" on:click={goForwardMonth}><span
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
                        <button class="calendar-body-date {date === currentDay && currentMonth === new Date(selectedMonth).getMonth() && currentYear === new Date(selectedMonth).getFullYear() ? 'current-date' : ''} {clickedDate === date && currentMonth === new Date(selectedMonth).getMonth() && currentYear === new Date(selectedMonth).getFullYear() ? 'selected-date' : ''}"
                                on:click={(event) => handleDateClick(date, event)}>{date}</button>
                    {/each}
                </div>
            </div>
        </div>
        <div class="assignments">
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
                    {#each assignments as assignment, index (assignment)}
                        <button class="assignment {expandedAssignment == index ? 'expanded' : ''}"
                                style="border: 1px solid {subjectColors[assignment.subject.toLowerCase()]}"
                                on:click={(e) => toggleAssignmentDetails(index, e)}>
                            <div class="assignment-base-info">
                                <p class="assignment-title">{assignment.title}</p>
                                <div class="right-assignment">
                                    <span class="material-symbols-rounded priority {assignment.priority == "lowest" || assignment.priority == "low" ? "low" : assignment.priority == "medium" ? "medium" : assignment.priority == "high" || assignment.priority == "highest" ? "high" : ""}">{assignment.priority == "lowest" ? "keyboard_double_arrow_down" : assignment.priority == "low" ? "keyboard_arrow_down" : assignment.priority == "medium" ? "equal" : assignment.priority == "high" ? "keyboard_arrow_up" : "keyboard_double_arrow_up"}</span>
                                    <h3 class="due-date">{assignment.dueDate}</h3>
                                </div>
                            </div>
                            {#if expandedAssignment == index}
                                <div class="assignment-details-wrapper">
                                    <div class="assignment-details">
                                        <div class="assignment-details-info">
                                            <select id="assignment-status" class="assignment-select"
                                                    bind:value={assignment.status}
                                                    on:change={() => updateAssignment(assignment)}>
                                                <option value="open">Open</option>
                                                <option value="inProgress">In Progress</option>
                                                <option value="done">Done</option>
                                            </select>
                                            <select id="assignment-priority" class="assignment-select priority-select"
                                                    bind:value={assignment.priority}
                                                    on:change={() => updateAssignment(assignment)}>
                                                <option value="lowest">Lowest</option>
                                                <option value="low">Low</option>
                                                <option value="medium">Medium</option>
                                                <option value="high">High</option>
                                                <option value="highest">Highest</option>
                                            </select>
                                        </div>
                                        <!-- svelte-ignore a11y_click_events_have_key_events -->
                                        <!-- svelte-ignore a11y_no_static_element_interactions -->
                                        <span class="material-symbols-rounded delete"
                                              on:click={(e) => {deleteAssignmentHandler(index)}}>delete</span>
                                    </div>
                                    <textarea id="assignment-description" class="assignment-description"
                                              placeholder="Description..." bind:value={assignment.description}
                                              on:blur={() => updateAssignment(assignment)}></textarea>
                                </div>
                            {/if}
                        </button>
                    {/each}
                    {#if addAssignment}
                        <button class="assignment expanded" bind:this={addAssignmentBtn}
                                on:keydown={(e) => {addAssignmentHandler(e)}}>
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
                                          on:click={(e) => {addAssignmentHandler(e)}}>add</span>
                                </div>
                                <textarea id="assignment-description" class="assignment-description"
                                          placeholder="Description..."
                                          bind:value={newAssignmentData.description}></textarea>
                            </div>
                        </button>
                    {/if}
                </div>
                <button class="add-assignment" on:click={()=>{addAssignment = true}}><span
                        class="material-symbols-rounded">add</span>
                    <h1>Add Assignment</h1></button>
            </div>
        </div>
    </div>
</div>

{#if clickedDate}
    <div class="event-modal" style="bottom: calc({bottomOfCalendar}px - 1%);">
        <div class="event-modal-header">
            <div>
                <h1>{clickedDate ? getFullDate(clickedDate) : 'N/A'}</h1>
            </div>
            <button class="close-btn" on:click={closeEventModalHandler}><span
                    class="material-symbols-rounded">close</span></button>
        </div>
        <div class="event-list" bind:this={eventList}>
            {#each events as event}
                <!-- svelte-ignore a11y_mouse_events_have_key_events -->
                <button class="event top-event" on:mouseover={(e) =>  handleEventHover(e, event, true)}
                        on:mouseout={(e) => handleEventHover(e, event, false)} on:click={() => deleteEvent(event)}>
                    <span>{event.name}</span></button>
            {/each}
            {#if eventIsEditing}
                <input class="event new-event-input {eventList?.childElementCount === 1 ? 'top-event' : ''}" type="text"
                       bind:value={newEventName} on:keydown={() => addEvent(event)} placeholder="Enter event name...">
            {/if}
            <button class="event add-event bottom-event {eventList?.childElementCount === 1 ? 'top-event' : ''}"
                    on:click={handleNewEventClick}><span class="material-symbols-rounded">add</span>
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
            <button class="card-fab">
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

{#if error}
    <div class="error-wrapper">
        <h1 class="error">{error}</h1>
    </div>
{/if}

<style>
    @import "$lib/style/global.css";
    @import "$lib/style/home.css";
</style>
<script>
  import logo from '$lib/assets/logo.png';
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { text } from '@sveltejs/kit';

  let profilePicture = '';
  const authToken = browser ? localStorage.getItem('authToken') : null;

  let error = '';
  let timeout;

  let username = 'Test';
  let email = 'raphael221@outlook.de';

  let displayUserCard = false;

  onMount(async () => {
    selectedMonth = monthSelectOptions[0];

    formatCurrentDate();
    getMonthData();
    
    await getProfilePic();
  });

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
    emptyDates = Array.from({ length: startDay }, () => null); // Empty slots
    dates = Array.from({ length: totalDays }, (_, i) => i + 1); // Dates of the month
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

    selectedMonth = `${new Date(newYearIndex, newMonthIndex).toLocaleString('default', { month: 'short' }).toLowerCase()}-${newYearIndex}`;
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

    selectedMonth = `${new Date(yearIndex, monthIndex).toLocaleString('default', { month: 'short' }).toLowerCase()}-${yearIndex}`;
  }

  function formatCurrentDate() {
    const today = new Date();
    const options = { weekday: 'short', month: 'short', day: '2-digit' };
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
        const monthName = new Date(year, month).toLocaleString('default', { month: 'short' }).toLowerCase();
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
  }

  async function getDateEvents(date) {
    if (authToken) {
      const response = await fetch('http://127.0.0.1:3000/api/get-events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ date: getFullDate(date) })
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
          body: JSON.stringify({ name: newEventName, date: getFullDate(clickedDate) })
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
    } else if(event.key == "Escape") {
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
        body: JSON.stringify({ name: event.name, date: getFullDate(clickedDate) })
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
</script>

<div class="body">
  <div class="nav-bar">
    <div class="logo">
      <img src={logo} alt="logo" class="logo-img"/>
      <h1 class="logo-name">SCHOLARTHYNK</h1>
    </div>
    <div class="button-group-nav">
      <a href="/" class="notes-nav">Notes</a>
      <!-- svelte-ignore a11y_img_redundant_alt -->
       <button class="profile-pic" on:click={displayUserCardHandler}><img src={profilePicture} alt="Your Profile Picture" class="profile-pic-img"/></button>
    </div>
  </div>
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
      <button class="button add-note"><span class="material-symbols-rounded">note_add</span> <p>New Note</p></button>
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
        <button class="month-select-btn month-select-back" on:click={goBackMonth}><span class="material-symbols-rounded">arrow_back_ios</span></button>
        <button class="month-select-btn month-select-forward" on:click={goForwardMonth}><span class="material-symbols-rounded">arrow_forward_ios</span></button>
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
        <button class="calendar-body-date {date === currentDay && currentMonth === new Date(selectedMonth).getMonth() && currentYear === new Date(selectedMonth).getFullYear() ? 'current-date' : ''} {clickedDate === date && currentMonth === new Date(selectedMonth).getMonth() && currentYear === new Date(selectedMonth).getFullYear() ? 'selected-date' : ''}" on:click={(event) => handleDateClick(date, event)}>{date}</button>
      {/each}
    </div>
  </div>
</div>

{#if clickedDate}
  <div class="event-modal" style="bottom: {bottomOfCalendar}px;">
    <div class="event-modal-header">
      <div>
        <h1>{clickedDate ? getFullDate(clickedDate) : 'N/A'}</h1>
      </div>
      <button class="close-btn" on:click={closeEventModalHandler}><span class="material-symbols-rounded">close</span></button>
    </div>
    <div class="event-list" bind:this={eventList}>
      {#each events as event}
        <!-- svelte-ignore a11y_mouse_events_have_key_events -->
        <button class="event top-event" on:mouseover={(e) =>  handleEventHover(e, event, true)} on:mouseout={(e) => handleEventHover(e, event, false)} on:click={() => deleteEvent(event)}><span>{event.name}</span></button>
      {/each}
      {#if eventIsEditing}
        <input class="event new-event-input {eventList?.childElementCount === 1 ? 'top-event' : ''}" type="text" bind:value={newEventName} on:keydown={() => addEvent(event)} placeholder="Enter event name...">
      {/if}
      <button class="event add-event bottom-event {eventList?.childElementCount === 1 ? 'top-event' : ''}" on:click={handleNewEventClick}><span class="material-symbols-rounded">add</span> <p>New Event</p></button>
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
      <button class="card-btn dark-light-toggle"><span class="material-symbols-rounded">contrast</span> <p>Dark/Light Mode</p></button>
      <button class="card-btn switch-account"><span class="material-symbols-rounded">switch_account</span> <p>Switch Account</p></button>
    </div>
  </div>
{/if}

{#if error}
  <div class="error-wrapper">
    <h1 class="error">{error}</h1>
  </div>
{/if}

<style>
    .material-symbols-rounded {
    font-family: 'Material Symbols Rounded';
    font-weight: bold;
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
    width: 100%;
    height: 12%;
    border-bottom: 1px solid #C9C9C9;
  }

  .logo {
    cursor: default;
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

  .button-group-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-right: 1rem;
    width: 15%;
    height: 100%;
  }

  .profile-pic {
    background: transparent;
    border: none;
    outline: none;
    width: 35%;
    aspect-ratio: 1;
    border-radius: 6px;
    padding: 0;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
  }

  .profile-pic-img {
    width: 100%;
    border-radius: 6px;
  }

  .notes-nav {
    background: transparent;
    border: none;
    outline: none;
    width: auto;
    cursor: pointer;
    font-size: 3rem;
    font-weight: bold;
    color: #10222F;
    background-image: linear-gradient(180deg, transparent 92%, currentColor 0);
    background-repeat: no-repeat;
    transition: background-size 0.4s ease;
    background-size: 0 100%;
    text-decoration: none;
  }

  .notes-nav:hover {
    background-size: 100% 100%;
  }

  .user-card {
    position: absolute;
    top: 12%;
    right: .8%;
    background-color: white;
    width: 20%;
    height: 50%;
    box-shadow: 0px 0px 14px 2px rgba(0,0,0,0.47);
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .upper-section {
    background-color: #E65A41;
    width: 100%;
    height: 25%;
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
  }

  .card-profile-pic {
    position: absolute;
    width: 30%;
    top: 13%;
    left: 50%;
    transform: translateX(-50%);
    border: 1px solid #ffffff;
    border-radius: 100px;
  }

  .card-user-data {
    width: 100%;
    height: 10%;
    margin-top: 15.5%;
    text-align: center;
  }

  .card-user-data h2 {
    color: #10222F;
    font-weight: bold;
    font-size: 2.5rem;
  }

  .card-user-data p {
    color: #10222F;
    font-weight: bold;
  }

  .card-fabs {
    width: 60%;
    height: 10%;
    margin-top: 6%;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-evenly;
    cursor: pointer;
  }

  .card-fab {
    background-color: #10222F;
    color: #fff;
    border: none;
    outline: none;
    width: 20%;
    aspect-ratio: 1;
    border-radius: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .card-fab span {
    font-size: 2rem;
    font-weight: 600;
  }

  .card-btns {
    width: 70%;
    height: 25%;
    display: flex;
    flex-direction: column;
    margin-top: 5%;
  }

  .card-btn {
    display: flex;
    flex-direction: row;
    align-items: center;
    font-size: 1.5rem;
    font-weight: bold;
    height: 40%;
    margin-top: 10%;
    border: none;
    outline: none;
    background-color: transparent;
    cursor: pointer;
    color: #10222F;
  }

  .card-btn span {
    font-size: 3rem;
  }

  .card-btn p {
    text-align: start;
    margin-left: 5%;
    width: 100%;
  }

  .dark-light-toggle {
    margin-top: 0;
  }

  .section-title {
    width: 100%;
    height: 10%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #E65A41;
    font-weight: bold;
    font-size: 3rem;
    margin-top: 3%;
  }

  .recent-notes {
    width: 35%;
    height: 40%;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    top: 2%;
    left: 1%;
    box-shadow: 0 0 14px 2px rgba(0,0,0,0.47);
    border-radius: 6px;
    background-color: #fff;
  }

  .notes-list {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 90%;
    height: 60%;
    overflow-y: auto;
    margin-top: 2%;
  }

  .notes-list::-webkit-scrollbar {
    width: 8px;
  }

  .notes-list::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 8px;
  }

  .notes-list::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 8px;
    cursor: pointer;
  }

  .notes-list::-webkit-scrollbar-thumb:hover {
    background: #555;
  }

  .notes-list-item {
    width: 100%;
    height: 25%;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    border-bottom: 3px solid #C2C2C2;
    cursor: pointer;
  }

  .notes-list-item:hover {
    background-color: #eeeeee;
  }

  .notes-list-item p {
    color: #000;
    font-weight: bold;
    font-size: 1.5rem;
  }

  .note-title {
    width: 50%;
  }

  .button-wrapper {
    display: flex;
    align-items: center;
    width: 70%;
    height: 20%;
    margin-right: auto;
    margin-left: 3.7%;
    justify-content: space-evenly;
  }

  .view-all-notes {
    width: 40%;
    height: 80%;
    border: none;
    outline: none;
    background-color: #E65A41;
    border-radius: 6px;
    color: #fff;
    font-size: 2rem;
    font-weight: bold;
    cursor: pointer;
  }

  .add-note {
    display: flex;
    flex-direction: row;
    align-items: center;
    width: 55%;
    height: 80%;
    border: none;
    outline: none;
    background-color: #E65A41;
    border-radius: 6px;
    color: #fff;
    font-size: 2rem;
    font-weight: bold;
    cursor: pointer;
  }

  .add-note span {
    font-size: 3rem;
    margin-left: 2%;
  }

  .add-note p {
    width: 100%;
    text-align: center;
  }

  .button-wrapper button:hover {
    background-color: #C94F3F;
  }

  .calendar {
    width: 35%;
    height: 42.5%;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: absolute;
    bottom: 2%;
    left: 1%;
    box-shadow: 0 0 14px 2px rgba(0,0,0,0.47);
    border-radius: 6px;
    background-color: #fff;
  }

  .calendar-header {
    font-size: 1.2rem;
    margin-top: 2%;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: start;
    width: 98%;
    height: 10%;
    margin-left: 5%;
    margin-top: 3%;
  }

  .calendar-header h1 {
    font-weight: 300;
  }

  .month-selector {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    width: 94%;
    height: 10%;
  }

  .month-dropdown {
    background-color: transparent;
    border: none;
    outline: none;
    font-size: 1rem;
    cursor: pointer;
  }

  .month-select-manual-wrapper {
    width: 10%;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between
  }

  .month-select-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: transparent;
    border: none;
    outline: none;
    cursor: pointer;
  }

  .calendar-body {
    display: grid;
    align-items: center;
    justify-items: center;
    grid-template-columns: repeat(7, 1fr);
    grid-template-rows: repeat(6, 1fr);
    width: 95%;
    height: 70%;
    margin-top: 1%;
    overflow-x: hidden;
    overflow-y: auto;
    box-sizing: border-box;
  }

  .calendar-body::-webkit-scrollbar {
    width: 0px;
  }

  .calendar-body::-webkit-scrollbar-track {
    background: transparent;
  }

  .calendar-body::-webkit-scrollbar-thumb {
    background: transparent;
  }

  .calendar-body::-webkit-scrollbar-thumb:hover {
    background: transparent;
  }

  .calendar-body-day,
  .calendar-body-date ,
  .calendar-body-day-empty {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 50%;
      aspect-ratio: 1;
      border-radius: 50%;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 1.1rem;
  }

  .calendar-body-date::selection {
    outline: 1px solid #10222F;
  }

  .calendar-body-date:not(.current-date):hover {
      background-color: #eeeeee;
  }

  .calendar-body-day {
      text-align: center;
      font-size: 1rem;
  }

  .current-date {
    background-color: #E65A41;
    color: #fff;
  }

  .selected-date {
    border: 1px solid #E65A41;
  }

  .event-modal {
    position: absolute;
    left: 1%;
    background-color: #fff;
    display: flex;
    flex-direction: column;
    align-items: center;
    border-radius: 6px;
    border-bottom-right-radius: 0;
    border-bottom-left-radius: 0;
    border-bottom: 2px solid #d9d9d9;
    box-shadow: 0 -6px 5.9px 2px rgba(0,0,0,0.38);
    width: 35%;
    height: 30%;
  }

  .event-modal-header {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 20%;
    margin-top: 2%;
  }

  .event-modal-header div {
    flex: 1;
    text-align: center;
    margin-left: 10%;
  }

  .event-modal-header h1 {
    margin: 0;
  }

  .close-btn {
    margin-left: auto;
    margin-right: 4%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: transparent;
    border: none;
    outline: none;
    cursor: pointer;
    color: #000;
    border-radius: 100px;
    width: 7%;
    aspect-ratio: 1;
  }

  .close-btn span {
    font-size: 2.5rem;
  }

  .close-btn:hover {
    background-color: #eeeeee;
  }

  .event-list {
    margin-top: 2%;
    width: 70%;
    height: 60%;
    max-height: 80%;
    overflow-y: auto;
    overflow-x: hidden;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-bottom: 1%;
  }

  .event-list > * {
    flex-shrink: 0;
  }

  .event-list::-webkit-scrollbar {
    width: 8px;
  }

  .event-list::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 8px;
  }

  .event-list::-webkit-scrollbar-thumb {
    background: transparent;
    border-radius: 8px;
    cursor: pointer;
  }

  .event-list::-webkit-scrollbar-thumb:hover {
    background: transparent;
  }

  .event {
    width: 100%;
    height: 25%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #d9d9d9;
    border-top: none;
    background-color: transparent;
    outline: none;
    cursor: pointer;
    font-weight: bold;
    font-size: 1.5rem;
  }

  .top-event {
    border-top-left-radius: 6px;
    border-top-right-radius: 6px;
    border-top: 1px solid #d9d9d9 !important;
  }

  .bottom-event {
    border-bottom-left-radius: 6px;
    border-bottom-right-radius: 6px;
  }

  .event span {
    transition: all 0.3s ease;
  }

  .event:hover {
    background-color: #eeeeee;
  }

  .event:hover:not(.add-event) span {
    color: #D11F22;
    font-size: 2.5rem;
  }

  .event-input {
    width: 100%;
    height: 100%;
    outline: none;
    background-color: transparent;
    font-weight: bold;
    font-size: 1.5rem;
    text-align: center;
  }

  .new-event-input {
    text-align: center;
    width: 99.6%;
  }
</style>
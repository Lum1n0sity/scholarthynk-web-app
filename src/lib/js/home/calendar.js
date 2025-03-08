import {logout} from "$lib/js/auth.js";

const currentDate = new Date();

let newNotification = null;

/**
 * Sets a new notification callback function.
 *
 * If a callback function is provided, it updates the `newNotification` variable
 * to the provided callback.
 *
 * @param {Function|null} callback - The callback function to set as the new notification handler.
 */
export function newNotificationTC(callback) {
    if (callback) {
        newNotification = callback;
    }
}

/**
 * Returns the current date.
 *
 * @returns {Date} The current date object.
 */
export function getCurrentDate() {
    return currentDate;
}

/**
 * Returns the current date formatted as a string.
 *
 * The format of the string is "Weekday, Month Day". For example, "Wed, May 17".
 *
 * @returns {string} The formatted current date.
 */
export function getFormattedCurrentDate() {
    const today = new Date();
    const options = {weekday: 'short', month: 'short', day: '2-digit'};
    return today.toLocaleDateString('en-US', options);
}

/**
 * Returns an object containing the days of the month and the empty days before the first day of the month.
 *
 * @param {string} selectedMonth - The month to get the data for, in the format "Month-YYYY".
 *
 * @returns {Object} An object containing the days of the month and the empty days before the first day of the month.
 *
 * @property {Array<number>} dates - The days of the month, starting from 1.
 * @property {Array<null>} emptyDates - The empty days before the first day of the month, represented by null values.
 */
export function getMonthData(selectedMonth) {
    const [month, year] = selectedMonth.split('-');
    const monthIndex = new Date(`${month} 1, ${year}`).getMonth();
    const firstDayOfMonth = new Date(year, monthIndex, 1);
    let startDay = firstDayOfMonth.getDay();

    startDay = (startDay === 0) ? 6 : startDay - 1;

    const lastDayOfMonth = new Date(year, monthIndex + 1, 0);
    const totalDays = lastDayOfMonth.getDate();

    return {dates: Array.from({length: totalDays}, (_, i) => i + 1), emptyDates: Array.from({length: startDay}, () => null)};
}

/**
 * Handles the click event on a calendar date.
 *
 * This function determines if the clicked date is the same as the previously clicked date.
 * If it is, it returns an object indicating that the date selection should be closed.
 * If the clicked date is different, it fetches the events for the selected date and
 * calculates the bottom position of the calendar to open the event modal.
 *
 * @param {number} date - The date that was clicked.
 * @param {HTMLElement} calendar - The calendar element.
 * @param {number|null} clickedDate - The currently selected date, or null if no date is selected.
 * @param {string} authToken - The authentication token for API requests.
 * @param {string} selectedMonth - The currently selected month in the format "Month-YYYY".
 *
 * @param testing
 * @returns {Promise<Object>} An object containing the new clicked date, the list of events
 *                            for that date, the bottom position of the calendar, and the action
 *                            to be taken ("open" or "close").
 */
export async function handleDateClick(date, clickedDate, calendar, authToken, selectedMonth, testing = false) {
    if (clickedDate === date) {
        return {clickedDate: null, events: [], action: "close"};
    } else {
        const rect = calendar.getBoundingClientRect();

        // TODO: Mock the getDateEvents function instead of directly using mock data in handleDateClick()
        let events = !testing ? await getDateEvents(date, authToken, selectedMonth, testing) : [{id: 1, title: "Mock Event1"}, {id: 2, title: "Mock Event2"}];

        return {clickedDate: date, events: events, bottomOfCalendar: rect.height + window.innerHeight * 0.02, width: rect.width, action: "open"};
    }
}

/**
 * Returns the month and year of the month before the given month.
 *
 * The given month should be in the format "Month-YYYY".
 *
 * If the given month is the current month, the same month is returned.
 *
 * @param {string} selectedMonth - The selected month in the format "Month-YYYY".
 *
 * @returns {string} The month and year of the month before the given month.
 */
export function goBackMonth(selectedMonth) {
    if (!selectedMonth) {
        console.error("Invalid selectedMonth: ", selectedMonth);
        newNotification("error", "Invalid selectedMonth", "Invalid selectedMonth: " + selectedMonth);
        return "";
    }

    const [month, year] = selectedMonth.split('-');
    const monthIndex = new Date(`${month} 1, ${year}`).getMonth();
    const yearIndex = parseInt(year);

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    if (yearIndex === currentYear && monthIndex === currentMonth) {
        return selectedMonth;
    }

    let newMonthIndex = monthIndex;
    let newYearIndex = yearIndex;

    if (monthIndex === 0) {
        newMonthIndex = 11;
        newYearIndex -= 1;
    } else {
        newMonthIndex -= 1;
    }

    return `${new Date(newYearIndex, newMonthIndex).toLocaleString('default', {month: 'short'}).toLowerCase()}-${newYearIndex}`;
}

/**
 * Returns the month and year of the month after the given month.
 *
 * @param {string} selectedMonth - The selected month in the format "Month-YYYY".
 *
 * @returns {string} The month and year of the month after the given month.
 */
export function goForwardMonth(selectedMonth) {
    const [month, year] = selectedMonth.split('-');
    let monthIndex = new Date(`${month} 1, ${year}`).getMonth();
    let yearIndex = parseInt(year);

    if (monthIndex === 11) {
        monthIndex = 0;
        yearIndex += 1;
    } else {
        monthIndex += 1;
    }

    return `${new Date(yearIndex, monthIndex).toLocaleString('default', {month: 'short'}).toLowerCase()}-${yearIndex}`;
}

/**
 * Returns an array of strings representing the months and years for the next 10 years.
 *
 * Each string is in the format "Month-YYYY". The months start from the current month and year.
 *
 * @returns {string[]} An array of strings representing the months and years for the next 10 years.
 */
export function getMonthsForNextYears() {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const months = [];

    for (let year = currentYear; year < currentYear + 10; year++) {
        const startMonth = year === currentYear ? currentMonth : 0;

        for (let month = startMonth; month < 12; month++) {
            const monthName = new Date(year, month).toLocaleString('default', {month: 'short'}).toLowerCase();
            months.push(`${monthName}-${year}`);
        }
    }

    return months;
}

/**
 * Returns a string representing the full date in the format "DD.MM.YYYY".
 *
 * The input date is assumed to be the day of the month, and the selectedMonth is assumed to be in the format "Month-YYYY".
 *
 * @param {number} date - The day of the month.
 * @param {string} selectedMonth - The month and year in the format "Month-YYYY".
 *
 * @returns {string} A string representing the full date in the format "DD.MM.YYYY".
 */
export function getFullDate(date, selectedMonth) {
    const [month, year] = selectedMonth.split('-');
    const monthIndex = new Date(`${month} 1, ${year}`).getMonth();
    const currentYear = new Date().getFullYear();

    const formattedDay = date < 10 ? `0${date}` : date;
    const formattedMonth = monthIndex < 10 ? `0${monthIndex + 1}` : monthIndex + 1;

    return `${formattedDay}.${formattedMonth}.${currentYear}`;
}

/**
 * Fetches the events for a given date from the server.
 *
 * @param {number} date - The day of the month.
 * @param {string} authToken - The authentication token for the API request.
 * @param {string} selectedMonth - The month and year in the format "Month-YYYY".
 *
 * @param testing
 * @returns {Promise<Array<Object>|null>} The list of events for the given date, or null if there is an error.
 */
export async function getDateEvents(date, authToken, selectedMonth, testing = false) {
    if (authToken) {
        const response = await fetch('http://127.0.0.1:3000/api/event/get', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({date: getFullDate(date, selectedMonth)})
        });

        if (response.status === 200) {
            const data = await response.json();
            return data.events;
        } else if (response.status === 400) {
            if (!testing) {
                const err = await response.json();
                newNotification("error", "Invalid date", err.error);
                return null;
            }
        } else if (response.status === 409) {
            if (!testing) {
                const err = await response.json();
                newNotification("error", "Unauthorized", err.error);
                setTimeout(() => {logout();}, 5000);
                return null;
            }
        } else if (response.status === 500) {
            if (!testing) {
                const err = await response.json();
                console.log(err.error);
                newNotification("error", "Error while loading your events", err.error);
                return null;
            }
        } else {
            if (!testing) newNotification("error", "Unable to load your events", "There was an unexpected error. Please try again!");
            return null;
        }
    }
}

/**
 * Handles the click event on the "Add Event" button.
 *
 * Removes the "top-event" class from the button and focuses the input field
 * after a short delay.
 */
export function handleNewEventClick() {
    document.querySelector('.add-event').classList.remove('top-event');
    setTimeout(() => {
        document.querySelector('.new-event-input').focus();
    }, 100);
}

/**
 * Handles the submission of a new event.
 *
 * If the user presses the "Enter" key or blurs the input field, a POST request
 * is sent to the server to add the event. If the request is successful, the
 * function returns `true`. If the request fails, the function returns `false`.
 *
 * If the user presses the "Escape" key, the function returns `false`.
 *
 * If the user is not logged in, the user is redirected to the login page.
 *
 * @param {Event} event - The event that triggered the function.
 * @param {string} newEventName - The name of the new event.
 * @param {number} clickedDate - The date on which the event should be added.
 * @param {string} selectedMonth - The currently selected month in the format "Month-YYYY".
 * @param {string} authToken - The authentication token for the API request.
 *
 * @returns {Promise<boolean>} A boolean indicating whether the event was successfully added.
 */
export async function addEvent(event, newEventName, clickedDate, selectedMonth, authToken) {
    if (event.type === "blur" || event.key === "Enter") {
        if (newEventName && authToken) {
            const response = await fetch('http://127.0.0.1:3000/api/event/new', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({name: newEventName, date: getFullDate(clickedDate, selectedMonth)})
            });

            if (response.status === 200) {
                return true;
            } else if (response.status === 400) {
                const err = await response.json();
                newNotification("error", "Invalid input", err.error);
                return false;
            } else if (response.status === 409) {
                const err = await response.json();
                newNotification("error", "Event already exists", err.error);
                return false;
            } else if (response.status === 401) {
                const err = await response.json();
                newNotification("error", "Unauthorized", err.error);
                setTimeout(() => {logout();}, 5000);
                return false;
            } else if (response.status === 500) {
                const err = await response.json();
                newNotification("error", "Error while adding your event", err.error);
                return false;
            } else {
                newNotification("error", "Unable to add your event", "There was an unexpected error. Please try again!");
                return false;
            }
        } else if (!authToken) {
            newNotification("error", "Unauthorized", err.error);
            setTimeout(() => {logout();}, 5000);
            return false;
        }
    } else if (event.key === "Escape") {
        return false;
    }

    return false;
}

/**
 * Deletes an event for a specified date.
 *
 * If the user is not logged in, they are redirected to the login page.
 * Otherwise, a request is sent to delete the specified event.
 *
 * @param {Object} event - The event object containing the name of the event to delete.
 * @param {number} clickedDate - The date associated with the event to be deleted.
 * @param {string} selectedMonth - The currently selected month in the format "Month-YYYY".
 * @param {string} authToken - The authentication token for API requests.
 *
 * @returns {Promise<boolean>} A boolean indicating whether the event was successfully deleted.
 */
export async function deleteEvent(event, clickedDate, selectedMonth, authToken) {
    if (authToken) {
        const response = await fetch('http://127.0.0.1:3000/api/event/delete', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({name: event.name, date: getFullDate(clickedDate, selectedMonth)})
        });

        if (response.status === 200) {
            return true;
        } else if (response.status === 400) {
            const err = await response.json();
            newNotification("error", "Invalid input", err.error);
            return false;
        } else if (response.status === 404) {
            const err = await response.json();
            newNotification("error", "Event not found", err.error);
            return false;
        } else if (response.status === 401) {
            const err = await response.json();
            newNotification("error", "Unauthorized", err.error);
            setTimeout(() => {logout();}, 5000);
            return false;
        } else if (response.status === 500) {
            const err = await response.json();
            newNotification("error", "Error while deleting your event", err.error);
            return false;
        } else {
            newNotification("error", "Unable to delete your event", "There was an unexpected error. Please try again!");
            return false;
        }
    } else {
        newNotification("error", "Unauthorized", err.error);
        setTimeout(() => {logout();}, 5000);
        return false;
    }
}
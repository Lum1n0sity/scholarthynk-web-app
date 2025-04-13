import {logout, getAuthToken} from "$lib/js/auth.js";

let newNotification = null;

/**
 * Sets the callback function for the new notification system.
 *
 * The callback function should accept 3 parameters: type, title, and message.
 * The type parameter should be one of "error", "warning", or "info".
 * The title and message parameters are the title and message of the notification to be displayed.
 *
 * If called with a falsy value, the callback function will not be changed.
 *
 * @param {Function} callback - The callback function to be called when a new notification is to be displayed.
 */
export function newNotificationAM(callback) {
    if (callback) {
        newNotification = callback;
    }
}

/**
 * Fetches the logs from the server and returns them as an array.
 *
 * If the response status is 200, the function will return the array of logs.
 * If the response status is 401, the function will display an unauthorized error notification,
 * log the user out, and return an empty array.
 * If the response status is 500, the function will display an error notification and return an empty array.
 * If the response status is any other value, the function will display an unexpected error notification and return an empty array.
 *
 * @returns {Promise<Object[]>} The array of logs.
 */
export async function getLogs() {
    const response = await fetch('http://127.0.0.1:3000/api/admin/logs', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAuthToken()}`
        }
    });

    if (response.status === 200) {
        return await response.json()
    } else if (response.status === 401) {
        const err = await response.json();
        newNotification("error", "Unauthorized", err.error);
        setTimeout(() => {logout();}, 5000);
        return [];
    } else if (response.status === 500) {
        const err = await response.json();
        newNotification("error", "Unable to load logs", err.error);
        return [];
    } else {
        newNotification("error", "Unexpected error", 'An unexpected error occurred while loading logs.');
        return [];
    }
}

/**
 * Sorts the given logs based on the given sort type.
 *
 * @param {Object[]} logs - The logs to be sorted.
 * @param {string} sortType - The type of sorting to apply to the logs.
 *                            Can be "displayAll", "traceOnly", "debugOnly", "infoOnly", "warningOnly", "errorOnly", or "fatalsOnly".
 *                            If any other value is given, an error notification will be displayed and the original logs array will be returned.
 *
 * @returns {Object[]} The sorted logs array.
 */
export function updateLogSorting(logs, sortType) {
    let sortedLogs = logs;

    if (sortType === "displayAll") {
        return sortedLogs;
    } else if (sortType === "traceOnly") {
        sortedLogs = sortedLogs.filter(log => log.level === 10);
    } else if (sortType === "debugOnly") {
        sortedLogs = sortedLogs.filter(log => log.level === 20);
    } else if (sortType === "infoOnly") {
        sortedLogs = sortedLogs.filter(log => log.level === 30);
    } else if (sortType === "warningOnly") {
        sortedLogs = sortedLogs.filter(log => log.level === 40);
    } else if (sortType === "errorOnly") {
        sortedLogs = sortedLogs.filter(log => log.level === 50);
    } else if (sortType === "fatalsOnly") {
        sortedLogs = sortedLogs.filter(log => log.level === 60);
    } else {
        newNotification("warning", "Invalid sort type", `Invalid sort type ${sortType} was selected`);
    }

    return sortedLogs;
}

/**
 * Translates a log level into its corresponding material design icon.
 *
 * @param {number} level The log level to translate.
 * @returns {string} The material design icon name associated with the log level.
 */
export function translateLogLevel(level) {
    if (level === 10) {
        return "footprint";
    } else if (level === 20) {
        return "bug_report";
    } else if (level === 30) {
        return "info";
    } else if (level === 40) {
        return "warning";
    } else if (level === 50) {
        return "error";
    } else if (level === 60) {
        return "report";
    } else {
        return "question_mark";
    }
}

/**
 * Deletes a log with the given ID.
 *
 * @param {string} id - The ID of the log to delete.
 * @returns {Promise<boolean>} A boolean indicating whether the log was successfully deleted.
 */
export async function deleteLog(id) {
    const response = await fetch('http://127.0.0.1:3000/api/admin/delete-log', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({id: id})
    });

    if (response.status === 200) {
        return true;
    } else if (response.status === 401) {
        const err = await response.json();
        newNotification("error", "Unauthorized", err.error);
        setTimeout(() => {logout();}, 5000);
        return false;
    } else if (response.status === 500) {
        const err = await response.json();
        newNotification("error", "Unable to delete log", err.error);
        return false;
    } else {
        newNotification("error", "Unexpected error", 'An unexpected error occurred while deleting the log.');
        return false;
    }
}

export async function deleteAllLogs() {
    const response = await fetch('http://127.0.0.1:3000/api/admin/delete-logs', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAuthToken()}`
        }
    });

    if (response.status === 200) {
        return true;
    } else if (response.status === 401) {
        const err = await response.json();
        newNotification("error", "Unauthorized", err.error);
        setTimeout(() => {logout();}, 5000);
        return false;
    } else if (response.status === 500) {
        const err = await response.json();
        newNotification("error", "Unable to delete logs", err.error);
        return false;
    } else {
        newNotification("error", "Unexpected error", 'An unexpected error occurred while deleting the logs.');
        return false;
    }
}
import {writable} from "svelte/store";

export const notifications = writable([]);

/**
 * Adds a notification to the notifications store.
 *
 * The notification will be added to the top of the list and will have the
 * provided type, title, message, and timestamp.
 *
 * @param {string} type - The type of the notification. Can be "error", "warning", or "info".
 * @param {string} title - The title of the notification.
 * @param {string} message - The message of the notification.
 * @param {string} timestamp - The timestamp of the notification. Can be any string, but is typically in the format "YYYY-MM-DD HH:mm:ss".
 * @returns {void}
 */
export function addNotification(type, title, message, timestamp) {
    notifications.update((notifications) => {
        return [{type, title, message, timestamp}, ...notifications];
    });
}

/**
 * Clears all notifications.
 *
 * This function will reset the notifications store to an empty array.
 *
 * @returns {void}
 */
export function clearNotifications() {
    notifications.set([]);
}
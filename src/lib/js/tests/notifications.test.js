import {describe, it, expect, beforeEach} from 'vitest';
import {notifications, addNotification, clearNotifications} from '$lib/js/notifications.js';

/**
 * Returns the current value of a store.
 *
 * @param {import('svelte/store').Writable<any>} store
 * @returns {any} The current value of the store.
 */
const getStoreValue = (store) => {
    let value;
    store.subscribe(v => value = v)();
    return value;
};

describe('notifications store', () => {
    beforeEach(() => {
        clearNotifications();
    });

    it('should start with an empty array', () => {
        expect(getStoreValue(notifications)).toEqual([]);
    });

    it('should add a notification to the store', () => {
        const testNotification = {
            type: 'error',
            title: 'Test Error',
            message: 'This is a test error',
            timestamp: '2025-03-09 12:00:00'
        };

        addNotification(
            testNotification.type,
            testNotification.title,
            testNotification.message,
            testNotification.timestamp
        );

        expect(getStoreValue(notifications)).toEqual([testNotification]);
    });

    it('should prepend notifications to the store', () => {
        const firstNotification = {
            type: 'info',
            title: 'First',
            message: 'First message',
            timestamp: '2025-03-09 12:00:00'
        };

        const secondNotification = {
            type: 'warning',
            title: 'Second',
            message: 'Second message',
            timestamp: '2025-03-09 12:01:00'
        };

        addNotification(
            firstNotification.type,
            firstNotification.title,
            firstNotification.message,
            firstNotification.timestamp
        );

        addNotification(
            secondNotification.type,
            secondNotification.title,
            secondNotification.message,
            secondNotification.timestamp
        );

        expect(getStoreValue(notifications)).toEqual([
            secondNotification,
            firstNotification
        ]);
    });

    it('should clear all notifications', () => {
        addNotification('info', 'Title', 'Message', '2025-03-09 12:00:00');
        expect(getStoreValue(notifications)).not.toEqual([]);

        clearNotifications();
        expect(getStoreValue(notifications)).toEqual([]);
    });
});

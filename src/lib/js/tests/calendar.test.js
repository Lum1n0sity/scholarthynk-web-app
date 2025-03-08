import nock from 'nock';
import {describe, it, expect, afterEach, vi} from 'vitest';

import {
    getCurrentDate,
    getFormattedCurrentDate,
    getMonthData,
    handleDateClick,
    getDateEvents
} from "$lib/js/home/calendar";

// TODO: Somehow mock the getDateEvents function... IT'S CURSED
// vi.mock('$lib/js/home/calendar.js', async (importOriginal) => {
//     const actual = await importOriginal();
//
//     return {
//         ...actual,
//         getDateEvents: vi.fn().mockResolvedValue(['mocked event']),
//     };
// });

describe('getCurrentDate', () => {
    it('should return the current date', () => {
        const currentDate = getCurrentDate();
        expect(currentDate).toBeInstanceOf(Date);
    });
});

describe('getFormattedCurrentDate', () => {
    it('should return correctly formatted current date', () => {
        vi.useFakeTimers();
        const mockDate = new Date(2024, 2, 15, 10, 30, 0);
        vi.setSystemTime(mockDate);

        const formattedDate = getFormattedCurrentDate();
        expect(formattedDate).toBe('Fri, Mar 15');

        vi.useRealTimers();
    });

    it('should return the correctly formatted another date', () => {
        vi.useFakeTimers();
        const mockDate = new Date(2025, 11, 25, 10, 30, 0);
        vi.setSystemTime(mockDate);

        const formattedDate = getFormattedCurrentDate();
        expect(formattedDate).toBe('Thu, Dec 25');

        vi.useRealTimers();
    })
});

describe('getMonthData', () => {
    it('should return the correct month data', () => {
        const expectedMonthData = {
            "dates": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31],
            "emptyDates": [null, null, null, null, null]
        };
        const selectedMonth = 'mar-2025';

        const monthData = getMonthData(selectedMonth);
        expect(monthData).toEqual(expectedMonthData);
    });
});

describe('handleDateClick', () => {
    afterEach(() => {
        nock.cleanAll();
        vi.clearAllMocks();
        vi.resetModules();
    });

    it('should return an object with action "close" if the clicked date is the same as the previously clicked date', async () => {
        const result = await handleDateClick(1, 1, null, 'auth-token', 'mar-2025');
        expect(result).toEqual({clickedDate: null, events: [], action: "close"});
    });

    // TODO: properly implement the testing of handleDateClick with mocked getDateEvents
    it('should return an object with the events and action "open" if the clicked date is different from the previously clicked date', async () => {
        const getDateEvents = vi.fn();

        const date = 15; // March 15, 2024
        const clickedDate = 16;
        const calendar = {
            getBoundingClientRect: () => ({
                width: 500,
                height: 300,
            }),
        };
        const authToken = 'auth-token';
        const selectedMonth = "mar-2024";
        const mockEvents = [{ id: 1, title: 'Mock Event1' }, {id: 2, title: 'Mock Event2'}];

        global.window = { innerHeight: 1000 };

        const result = await handleDateClick(date, clickedDate, calendar, authToken, selectedMonth, true);

        expect(result).toEqual({
            clickedDate: date,
            events: mockEvents,
            bottomOfCalendar: 320,
            width: 500,
            action: 'open',
        });
    });
})
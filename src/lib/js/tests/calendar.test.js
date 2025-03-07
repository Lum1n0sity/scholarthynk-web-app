import nock from 'nock';
import {describe, it, expect, afterEach, vi} from 'vitest';
import {
    getCurrentDate,
    getDateEvents,
    getFormattedCurrentDate,
    getMonthData,
    handleDateClick
} from "$lib/js/home/calendar";

vi.mock('$lib/js/home/calendar.js', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        getDateEvents: vi.fn(),
    };
});

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
    });

    it('should return an object with action "close" if the clicked date is the same as the previously clicked date', async () => {
        const result = await handleDateClick(1, null, null, 1, 'auth-token', 'mar-2025');
        expect(result).toEqual({clickedDate: null, events: [], action: "close"});
    });

    it('should return an object with the events and action "open" if the clicked date is different from the previously clicked date', async () => {
        const date = new Date(2024, 2, 15); // March 15, 2024
        const clickedDate = new Date(2024, 2, 16);
        const calendar = {
            getBoundingClientRect: () => ({
                width: 500,
                height: 300,
            }),
        };
        const authToken = 'auth-token';
        const selectedMonth = "mar-2024";
        const mockEvents = [{ id: 1, title: 'Event 1' }];

        getDateEvents.mockResolvedValue(mockEvents);
        global.window = { innerHeight: 1000 };

        const result = await handleDateClick(date, {}, calendar, clickedDate, authToken, selectedMonth, true);

        expect(getDateEvents).toHaveBeenCalledWith(date, authToken, selectedMonth);
        expect(result).toEqual({
            clickedDate: date,
            events: mockEvents,
            bottomOfCalendar: 320, // 300 (rect.height) + 20 (2% of 1000)
            width: 500,
            action: 'open',
        });
    });
})
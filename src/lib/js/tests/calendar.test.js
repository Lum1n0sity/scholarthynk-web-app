import nock from 'nock';
import {describe, it, expect, afterEach, vi} from 'vitest';
import {
    getCurrentDate,
    getFormattedCurrentDate,
    getMonthData,
    handleDateClick,
    goBackMonth,
    goForwardMonth,
    getMonthsForNextYears,
    getFullDate,
    getDateEvents,
    addEvent,
    deleteEvent
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

describe('goBackMonth', () => {
    it('should return the month and year of the month before the given month', () => {
        // Year is so far in the future to avoid it being filtered out because we already passed the selectedMonth
        const selectedMonth = 'mar-2100';

        const result = goBackMonth(selectedMonth, true);
        expect(result).toBe('feb-2100');
    });

    it('should return the same month and year if the given month is the current month', () => {
        const now = new Date();
        const month = now.toLocaleString('default', { month: 'short' }).toLowerCase();
        const year = now.getFullYear();

        const selectedMonth = `${month}-${year}`;

        const result = goBackMonth(selectedMonth, true);
        expect(result).toBe(selectedMonth);
    });
});

describe('goForwardMonth', () => {
    it('should return the month and year of the month after the given selected month', () => {
        const selectedMonth = `mar-2024`;

        const result = goForwardMonth(selectedMonth);
        expect(result).toBe('apr-2024');
    });
});

describe('getMonthsForNextYears', () => {
    it('should return an array of months for the next 10 years', () => {
       vi.useFakeTimers();
       const mockDate = new Date(2024, 2, 15);
       vi.setSystemTime(mockDate);

       const result = getMonthsForNextYears();

       expect(result.length).toBe(12 * 10 - 2);

       expect(result[0]).toBe('mar-2024');
       expect(result[1]).toBe('apr-2024');
       expect(result[2]).toBe('may-2024');
       expect(result[result.length - 1]).toBe('dec-2033');
       expect(result[result.length - 2]).toBe('nov-2033');

       const expectedMonths = [];
       for (let year = 2024; year < 2034; year++) {
           const startMonth = year === 2024 ? 2 : 0;

           for (let month = startMonth; month < 12; month++) {
               const monthName = new Date(year, month).toLocaleString('default', {month: 'short'}).toLowerCase();
               expectedMonths.push(`${monthName}-${year}`);
           }
       }
       expect(result).toEqual(expectedMonths);

       vi.useRealTimers();
    });

    it('should return the correct months when starting in January', () => {
        vi.useFakeTimers();
        const mockDate = new Date(2024, 0, 15); // January 15, 2024
        vi.setSystemTime(mockDate);

        const result = getMonthsForNextYears();

        expect(result[0]).toBe('jan-2024');
        expect(result[11]).toBe('dec-2024');
        expect(result[12]).toBe('jan-2025');

        vi.useRealTimers();
    });

    it('should return the correct months when starting in December', () => {
        vi.useFakeTimers();
        const mockDate = new Date(2024, 11, 15); // December 15, 2024
        vi.setSystemTime(mockDate);

        const result = getMonthsForNextYears();

        expect(result[0]).toBe('dec-2024');
        expect(result[1]).toBe('jan-2025');

        vi.useRealTimers();
    });
});

describe('getFullDate', () => {
   it('should return a correctly formatted full date', () => {
       const selectedMonth = 'mar-2024';
       const date = 15;

       const result = getFullDate(date, selectedMonth);
       expect(result).toBe('15.03.2024');
   }) ;
});

describe('getDateEvents', () => {
   it('should make a successful API call and return an array of events', async () => {
       const authToken = 'auth-token';
       const date = 15;
       const selectedMonth = 'mar-2024';

       nock('http://127.0.0.1:3000')
           .post(`/api/event/get`, {
               date: "15.03.2024"
           })
           .matchHeader('Authorization', 'Bearer auth-token')
           .matchHeader('Content-Type', 'application/json')
           .reply(200, {events: [{id: 1, title: 'Mock Event1'}, {id: 2, title: 'Mock Event2'}]});

       const result = await getDateEvents(date, authToken, selectedMonth, true);
       expect(result).toEqual([{ id: 1, title: 'Mock Event1' }, {id: 2, title: 'Mock Event2'}]);
   });

   it('should handle API error with 400 status code', async () => {
       const authToken = 'auth-token';
       const date = 15;
       const selectedMonth = 'mar-2024';

       nock('http://127.0.0.1:3000')
           .post(`/api/event/get`, {
               date: "15.03.2024"
           })
           .matchHeader('Authorization', 'Bearer auth-token')
           .matchHeader('Content-Type', 'application/json')
           .reply(400, {error: "Invalid date"});

       await expect(getDateEvents(date, authToken, selectedMonth, true)).rejects.toThrow('Error while loading your events: Invalid date');
   });

    it('should handle API error with 401 status code', async () => {
        const authToken = 'auth-token';
        const date = 15;
        const selectedMonth = 'mar-2024';

        nock('http://127.0.0.1:3000')
            .post(`/api/event/get`, {
                date: "15.03.2024"
            })
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader('Content-Type', 'application/json')
            .reply(401, {error: "Unauthorized"});

        await expect(getDateEvents(date, authToken, selectedMonth, true)).rejects.toThrow('Error while loading your events: Unauthorized');
    });

    it('should handle API error with 500 status code', async () => {
        const authToken = 'auth-token';
        const date = 15;
        const selectedMonth = 'mar-2024';

        nock('http://127.0.0.1:3000')
            .post(`/api/event/get`, {
                date: "15.03.2024"
            })
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader('Content-Type', 'application/json')
            .reply(500, {error: "Internal Server Error"});

        await expect(getDateEvents(date, authToken, selectedMonth, true)).rejects.toThrow('Error while loading your events: Internal Server Error');
    });
});

describe('addEvent', () => {
    it('should make a successful API call when event is blur', async () => {
        const event = {type: 'blur'};
        const newEventName = 'New Event';
        const clickedDate = 15;
        const selectedMonth = 'mar-2024';
        const authToken = 'auth-token';

        nock('http://127.0.0.1:3000')
            .post('/api/event/new', {
                name: newEventName, date: getFullDate(clickedDate, selectedMonth)
            })
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader('Content-Type', 'application/json')
            .reply(200, {success: true});

        const result = await addEvent(event, newEventName, clickedDate, selectedMonth, authToken, true);
        expect(result).toBe(true);
    });

    it('should make a successful API call when event is key: enter', async () => {
        const event = {key: 'Enter'};
        const newEventName = 'New Event';
        const clickedDate = 15;
        const selectedMonth = 'mar-2024';
        const authToken = 'auth-token';

        nock('http://127.0.0.1:3000')
            .post('/api/event/new', {
                name: newEventName, date: getFullDate(clickedDate, selectedMonth)
            })
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader('Content-Type', 'application/json')
            .reply(200, {success: true});

        const result = await addEvent(event, newEventName, clickedDate, selectedMonth, authToken, true);
        expect(result).toBe(true);
    });

    it('should return false when event is key: escape', async () => {
        const event = {key: 'Escape'};
        const newEventName = 'New Event';
        const clickedDate = 15;
        const selectedMonth = 'mar-2024';
        const authToken = 'auth-token';

        const result = await addEvent(event, newEventName, clickedDate, selectedMonth, authToken, true);
        expect(result).toBe(false);
    });

    it('should handle API error with 400 status code', async () => {
        const event = {key: 'Enter'};
        const newEventName = 'New Event';
        const clickedDate = 15;
        const selectedMonth = 'mar-2024';
        const authToken = 'auth-token';

        nock('http://127.0.0.1:3000')
            .post('/api/event/new', {
                name: newEventName, date: getFullDate(clickedDate, selectedMonth)
            })
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader('Content-Type', 'application/json')
            .reply(400, {error: "Invalid input"});

        await expect(addEvent(event, newEventName, clickedDate, selectedMonth, authToken, true)).rejects.toThrow('Error while adding your event: Invalid input');
    });

    it('should handle API error with 409 status code', async () => {
        const event = {key: 'Enter'};
        const newEventName = 'New Event';
        const clickedDate = 15;
        const selectedMonth = 'mar-2024';
        const authToken = 'auth-token';

        nock('http://127.0.0.1:3000')
            .post('/api/event/new', {
                name: newEventName, date: getFullDate(clickedDate, selectedMonth)
            })
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader('Content-Type', 'application/json')
            .reply(409, {error: "Event already exists"});

        await expect(addEvent(event, newEventName, clickedDate, selectedMonth, authToken, true)).rejects.toThrow('Error while adding your event: Event already exists');
    });

    it('should handle API error with 401 status code', async () => {
        const event = {key: 'Enter'};
        const newEventName = 'New Event';
        const clickedDate = 15;
        const selectedMonth = 'mar-2024';
        const authToken = 'auth-token';

        nock('http://127.0.0.1:3000')
            .post('/api/event/new', {
                name: newEventName, date: getFullDate(clickedDate, selectedMonth)
            })
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader('Content-Type', 'application/json')
            .reply(401, {error: "Unauthorized"});

        await expect(addEvent(event, newEventName, clickedDate, selectedMonth, authToken, true)).rejects.toThrow('Error while adding your event: Unauthorized');
    });

    it('should handle API error with 500 status code', async () => {
        const event = {key: 'Enter'};
        const newEventName = 'New Event';
        const clickedDate = 15;
        const selectedMonth = 'mar-2024';
        const authToken = 'auth-token';

        nock('http://127.0.0.1:3000')
            .post('/api/event/new', {
                name: newEventName, date: getFullDate(clickedDate, selectedMonth)
            })
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader('Content-Type', 'application/json')
            .reply(500, {error: "Internal Server Error"});

        await expect(addEvent(event, newEventName, clickedDate, selectedMonth, authToken, true)).rejects.toThrow('Error while adding your event: Internal Server Error');
    });
});

describe('deleteEvent', () => {
    it('should make a successful API call', async () => {
        const clickedDate = 15;
        const selectedMonth = 'mar-2024';
        const authToken = 'auth-token';
        const event = {name: 'Event', date: "15.03.2024"};

        nock('http://127.0.0.1:3000')
            .delete('/api/event/delete', {name: event.name, date: getFullDate(clickedDate, selectedMonth)})
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader('Content-Type', 'application/json')
            .reply(200, {success: true});

        const result = await deleteEvent(event, clickedDate, selectedMonth, authToken, true);
        expect(result).toBe(true);
    });

    it('should handle API error with 400 status code', async () => {
        const clickedDate = 15;
        const selectedMonth = 'mar-2024';
        const authToken = 'auth-token';
        const event = {name: 'Event', date: "15.03.2024"};

        nock('http://127.0.0.1:3000')
            .delete('/api/event/delete', {name: event.name, date: getFullDate(clickedDate, selectedMonth)})
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader('Content-Type', 'application/json')
            .reply(400, {error: "Invalid input"});

        await expect(deleteEvent(event, clickedDate, selectedMonth, authToken, true)).rejects.toThrow('Error while deleting event: Invalid input');
    });

    it('should handle API error with 404 status code', async () => {
        const clickedDate = 15;
        const selectedMonth = 'mar-2024';
        const authToken = 'auth-token';
        const event = {name: 'Event', date: "15.03.2024"};

        nock('http://127.0.0.1:3000')
            .delete('/api/event/delete', {name: event.name, date: getFullDate(clickedDate, selectedMonth)})
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader('Content-Type', 'application/json')
            .reply(404, {error: "Event not found"});

        await expect(deleteEvent(event, clickedDate, selectedMonth, authToken, true)).rejects.toThrow('Error while deleting event: Event not found');
    });

    it('should handle API error with 401 status code', async () => {
        const clickedDate = 15;
        const selectedMonth = 'mar-2024';
        const authToken = 'auth-token';
        const event = {name: 'Event', date: "15.03.2024"};

        nock('http://127.0.0.1:3000')
            .delete('/api/event/delete', {name: event.name, date: getFullDate(clickedDate, selectedMonth)})
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader('Content-Type', 'application/json')
            .reply(401, {error: "Unauthorized"});

        await expect(deleteEvent(event, clickedDate, selectedMonth, authToken, true)).rejects.toThrow('Error while deleting event: Unauthorized');
    });

    it('should handle API error with 500 status code', async () => {
        const clickedDate = 15;
        const selectedMonth = 'mar-2024';
        const authToken = 'auth-token';
        const event = {name: 'Event', date: "15.03.2024"};

        nock('http://127.0.0.1:3000')
            .delete('/api/event/delete', {name: event.name, date: getFullDate(clickedDate, selectedMonth)})
            .matchHeader('Authorization', 'Bearer auth-token')
            .matchHeader('Content-Type', 'application/json')
            .reply(500, {error: "Internal Server Error"});

        await expect(deleteEvent(event, clickedDate, selectedMonth, authToken, true)).rejects.toThrow('Error while deleting event: Internal Server Error');
    });
});
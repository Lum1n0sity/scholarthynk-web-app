import {describe, it, expect, afterEach, vi, beforeEach} from 'vitest';
import {getFullCurrentDate, formatDate} from "$lib/js/utils.js";

describe('getFullCurrentDate', () => {
    it('should return the current date in the format "DD.MM.YYYY"', () => {
        const currentDate = getFullCurrentDate();
        expect(currentDate).toMatch(/^\d{2}\.\d{2}\.\d{4}$/);
    });
});

describe('formatDate', () => {
    it('should return the date in the format "DD.MM.YYYY"', () => {
        const date = new Date(2025, 0, 1);
        const formattedDate = formatDate(date);
        expect(formattedDate).toBe('01.01.2025');
    });
})
import { format, differenceInDays, addDays, isBefore, isAfter, isValid, parseISO, startOfDay, isEqual } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

export const DateUtils = {
    // Normalize string/Date to Data Date object (Midnight UTC or specific TZ)
    // For V01, we treat dates as local strings YYYY-MM-DD to avoid timezone hell,
    // or use UTC midnight.

    parseDate: (dateStr: string): Date | null => {
        if (!dateStr) return null;
        const d = parseISO(dateStr);
        return isValid(d) ? d : null;
    },

    isBefore: (date: Date, compareTo: Date): boolean => {
        return isBefore(date, compareTo);
    },

    isAfter: (date: Date, compareTo: Date): boolean => {
        return isAfter(date, compareTo);
    },

    // Calculate nights logic (arrival inclusive, departure exclusive)
    calcNights: (arrival: Date, departure: Date): number => {
        return differenceInDays(departure, arrival);
    },

    addDays: (date: Date, amount: number): Date => {
        return addDays(date, amount);
    },

    // Check if booking is active at asOfDate
    // Rule: booking <= asOf && (cancel is null OR cancel > asOf)
    isActiveAt: (bookingDate: Date, cancelDate: Date | null, asOfDate: Date): boolean => {
        // Note: inputs should be normalized to comparable dates (e.g. midnight)

        // 1. Booking must exist by then
        // If bookingDate > asOfDate -> Future booking -> NOT ACTIVE (in the past context)
        if (isAfter(bookingDate, asOfDate)) return false;

        // 2. Cancellation check
        if (cancelDate) {
            // If cancelDate <= asOfDate -> It was cancelled ON or BEFORE asOfDate -> INACTIVE
            // Therefore, must be cancelDate > asOfDate to be ACTIVE
            if (!isAfter(cancelDate, asOfDate)) return false;
        }

        return true;
    },

    // Format date for display
    format: (date: Date, pattern: string): string => {
        return format(date, pattern);
    },

    // Helpers for iterate
    eachDay: function* (start: Date, end: Date) {
        let current = start;
        while (!isAfter(current, end)) {
            yield current;
            current = addDays(current, 1);
        }
    }
};

import { RRule } from 'rrule';
import { startOfMonth, endOfMonth, addMonths, subMonths, format, parseISO, isSameDay } from 'date-fns';

/**
 * Default recurrence options
 */
export const RECURRENCE_OPTIONS = [
    { value: '', label: 'Does not repeat' },
    { value: 'FREQ=DAILY', label: 'Daily' },
    { value: 'FREQ=WEEKLY', label: 'Weekly' },
    { value: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR', label: 'Every weekday (Mon-Fri)' },
    { value: 'FREQ=MONTHLY', label: 'Monthly' },
    { value: 'FREQ=YEARLY', label: 'Yearly' },
    { value: 'custom', label: 'Custom...' },
];

/**
 * Frequency options
 */
export const FREQUENCY_OPTIONS = [
    { value: RRule.DAILY, label: 'Day' },
    { value: RRule.WEEKLY, label: 'Week' },
    { value: RRule.MONTHLY, label: 'Month' },
    { value: RRule.YEARLY, label: 'Year' },
];

/**
 * Weekday options
 */
export const WEEKDAY_OPTIONS = [
    { value: RRule.SU, label: 'Sun', short: 'S' },
    { value: RRule.MO, label: 'Mon', short: 'M' },
    { value: RRule.TU, label: 'Tue', short: 'T' },
    { value: RRule.WE, label: 'Wed', short: 'W' },
    { value: RRule.TH, label: 'Thu', short: 'T' },
    { value: RRule.FR, label: 'Fri', short: 'F' },
    { value: RRule.SA, label: 'Sat', short: 'S' },
];

/**
 * Parse RRule string into options object
 * @param {string} rruleString - RRule string
 * @returns {object} RRule options object
 */
export function parseRRuleString(rruleString) {
    if (!rruleString) return null;
    
    try {
        // If it's a complete RRULE format, parse directly
        if (rruleString.startsWith('RRULE:')) {
            return RRule.fromString(rruleString).options;
        }
        // If only the rule part, add RRULE: prefix
        return RRule.fromString(`RRULE:${rruleString}`).options;
    } catch (error) {
        console.error('Error parsing RRule string:', error);
        return null;
    }
}

/**
 * Create RRule string
 * @param {object} options - RRule options
 * @returns {string} RRule string (without RRULE: prefix)
 */
export function createRRuleString(options) {
    if (!options || !options.freq) return '';
    
    try {
        const rule = new RRule(options);
        // Return string without RRULE: prefix
        return rule.toString().replace('RRULE:', '');
    } catch (error) {
        console.error('Error creating RRule string:', error);
        return '';
    }
}

/**
 * Parse exdates string into date array
 * @param {string} exdatesString - Comma-separated date string
 * @returns {Date[]} Array of dates
 */
export function parseExdates(exdatesString) {
    if (!exdatesString) return [];
    
    return exdatesString
        .split(',')
        .filter(d => d.trim())
        .map(d => {
            try {
                return parseISO(d.trim());
            } catch {
                return null;
            }
        })
        .filter(d => d !== null);
}

/**
 * Check if date is in the exclusion list
 * @param {Date} date - Date to check
 * @param {Date[]} exdates - Array of excluded dates
 * @returns {boolean}
 */
export function isDateExcluded(date, exdates) {
    return exdates.some(exdate => isSameDay(date, exdate));
}

/**
 * Normalize date to midnight for comparison
 * @param {Date} date - Date to normalize
 * @returns {string} Normalized date string (yyyy-MM-dd)
 */
function normalizeDateForComparison(date) {
    return format(date, 'yyyy-MM-dd');
}

/**
 * Convert local date to "fake UTC" date for RRule
 * RRule has timezone issues - it treats dates as UTC internally.
 * This function creates a date that "looks like" the local time in UTC.
 * @param {Date} localDate - Local date
 * @returns {Date} Fake UTC date
 */
function toFakeUTC(localDate) {
    return new Date(Date.UTC(
        localDate.getFullYear(),
        localDate.getMonth(),
        localDate.getDate(),
        localDate.getHours(),
        localDate.getMinutes(),
        localDate.getSeconds()
    ));
}

/**
 * Convert "fake UTC" date back to local date
 * @param {Date} fakeUTCDate - Fake UTC date from RRule
 * @returns {Date} Local date
 */
function fromFakeUTC(fakeUTCDate) {
    return new Date(
        fakeUTCDate.getUTCFullYear(),
        fakeUTCDate.getUTCMonth(),
        fakeUTCDate.getUTCDate(),
        fakeUTCDate.getUTCHours(),
        fakeUTCDate.getUTCMinutes(),
        fakeUTCDate.getUTCSeconds()
    );
}

/**
 * Expand recurring event (considering exdates and exception instances)
 * @param {object} event - Event object
 * @param {Date} rangeStart - Range start date
 * @param {Date} rangeEnd - Range end date
 * @param {array} exceptions - Exception instances array
 * @returns {array} Array of expanded events
 */
export function expandRecurringEvent(event, rangeStart, rangeEnd, exceptions = []) {
    if (!event.rrule) {
        return [event];
    }

    try {
        const eventStart = new Date(event.start_time);
        const eventEnd = new Date(event.end_time);
        const duration = eventEnd.getTime() - eventStart.getTime();

        // Parse excluded dates
        const exdates = parseExdates(event.exdates);

        // Get exception instances for this event
        const eventExceptions = exceptions.filter(ex => ex.parent_event_id === event.id);

        // Create RRule
        const rruleOptions = parseRRuleString(event.rrule);
        if (!rruleOptions) {
            return [event];
        }

        // IMPORTANT: RRule has timezone issues. It internally uses UTC.
        // To work around this, we convert local times to "fake UTC" dates,
        // where the UTC values match the local time values.
        const fakeUTCStart = toFakeUTC(eventStart);
        
        const rule = new RRule({
            ...rruleOptions,
            dtstart: fakeUTCStart,
        });

        // Convert range to fake UTC as well, with some buffer
        const fakeUTCRangeStart = toFakeUTC(rangeStart);
        const fakeUTCRangeEnd = toFakeUTC(rangeEnd);

        // Get all dates within range (in fake UTC)
        const fakeUTCOccurrences = rule.between(fakeUTCRangeStart, fakeUTCRangeEnd, true);
        
        // Convert back to local dates
        const occurrences = fakeUTCOccurrences.map(d => fromFakeUTC(d));

        // Create exception map (using normalized date string as key)
        const exceptionMap = new Map();
        for (const ex of eventExceptions) {
            const originalStart = new Date(ex.original_start_time);
            const dateKey = normalizeDateForComparison(originalStart);
            exceptionMap.set(dateKey, ex);
        }

        // Create event instance for each occurrence (excluding dates in exdates)
        const instances = [];
        
        for (const occurrence of occurrences) {
            // Check if excluded (using isSameDay comparison)
            if (isDateExcluded(occurrence, exdates)) {
                // Excluded date, but check if there's an exception instance to display
                const occurrenceDateKey = normalizeDateForComparison(occurrence);
                const exception = exceptionMap.get(occurrenceDateKey);
                
                if (exception) {
                    // Has exception instance, display it
                    instances.push({
                        ...exception,
                        isRecurringInstance: true,
                        isException: true,
                        parentEvent: event,
                        instanceDate: occurrence,
                    });
                }
                // If no exception instance, truly exclude this day
                continue;
            }

            // Check if there's an exception instance (using normalized date comparison)
            const occurrenceDateKey = normalizeDateForComparison(occurrence);
            const exception = exceptionMap.get(occurrenceDateKey);

            if (exception) {
                // Use exception instance
                instances.push({
                    ...exception,
                    isRecurringInstance: true,
                    isException: true,
                    parentEvent: event,
                    instanceDate: occurrence,
                });
            } else {
                // Use normal instance
                instances.push({
                    ...event,
                    id: `${event.id}_${occurrence.getTime()}`, // Use composite ID
                    originalId: event.id, // Keep original ID
                    start_time: occurrence.toISOString(),
                    end_time: new Date(occurrence.getTime() + duration).toISOString(),
                    isRecurringInstance: true,
                    isException: false,
                    instanceDate: occurrence,
                });
            }
        }

        return instances;
    } catch (error) {
        console.error('Error expanding recurring event:', error);
        return [event];
    }
}

/**
 * Expand multiple events
 * @param {array} events - Events array
 * @param {Date} rangeStart - Range start date
 * @param {Date} rangeEnd - Range end date
 * @param {array} exceptions - All exception instances
 * @returns {array} Array of expanded events
 */
export function expandEvents(events, rangeStart, rangeEnd, exceptions = []) {
    const expanded = [];
    
    for (const event of events) {
        if (event.rrule) {
            // Recurring event - expand
            const instances = expandRecurringEvent(event, rangeStart, rangeEnd, exceptions);
            expanded.push(...instances);
        } else {
            // Non-recurring event - add directly
            expanded.push(event);
        }
    }
    
    return expanded;
}

/**
 * Get date range for month view (including partial dates from adjacent months)
 * @param {Date} currentDate - Current date
 * @returns {object} { start, end }
 */
export function getMonthViewRange(currentDate) {
    // Extend range to include dates from adjacent months shown in month view
    const start = subMonths(startOfMonth(currentDate), 1);
    const end = addMonths(endOfMonth(currentDate), 1);
    return { start, end };
}

/**
 * Convert RRule to human-readable description
 * @param {string} rruleString - RRule string
 * @returns {string} Human-readable description
 */
export function getRRuleDescription(rruleString) {
    if (!rruleString) return '';
    
    try {
        const fullString = rruleString.startsWith('RRULE:') 
            ? rruleString 
            : `RRULE:${rruleString}`;
        const rule = RRule.fromString(fullString);
        return rule.toText();
    } catch (error) {
        console.error('Error getting RRule description:', error);
        return rruleString;
    }
}

/**
 * Format instance date as ISO string (for API)
 * @param {Date} date - Date
 * @returns {string} ISO format date string
 */
export function formatInstanceDate(date) {
    return format(date, "yyyy-MM-dd'T'HH:mm:ss");
}

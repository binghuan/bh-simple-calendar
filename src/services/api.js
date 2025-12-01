/**
 * API Service Layer - Using IndexedDB as local database
 * No backend server required, all data stored in browser
 */

import { calendarsStore, eventsStore, initDB, initDefaultData } from './db';

/**
 * Initialize database
 */
export async function initializeDatabase() {
    await initDB();
    await initDefaultData();
}

/**
 * Calendars API - Using IndexedDB
 */
export const calendarsAPI = {
    getAll: async () => {
        const data = await calendarsStore.getAll();
        return { data };
    },
    
    getById: async (id) => {
        const data = await calendarsStore.getById(id);
        return { data };
    },
    
    create: async (calendarData) => {
        const data = await calendarsStore.add(calendarData);
        return { data };
    },
    
    update: async (id, calendarData) => {
        const data = await calendarsStore.update(id, calendarData);
        return { data };
    },
    
    delete: async (id) => {
        // When deleting a calendar, also delete all events under it
        const events = await eventsStore.getByIndex('calendar_id', id);
        for (const event of events) {
            await eventsStore.delete(event.id);
        }
        const data = await calendarsStore.delete(id);
        return { data };
    },
};

/**
 * Events API - Using IndexedDB
 */
export const eventsAPI = {
    getAll: async (params = {}) => {
        let events = await eventsStore.getAll();
        
        // Separate parent events and exception instances
        const parentEvents = events.filter(e => !e.parent_event_id);
        const exceptions = events.filter(e => e.parent_event_id);
        
        // Filter by parameters
        let filteredEvents = parentEvents;
        
        if (params.calendar_id) {
            filteredEvents = filteredEvents.filter(e => e.calendar_id === params.calendar_id);
        }
        
        if (params.start) {
            filteredEvents = filteredEvents.filter(e => new Date(e.start_time) >= new Date(params.start));
        }
        
        if (params.end) {
            filteredEvents = filteredEvents.filter(e => new Date(e.end_time) <= new Date(params.end));
        }
        
        // Return format compatible with backend API
        if (params.include_exceptions !== 'false') {
            return { 
                data: {
                    events: filteredEvents,
                    exceptions: exceptions
                }
            };
        }
        
        return { data: filteredEvents };
    },
    
    getById: async (id) => {
        const data = await eventsStore.getById(id);
        return { data };
    },
    
    create: async (eventData) => {
        const data = await eventsStore.add({
            ...eventData,
            all_day: eventData.all_day ? 1 : 0
        });
        return { data };
    },
    
    update: async (id, eventData) => {
        const existing = await eventsStore.getById(id);
        if (!existing) {
            throw new Error('Event not found');
        }
        
        const data = await eventsStore.update(id, {
            ...existing,
            ...eventData,
            all_day: eventData.all_day ? 1 : 0
        });
        return { data };
    },
    
    delete: async (id, params = {}) => {
        const event = await eventsStore.getById(id);
        if (!event) {
            throw new Error('Event not found');
        }
        
        const { delete_type, instance_date } = params;
        
        if (delete_type === 'this_only' && instance_date && event.rrule) {
            // Delete only this instance - add to exdates
            let exdates = event.exdates ? event.exdates.split(',').filter(d => d) : [];
            if (!exdates.includes(instance_date)) {
                exdates.push(instance_date);
            }
            await eventsStore.update(id, {
                ...event,
                exdates: exdates.join(',')
            });
            return { data: { message: 'Instance excluded successfully' } };
            
        } else if (delete_type === 'this_and_future' && instance_date && event.rrule) {
            // Delete this and future instances - modify UNTIL
            const untilDate = new Date(instance_date);
            untilDate.setDate(untilDate.getDate() - 1);
            
            let rrule = event.rrule;
            const untilStr = untilDate.toISOString().split('T')[0].replace(/-/g, '');
            
            if (rrule.includes('UNTIL=')) {
                rrule = rrule.replace(/UNTIL=[^;]+/, `UNTIL=${untilStr}`);
            } else if (rrule.includes('COUNT=')) {
                rrule = rrule.replace(/;?COUNT=[^;]+/, '') + `;UNTIL=${untilStr}`;
            } else {
                rrule += `;UNTIL=${untilStr}`;
            }
            
            await eventsStore.update(id, {
                ...event,
                rrule: rrule
            });
            return { data: { message: 'Future instances deleted successfully' } };
            
        } else {
            // Delete all - delete event and all its exceptions
            const exceptions = await eventsStore.getByIndex('parent_event_id', id);
            for (const ex of exceptions) {
                await eventsStore.delete(ex.id);
            }
            await eventsStore.delete(id);
            return { data: { message: 'Event deleted successfully' } };
        }
    },
    
    // Get exception instances of recurring event
    getExceptions: async (parentId) => {
        const data = await eventsStore.getByIndex('parent_event_id', parentId);
        return { data };
    },
    
    // Create exception instance
    createException: async (parentId, exceptionData) => {
        const parent = await eventsStore.getById(parentId);
        if (!parent) {
            throw new Error('Parent event not found');
        }
        
        // Check if exception already exists
        const existingExceptions = await eventsStore.getByIndex('parent_event_id', parentId);
        const alreadyExists = existingExceptions.some(
            ex => ex.original_start_time === exceptionData.original_start_time
        );
        
        if (alreadyExists) {
            throw new Error('Exception already exists for this date');
        }
        
        // Add original date to parent event's exdates
        let exdates = parent.exdates ? parent.exdates.split(',').filter(d => d) : [];
        if (!exdates.includes(exceptionData.original_start_time)) {
            exdates.push(exceptionData.original_start_time);
            await eventsStore.update(parentId, {
                ...parent,
                exdates: exdates.join(',')
            });
        }
        
        // Create exception instance
        const exception = await eventsStore.add({
            calendar_id: parent.calendar_id,
            title: exceptionData.title || parent.title,
            description: exceptionData.description !== undefined ? exceptionData.description : parent.description,
            start_time: exceptionData.start_time || exceptionData.original_start_time,
            end_time: exceptionData.end_time || exceptionData.original_start_time,
            all_day: exceptionData.all_day !== undefined ? (exceptionData.all_day ? 1 : 0) : parent.all_day,
            location: exceptionData.location !== undefined ? exceptionData.location : parent.location,
            color: exceptionData.color || parent.color,
            rrule: '', // Exception instances don't have rrule
            parent_event_id: parentId,
            original_start_time: exceptionData.original_start_time
        });
        
        return { data: exception };
    },
};

// Keep default export for backward compatibility
export default {
    calendarsAPI,
    eventsAPI,
    initializeDatabase
};

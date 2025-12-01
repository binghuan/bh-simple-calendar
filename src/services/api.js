/**
 * API 服務層 - 使用 IndexedDB 作為本地資料庫
 * 不需要後端伺服器，所有資料儲存在瀏覽器中
 */

import { calendarsStore, eventsStore, initDB, initDefaultData } from './db';

/**
 * 初始化資料庫
 */
export async function initializeDatabase() {
    await initDB();
    await initDefaultData();
}

/**
 * Calendars API - 使用 IndexedDB
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
        // 刪除日曆時，同時刪除該日曆下的所有事件
        const events = await eventsStore.getByIndex('calendar_id', id);
        for (const event of events) {
            await eventsStore.delete(event.id);
        }
        const data = await calendarsStore.delete(id);
        return { data };
    },
};

/**
 * Events API - 使用 IndexedDB
 */
export const eventsAPI = {
    getAll: async (params = {}) => {
        let events = await eventsStore.getAll();
        
        // 分離父事件和例外實例
        const parentEvents = events.filter(e => !e.parent_event_id);
        const exceptions = events.filter(e => e.parent_event_id);
        
        // 根據參數過濾
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
        
        // 返回格式與後端 API 相容
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
            // 只刪除這一個實例 - 加入 exdates
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
            // 刪除這個及之後的實例 - 修改 UNTIL
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
            // 刪除所有 - 刪除事件和其所有例外
            const exceptions = await eventsStore.getByIndex('parent_event_id', id);
            for (const ex of exceptions) {
                await eventsStore.delete(ex.id);
            }
            await eventsStore.delete(id);
            return { data: { message: 'Event deleted successfully' } };
        }
    },
    
    // 取得重複事件的例外實例
    getExceptions: async (parentId) => {
        const data = await eventsStore.getByIndex('parent_event_id', parentId);
        return { data };
    },
    
    // 建立例外實例
    createException: async (parentId, exceptionData) => {
        const parent = await eventsStore.getById(parentId);
        if (!parent) {
            throw new Error('Parent event not found');
        }
        
        // 檢查例外是否已存在
        const existingExceptions = await eventsStore.getByIndex('parent_event_id', parentId);
        const alreadyExists = existingExceptions.some(
            ex => ex.original_start_time === exceptionData.original_start_time
        );
        
        if (alreadyExists) {
            throw new Error('Exception already exists for this date');
        }
        
        // 將原始日期加入父事件的 exdates
        let exdates = parent.exdates ? parent.exdates.split(',').filter(d => d) : [];
        if (!exdates.includes(exceptionData.original_start_time)) {
            exdates.push(exceptionData.original_start_time);
            await eventsStore.update(parentId, {
                ...parent,
                exdates: exdates.join(',')
            });
        }
        
        // 建立例外實例
        const exception = await eventsStore.add({
            calendar_id: parent.calendar_id,
            title: exceptionData.title || parent.title,
            description: exceptionData.description !== undefined ? exceptionData.description : parent.description,
            start_time: exceptionData.start_time || exceptionData.original_start_time,
            end_time: exceptionData.end_time || exceptionData.original_start_time,
            all_day: exceptionData.all_day !== undefined ? (exceptionData.all_day ? 1 : 0) : parent.all_day,
            location: exceptionData.location !== undefined ? exceptionData.location : parent.location,
            color: exceptionData.color || parent.color,
            rrule: '', // 例外實例沒有 rrule
            parent_event_id: parentId,
            original_start_time: exceptionData.original_start_time
        });
        
        return { data: exception };
    },
};

// 為了向後相容，保留 default export
export default {
    calendarsAPI,
    eventsAPI,
    initializeDatabase
};

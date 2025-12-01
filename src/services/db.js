/**
 * IndexedDB Database Service
 * Using HTML5 IndexedDB to store calendar and event data
 */

const DB_NAME = 'MySimpleCalendarDB';
const DB_VERSION = 1;

let db = null;

/**
 * Initialize database
 */
export function initDB() {
    return new Promise((resolve, reject) => {
        if (db) {
            resolve(db);
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error('IndexedDB error:', event.target.error);
            reject(event.target.error);
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('IndexedDB connected successfully');
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = event.target.result;

            // Create calendars object store
            if (!database.objectStoreNames.contains('calendars')) {
                const calendarStore = database.createObjectStore('calendars', {
                    keyPath: 'id',
                    autoIncrement: true
                });
                calendarStore.createIndex('name', 'name', { unique: false });
            }

            // Create events object store
            if (!database.objectStoreNames.contains('events')) {
                const eventStore = database.createObjectStore('events', {
                    keyPath: 'id',
                    autoIncrement: true
                });
                eventStore.createIndex('calendar_id', 'calendar_id', { unique: false });
                eventStore.createIndex('start_time', 'start_time', { unique: false });
                eventStore.createIndex('parent_event_id', 'parent_event_id', { unique: false });
            }

            console.log('IndexedDB schema created');
        };
    });
}

/**
 * Get database instance
 */
export async function getDB() {
    if (!db) {
        await initDB();
    }
    return db;
}

/**
 * Generic database operation wrapper
 */
class Store {
    constructor(storeName) {
        this.storeName = storeName;
    }

    async getTransaction(mode = 'readonly') {
        const database = await getDB();
        return database.transaction(this.storeName, mode);
    }

    async getAll() {
        return new Promise(async (resolve, reject) => {
            const transaction = await this.getTransaction();
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getById(id) {
        return new Promise(async (resolve, reject) => {
            const transaction = await this.getTransaction();
            const store = transaction.objectStore(this.storeName);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async add(data) {
        return new Promise(async (resolve, reject) => {
            const transaction = await this.getTransaction('readwrite');
            const store = transaction.objectStore(this.storeName);
            
            // Add timestamps
            const record = {
                ...data,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            // Remove id if undefined or null, let autoIncrement generate it
            if (record.id === undefined || record.id === null) {
                delete record.id;
            }

            const request = store.add(record);

            request.onsuccess = () => {
                resolve({ ...record, id: request.result });
            };
            request.onerror = () => reject(request.error);
        });
    }

    async update(id, data) {
        return new Promise(async (resolve, reject) => {
            const transaction = await this.getTransaction('readwrite');
            const store = transaction.objectStore(this.storeName);
            
            const record = {
                ...data,
                id: id,
                updated_at: new Date().toISOString()
            };

            const request = store.put(record);

            request.onsuccess = () => resolve(record);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(id) {
        return new Promise(async (resolve, reject) => {
            const transaction = await this.getTransaction('readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(id);

            request.onsuccess = () => resolve({ success: true });
            request.onerror = () => reject(request.error);
        });
    }

    async getByIndex(indexName, value) {
        return new Promise(async (resolve, reject) => {
            const transaction = await this.getTransaction();
            const store = transaction.objectStore(this.storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async clear() {
        return new Promise(async (resolve, reject) => {
            const transaction = await this.getTransaction('readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();

            request.onsuccess = () => resolve({ success: true });
            request.onerror = () => reject(request.error);
        });
    }
}

// Export Store instances
export const calendarsStore = new Store('calendars');
export const eventsStore = new Store('events');

/**
 * Initialize default calendars (if no calendars exist)
 */
export async function initDefaultData() {
    const calendars = await calendarsStore.getAll();
    
    if (calendars.length === 0) {
        // Create default calendars
        await calendarsStore.add({
            name: 'Personal',
            color: '#1976d2',
            description: 'Personal calendar'
        });
        
        await calendarsStore.add({
            name: 'Work',
            color: '#388e3c',
            description: 'Work calendar'
        });
        
        console.log('Default calendars created');
    }
}

/**
 * Export data (for backup)
 */
export async function exportData() {
    const calendars = await calendarsStore.getAll();
    const events = await eventsStore.getAll();
    
    return {
        version: DB_VERSION,
        exportDate: new Date().toISOString(),
        calendars,
        events
    };
}

/**
 * Import data (for restore)
 */
export async function importData(data) {
    if (!data || !data.calendars || !data.events) {
        throw new Error('Invalid data format');
    }
    
    // Clear existing data
    await calendarsStore.clear();
    await eventsStore.clear();
    
    // Import calendars
    for (const calendar of data.calendars) {
        await calendarsStore.add(calendar);
    }
    
    // Import events
    for (const event of data.events) {
        await eventsStore.add(event);
    }
    
    return { success: true, message: 'Data imported successfully' };
}

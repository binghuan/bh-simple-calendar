/**
 * IndexedDB 資料庫服務
 * 使用 HTML5 IndexedDB 來儲存日曆和事件資料
 */

const DB_NAME = 'MySimpleCalendarDB';
const DB_VERSION = 1;

let db = null;

/**
 * 初始化資料庫
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

            // 建立 calendars 物件存儲
            if (!database.objectStoreNames.contains('calendars')) {
                const calendarStore = database.createObjectStore('calendars', {
                    keyPath: 'id',
                    autoIncrement: true
                });
                calendarStore.createIndex('name', 'name', { unique: false });
            }

            // 建立 events 物件存儲
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
 * 取得資料庫實例
 */
export async function getDB() {
    if (!db) {
        await initDB();
    }
    return db;
}

/**
 * 通用的資料庫操作封裝
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
            
            // 加入時間戳記
            const record = {
                ...data,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            // 移除 id 如果是 undefined 或 null，讓 autoIncrement 自動產生
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

// 匯出 Store 實例
export const calendarsStore = new Store('calendars');
export const eventsStore = new Store('events');

/**
 * 初始化預設日曆（如果沒有任何日曆）
 */
export async function initDefaultData() {
    const calendars = await calendarsStore.getAll();
    
    if (calendars.length === 0) {
        // 建立預設日曆
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
 * 匯出資料（用於備份）
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
 * 匯入資料（用於還原）
 */
export async function importData(data) {
    if (!data || !data.calendars || !data.events) {
        throw new Error('Invalid data format');
    }
    
    // 清空現有資料
    await calendarsStore.clear();
    await eventsStore.clear();
    
    // 匯入日曆
    for (const calendar of data.calendars) {
        await calendarsStore.add(calendar);
    }
    
    // 匯入事件
    for (const event of data.events) {
        await eventsStore.add(event);
    }
    
    return { success: true, message: 'Data imported successfully' };
}

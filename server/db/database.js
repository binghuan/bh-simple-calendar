const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../db/calendar.db');

let dbInstance = null;

async function getDatabase() {
    if (dbInstance) {
        return dbInstance;
    }

    const SQL = await initSqlJs();

    if (!fs.existsSync(DB_PATH)) {
        throw new Error('Database not found. Please run: npm run migrate');
    }

    const buffer = fs.readFileSync(DB_PATH);
    dbInstance = new SQL.Database(buffer);

    return dbInstance;
}

function saveDatabase(db) {
    const data = db.export();
    fs.writeFileSync(DB_PATH, data);
}

function executeQuery(db, query, params = []) {
    try {
        const stmt = db.prepare(query);
        stmt.bind(params);

        const results = [];
        while (stmt.step()) {
            results.push(stmt.getAsObject());
        }
        stmt.free();

        return results;
    } catch (error) {
        console.error('Query error:', error);
        throw error;
    }
}

function executeUpdate(db, query, params = []) {
    try {
        db.run(query, params);
        saveDatabase(db);
        return { success: true };
    } catch (error) {
        console.error('Update error:', error);
        throw error;
    }
}

module.exports = {
    getDatabase,
    saveDatabase,
    executeQuery,
    executeUpdate
};

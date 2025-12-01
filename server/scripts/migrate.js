const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../db/calendar.db');

async function initializeDatabase() {
  const SQL = await initSqlJs();
  
  // Check if database exists
  let db;
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
    console.log('Database already exists');
  } else {
    db = new SQL.Database();
    console.log('Creating new database...');
    
    // Create calendars table
    db.run(`
      CREATE TABLE calendars (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        color TEXT DEFAULT '#1976d2',
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create events table
    db.run(`
      CREATE TABLE events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        calendar_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        start_time DATETIME NOT NULL,
        end_time DATETIME NOT NULL,
        all_day INTEGER DEFAULT 0,
        location TEXT,
        color TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (calendar_id) REFERENCES calendars(id) ON DELETE CASCADE
      )
    `);
    
    // Save database to file
    const data = db.export();
    fs.writeFileSync(DB_PATH, data);
    console.log('Database created successfully at:', DB_PATH);
  }
  
  db.close();
}

if (require.main === module) {
  initializeDatabase().catch(console.error);
}

module.exports = { initializeDatabase };

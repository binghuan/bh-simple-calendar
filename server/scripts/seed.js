const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../db/calendar.db');

async function seedDatabase() {
    const SQL = await initSqlJs();

    if (!fs.existsSync(DB_PATH)) {
        console.error('Database does not exist. Run npm run migrate first.');
        process.exit(1);
    }

    const buffer = fs.readFileSync(DB_PATH);
    const db = new SQL.Database(buffer);

    console.log('Seeding database...');

    // Insert sample calendars
    db.run(`
    INSERT INTO calendars (name, color, description) VALUES
    ('Personal', '#1976d2', 'Personal events and appointments'),
    ('Work', '#f57c00', 'Work-related meetings and tasks'),
    ('Family', '#388e3c', 'Family gatherings and events')
  `);

    // Insert sample events
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    db.run(`
    INSERT INTO events (calendar_id, title, description, start_time, end_time, all_day, location, color) VALUES
    (1, 'Morning Workout', 'Gym session', '${today.toISOString().split('T')[0]} 07:00:00', '${today.toISOString().split('T')[0]} 08:00:00', 0, 'Fitness Center', '#1976d2'),
    (2, 'Team Meeting', 'Weekly sync with the team', '${today.toISOString().split('T')[0]} 10:00:00', '${today.toISOString().split('T')[0]} 11:00:00', 0, 'Conference Room A', '#f57c00'),
    (1, 'Lunch with Sarah', 'Catch up over lunch', '${today.toISOString().split('T')[0]} 12:30:00', '${today.toISOString().split('T')[0]} 13:30:00', 0, 'Downtown Cafe', '#1976d2'),
    (3, 'Family Dinner', 'Monthly family gathering', '${tomorrow.toISOString().split('T')[0]} 18:00:00', '${tomorrow.toISOString().split('T')[0]} 20:00:00', 0, 'Home', '#388e3c'),
    (2, 'Project Deadline', 'Submit final report', '${tomorrow.toISOString().split('T')[0]} 00:00:00', '${tomorrow.toISOString().split('T')[0]} 23:59:59', 1, null, '#f57c00')
  `);

    // Save database
    const data = db.export();
    fs.writeFileSync(DB_PATH, data);

    console.log('Database seeded successfully!');
    db.close();
}

if (require.main === module) {
    seedDatabase().catch(console.error);
}

module.exports = { seedDatabase };

const express = require('express');
const router = express.Router();
const { getDatabase, executeQuery, executeUpdate, saveDatabase } = require('../db/database');

// GET /api/v1/events - List events with optional date range filtering
router.get('/', async (req, res) => {
    try {
        const { start, end, calendar_id } = req.query;
        const db = await getDatabase();

        let query = 'SELECT * FROM events WHERE 1=1';
        const params = [];

        if (start) {
            query += ' AND start_time >= ?';
            params.push(start);
        }

        if (end) {
            query += ' AND end_time <= ?';
            params.push(end);
        }

        if (calendar_id) {
            query += ' AND calendar_id = ?';
            params.push(calendar_id);
        }

        query += ' ORDER BY start_time';

        const events = executeQuery(db, query, params);
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/v1/events/:id - Get event by ID
router.get('/:id', async (req, res) => {
    try {
        const db = await getDatabase();
        const events = executeQuery(db, 'SELECT * FROM events WHERE id = ?', [req.params.id]);

        if (events.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }

        res.json(events[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/v1/events - Create event
router.post('/', async (req, res) => {
    try {
        const { calendar_id, title, description, start_time, end_time, all_day, location, color } = req.body;

        if (!calendar_id || !title || !start_time || !end_time) {
            return res.status(400).json({ error: 'calendar_id, title, start_time, and end_time are required' });
        }

        const db = await getDatabase();

        // Verify calendar exists
        const calendar = executeQuery(db, 'SELECT * FROM calendars WHERE id = ?', [calendar_id]);
        if (calendar.length === 0) {
            return res.status(404).json({ error: 'Calendar not found' });
        }

        db.run(
            `INSERT INTO events (calendar_id, title, description, start_time, end_time, all_day, location, color)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [calendar_id, title, description || '', start_time, end_time, all_day ? 1 : 0, location || '', color || '']
        );
        saveDatabase(db);

        const newEvent = executeQuery(db, 'SELECT * FROM events ORDER BY id DESC LIMIT 1');
        res.status(201).json(newEvent[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/v1/events/:id - Update event
router.put('/:id', async (req, res) => {
    try {
        const { calendar_id, title, description, start_time, end_time, all_day, location, color } = req.body;
        const db = await getDatabase();

        // Check if event exists
        const existing = executeQuery(db, 'SELECT * FROM events WHERE id = ?', [req.params.id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }

        db.run(
            `UPDATE events SET 
        calendar_id = ?, title = ?, description = ?, start_time = ?, end_time = ?,
        all_day = ?, location = ?, color = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
            [calendar_id, title, description, start_time, end_time, all_day ? 1 : 0, location, color, req.params.id]
        );
        saveDatabase(db);

        const updated = executeQuery(db, 'SELECT * FROM events WHERE id = ?', [req.params.id]);
        res.json(updated[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/v1/events/:id - Delete event
router.delete('/:id', async (req, res) => {
    try {
        const db = await getDatabase();

        // Check if event exists
        const existing = executeQuery(db, 'SELECT * FROM events WHERE id = ?', [req.params.id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }

        db.run('DELETE FROM events WHERE id = ?', [req.params.id]);
        saveDatabase(db);

        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

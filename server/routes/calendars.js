const express = require('express');
const router = express.Router();
const { getDatabase, executeQuery, executeUpdate, saveDatabase } = require('../db/database');

// GET /api/v1/calendars - List all calendars
router.get('/', async (req, res) => {
    try {
        const db = await getDatabase();
        const calendars = executeQuery(db, 'SELECT * FROM calendars ORDER BY id');
        res.json(calendars);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/v1/calendars/:id - Get calendar by ID
router.get('/:id', async (req, res) => {
    try {
        const db = await getDatabase();
        const calendars = executeQuery(db, 'SELECT * FROM calendars WHERE id = ?', [req.params.id]);

        if (calendars.length === 0) {
            return res.status(404).json({ error: 'Calendar not found' });
        }

        res.json(calendars[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/v1/calendars - Create calendar
router.post('/', async (req, res) => {
    try {
        const { name, color, description } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        const db = await getDatabase();
        db.run(
            'INSERT INTO calendars (name, color, description) VALUES (?, ?, ?)',
            [name, color || '#1976d2', description || '']
        );
        saveDatabase(db);

        const newCalendar = executeQuery(db, 'SELECT * FROM calendars ORDER BY id DESC LIMIT 1');
        res.status(201).json(newCalendar[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/v1/calendars/:id - Update calendar
router.put('/:id', async (req, res) => {
    try {
        const { name, color, description } = req.body;
        const db = await getDatabase();

        // Check if calendar exists
        const existing = executeQuery(db, 'SELECT * FROM calendars WHERE id = ?', [req.params.id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Calendar not found' });
        }

        db.run(
            'UPDATE calendars SET name = ?, color = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [name, color, description, req.params.id]
        );
        saveDatabase(db);

        const updated = executeQuery(db, 'SELECT * FROM calendars WHERE id = ?', [req.params.id]);
        res.json(updated[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/v1/calendars/:id - Delete calendar
router.delete('/:id', async (req, res) => {
    try {
        const db = await getDatabase();

        // Check if calendar exists
        const existing = executeQuery(db, 'SELECT * FROM calendars WHERE id = ?', [req.params.id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Calendar not found' });
        }

        db.run('DELETE FROM calendars WHERE id = ?', [req.params.id]);
        saveDatabase(db);

        res.json({ message: 'Calendar deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

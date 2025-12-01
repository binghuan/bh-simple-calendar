const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const calendarsRouter = require('./routes/calendars');
const eventsRouter = require('./routes/events');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// API Routes
app.use('/api/v1/calendars', calendarsRouter);
app.use('/api/v1/events', eventsRouter);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Calendar API is running' });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Google Calendar Clone API',
        version: '1.0.0',
        endpoints: {
            calendars: '/api/v1/calendars',
            events: '/api/v1/events',
            health: '/health'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Calendar API Server running on http://localhost:${PORT}`);
    console.log(`📊 API Documentation:`);
    console.log(`   - Calendars: http://localhost:${PORT}/api/v1/calendars`);
    console.log(`   - Events: http://localhost:${PORT}/api/v1/events`);
    console.log(`   - Health: http://localhost:${PORT}/health\n`);
});

module.exports = app;

# Calendar API Server (Node.js)

This directory contains the Node.js/Express backend for the MySimpleCalendar application. It provides a RESTful API for managing calendars and events, using a SQLite database.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/)

## Setup

1.  Navigate to the `server` directory:
    ```bash
    cd server
    ```
2.  Install the dependencies:
    ```bash
    npm install
    ```

## Database

The server uses a SQLite database file (`db/calendar.db`).

-   **To create the database schema**, run the migration script. This will create the necessary `calendars` and `events` tables.
    ```bash
    npm run migrate
    ```
-   **To populate the database with initial seed data**, run the seed script.
    ```bash
    npm run seed
    ```

## Running the Server

-   **For development**, run the server with `nodemon` for automatic restarts on file changes:
    ```bash
    npm run dev
    ```
-   **For production**, use the standard `start` script:
    ```bash
    npm start
    ```

The server will start on the port specified in your `.env` file, or a default port (e.g., 3001).

---

## API Endpoints

All endpoints are prefixed with `/api/v1`.

### Calendars

-   `GET /calendars`
    -   Description: List all calendars.
    -   Response: `200 OK` - An array of calendar objects.

-   `GET /calendars/:id`
    -   Description: Get a single calendar by its ID.
    -   Response: `200 OK` - A calendar object.

-   `POST /calendars`
    -   Description: Create a new calendar.
    -   Body: `{ "name": "string", "color": "string" (optional), "description": "string" (optional) }`
    -   Response: `201 Created` - The newly created calendar object.

-   `PUT /calendars/:id`
    -   Description: Update an existing calendar.
    -   Body: `{ "name": "string", "color": "string", "description": "string" }`
    -   Response: `200 OK` - The updated calendar object.

-   `DELETE /calendars/:id`
    -   Description: Delete a calendar.
    -   Response: `200 OK` - `{ "message": "Calendar deleted successfully" }`.

### Events

-   `GET /events`
    -   Description: List all events. Can be filtered by a date range or calendar ID.
    -   Query Parameters:
        -   `start` (string, e.g., '2025-12-01T00:00:00Z')
        -   `end` (string, e.g., '2025-12-31T23:59:59Z')
        -   `calendar_id` (integer)
    -   Response: `200 OK` - An array of event objects.

-   `GET /events/:id`
    -   Description: Get a single event by its ID.
    -   Response: `200 OK` - An event object.

-   `POST /events`
    -   Description: Create a new event.
    -   Body: `{ "calendar_id": integer, "title": "string", "start_time": "datetime", "end_time": "datetime", "description": "string" (optional), ... }`
    -   Response: `201 Created` - The newly created event object.

-   `PUT /events/:id`
    -   Description: Update an existing event.
    -   Body: `{ "calendar_id": integer, "title": "string", "start_time": "datetime", "end_time": "datetime", ... }`
    -   Response: `200 OK` - The updated event object.

-   `DELETE /events/:id`
    -   Description: Delete an event.
    -   Response: `200 OK` - `{ "message": "Event deleted successfully" }`.

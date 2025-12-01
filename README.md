# MySimpleCalendar

MySimpleCalendar is a full-stack web application designed to be a simple, lightweight clone of a calendar service like Google Calendar. It features a modern React frontend and a choice of backend APIs.

## Project Structure

This monorepo contains three main projects:

-   `client/`: A React single-page application built with Vite that provides the user interface.
-   `server/`: A RESTful API backend built with Node.js, Express, and SQLite.
-   `server_ruby_on_rails/`: An alternative RESTful API backend built with Ruby on Rails. *(Work in Progress)*

---

## Getting Started

To run this application, you will need to run the client and one of the server backends simultaneously.

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or later)
-   [npm](https://www.npmjs.com/)
-   For the Ruby on Rails server: [Ruby](https://www.ruby-lang.org/) and [Bundler](https://bundler.io/).

### 1. Running the React Client

The client is the user interface for the calendar.

```bash
# Navigate to the client directory
cd client

# Install dependencies
npm install

# Run the development server
npm run dev
```

The client will be available at `http://localhost:5173` (or another port if 5173 is in use).

### 2. Running the Node.js Server

This is the primary, fully functional backend for the application.

```bash
# Navigate to the Node.js server directory
cd server

# Install dependencies
npm install

# Create and seed the database
npm run migrate
npm run seed

# Run the server
npm run dev
```

The API will be available at `http://localhost:3001` (by default). The client is pre-configured to communicate with this server.

### 3. Running the Ruby on Rails Server (Optional)

This is an alternative backend that is currently under development.

```bash
# Navigate to the Ruby on Rails server directory
cd server_ruby_on_rails

# (Further setup instructions will be added once development is complete)
```

# bh-simple-calendar

A simple and elegant calendar application built with React. All data is stored locally in the browser using IndexedDB - no backend server required!

![Screenshot](./README/illustration.png)

🔗 **Live Demo:** [https://bh-simple-calendar.web.app/](https://bh-simple-calendar.web.app/)

- [bh-simple-calendar](#bh-simple-calendar)
  - [✨ Features](#-features)
  - [🛠️ Tech Stack](#️-tech-stack)
  - [Quick Start](#quick-start)
    - [Install Dependencies](#install-dependencies)
    - [Start Development Server](#start-development-server)
    - [Build for Production](#build-for-production)
    - [Preview Production Build](#preview-production-build)
    - [Lint Code](#lint-code)
  - [📁 Project Structure](#-project-structure)
  - [🗄️ Database Schema (IndexedDB)](#️-database-schema-indexeddb)
    - [Calendars Store](#calendars-store)
    - [Events Store](#events-store)
  - [🔄 Recurring Events (RRule)](#-recurring-events-rrule)
    - [How It Works](#how-it-works)
    - [Architecture: Client-Side Expansion](#architecture-client-side-expansion)
      - [Comparison of Approaches](#comparison-of-approaches)
    - [RRule Examples](#rrule-examples)
    - [Exception Handling](#exception-handling)


## ✨ Features

- 📅 **Monthly Calendar View** - Clean and intuitive calendar interface
- 🔄 **Recurring Events** - Support for daily, weekly, monthly, and yearly recurring events using RRule
- ✏️ **Exception Handling** - Edit or delete individual occurrences of recurring events (like Google Calendar)
- 🎨 **Multiple Calendars** - Create and manage multiple calendars with different colors
- 💾 **Local Storage** - All data stored in browser's IndexedDB, works offline
- 📤 **Export/Import** - Backup and restore your calendar data

## 🛠️ Tech Stack

- React 19
- Vite 7
- Material-UI (MUI) 7
- date-fns
- RRule (recurring events)
- IndexedDB (local storage)

## Quick Start

### Install Dependencies

```bash
npm install
# or
yarn install
```

### Start Development Server

```bash
npm run dev
# or
yarn dev
```

The development server will start at http://localhost:5173 by default.

### Build for Production

```bash
npm run build
# or
yarn build
```

### Preview Production Build

```bash
npm run preview
# or
yarn preview
```

### Lint Code

```bash
npm run lint
# or
yarn lint
```

## 📁 Project Structure

```
MySimpleCalendar/
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   │   ├── Calendar/    # Calendar view components
│   │   ├── Events/      # Event dialog components
│   │   └── Sidebar/     # Sidebar components
│   ├── services/        # API and database services
│   │   ├── api.js       # API layer using IndexedDB
│   │   └── db.js        # IndexedDB operations
│   ├── utils/           # Utility functions
│   │   └── rruleHelper.js  # RRule utilities
│   ├── App.jsx          # Main application component
│   └── main.jsx         # Application entry point
├── index.html
├── package.json
└── vite.config.js
```

## 🗄️ Database Schema (IndexedDB)

### Calendars Store

| Field | Type | Description |
|-------|------|-------------|
| `id` | Number | Primary key (auto-increment) |
| `name` | String | Calendar name |
| `color` | String | Display color (hex code, e.g., `#1976d2`) |
| `description` | String | Calendar description |
| `created_at` | String | Creation timestamp (ISO 8601) |
| `updated_at` | String | Last update timestamp (ISO 8601) |

### Events Store

| Field | Type | Description |
|-------|------|-------------|
| `id` | Number | Primary key (auto-increment) |
| `calendar_id` | Number | Foreign key to calendars |
| `title` | String | Event title |
| `description` | String | Event description |
| `start_time` | String | Start time (ISO 8601) |
| `end_time` | String | End time (ISO 8601) |
| `all_day` | Number | All-day event flag (0 or 1) |
| `location` | String | Event location |
| `color` | String | Custom color (optional) |
| `rrule` | String | RRule string for recurring events |
| `exdates` | String | Excluded dates (comma-separated, e.g., `2025-01-15,2025-01-22`) |
| `parent_event_id` | Number | Parent event ID for exception instances |
| `original_start_time` | String | Original occurrence date for exceptions |
| `created_at` | String | Creation timestamp |
| `updated_at` | String | Last update timestamp |

**Indexes:**
- `calendar_id` - For filtering events by calendar
- `start_time` - For date range queries
- `parent_event_id` - For finding exception instances

## 🔄 Recurring Events (RRule)

This application uses the [RRule](https://github.com/jakubroztocil/rrule) library to handle recurring events according to the iCalendar RFC 5545 specification.

### How It Works

1. **Single Database Record**: Each recurring event is stored as a single record with an `rrule` field
2. **Client-Side Expansion**: The frontend expands the RRule to generate all occurrences within the visible date range
3. **Efficient Storage**: No matter how many occurrences, only one record is stored

### Architecture: Client-Side Expansion

This application uses **client-side expansion** for recurring events. Here's how it compares to alternative approaches:

```
┌─────────────────┐
│   IndexedDB     │
│                 │
│  1 record       │      Only the rule is stored,
│  rrule=DAILY    │      not individual instances
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ expandEvents()  │      RRule library calculates
│                 │      all occurrences within
│ Uses RRule lib  │      the visible date range
│ to calculate    │
│ occurrences     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   MonthView     │
│                 │      Displays N event instances
│  12/1 ✓ event   │      (generated on-the-fly)
│  12/2 ✓ event   │
│  12/3 ✓ event   │
│  ...            │
└─────────────────┘
```

#### Comparison of Approaches

| Approach | Pros | Cons |
|----------|------|------|
| **Client-side expansion (this app)** | Low bandwidth, light server load, works offline | Client needs RRule support, timezone handling required |
| **Server-side expansion** | Simple client, consistent timezone handling | High bandwidth, heavy server load, requires date range |

**Industry Examples:**
- Google Calendar API & Microsoft Graph API use client-side expansion (return RRule, client expands)
- Some enterprise systems use server-side expansion for simplicity

### RRule Examples

| Pattern | RRule String |
|---------|--------------|
| Daily | `FREQ=DAILY` |
| Every weekday | `FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR` |
| Weekly on Monday | `FREQ=WEEKLY;BYDAY=MO` |
| Monthly on the 15th | `FREQ=MONTHLY;BYMONTHDAY=15` |
| Yearly on Jan 1st | `FREQ=YEARLY;BYMONTH=1;BYMONTHDAY=1` |
| Daily until Dec 31 | `FREQ=DAILY;UNTIL=20251231` |
| Daily, 10 times | `FREQ=DAILY;COUNT=10` |

### Exception Handling

When you edit or delete a single occurrence of a recurring event:

1. **Delete single occurrence**: The date is added to `exdates` field
2. **Edit single occurrence**: 
   - The original date is added to parent's `exdates`
   - A new exception record is created with `parent_event_id` and `original_start_time`
3. **Delete this and future**: The RRule's `UNTIL` parameter is modified

```
┌─────────────────────────────────────────────────────────────┐
│                    Recurring Event                          │
│  rrule: "FREQ=WEEKLY;BYDAY=MO"                             │
│  exdates: "2025-01-13,2025-01-20"                          │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│   Exception Instance    │     │   Exception Instance    │
│   parent_event_id: 1    │     │   parent_event_id: 1    │
│   original_start_time:  │     │   original_start_time:  │
│   "2025-01-13"          │     │   "2025-01-20"          │
│   title: "Modified..."  │     │   (deleted - no record) │
└─────────────────────────┘     └─────────────────────────┘
```

---

[中文說明](./README_zh.md)

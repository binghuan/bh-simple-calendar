import React, { useState, useEffect } from 'react';
import { Box, CssBaseline, ThemeProvider, CircularProgress } from '@mui/material';
import { addMonths, subMonths } from 'date-fns';
import theme from './theme';
import { calendarsAPI, eventsAPI } from './services/api';

// Components
import CalendarHeader from './components/Calendar/CalendarHeader';
import CalendarList from './components/Sidebar/CalendarList';
import MonthView from './components/Calendar/MonthView';
import EventDialog from './components/Events/EventDialog';

function App() {
  // State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month');
  const [calendars, setCalendars] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  // Initial data fetch
  useEffect(() => {
    fetchCalendars();
  }, []);

  // Fetch events when date or calendars change
  useEffect(() => {
    if (calendars.length > 0) {
      fetchEvents();
    }
  }, [currentDate, calendars]);

  const fetchCalendars = async () => {
    try {
      const response = await calendarsAPI.getAll();
      // Add visible property to control filtering
      setCalendars(response.data.map(cal => ({ ...cal, visible: true })));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching calendars:', error);
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      // Get all events and filter client-side for now
      // In a real app, we'd pass date range to API
      const response = await eventsAPI.getAll();
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  // Navigation handlers
  const handlePrev = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNext = () => setCurrentDate(addMonths(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  // Calendar handlers
  const handleToggleCalendar = (id) => {
    setCalendars(calendars.map(cal =>
      cal.id === id ? { ...cal, visible: !cal.visible } : cal
    ));
  };

  const handleCreateCalendar = async (data) => {
    try {
      const response = await calendarsAPI.create(data);
      setCalendars([...calendars, { ...response.data, visible: true }]);
    } catch (error) {
      console.error('Error creating calendar:', error);
    }
  };

  const handleDeleteCalendar = async (id) => {
    if (window.confirm('Are you sure you want to delete this calendar? All events will be lost.')) {
      try {
        await calendarsAPI.delete(id);
        setCalendars(calendars.filter(cal => cal.id !== id));
      } catch (error) {
        console.error('Error deleting calendar:', error);
      }
    }
  };

  // Event handlers
  const handleDateClick = (date) => {
    setSelectedDate(date);
    setSelectedEvent(null);
    setDialogOpen(true);
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setSelectedDate(null);
    setDialogOpen(true);
  };

  const handleSaveEvent = async (eventData) => {
    try {
      if (eventData.id) {
        await eventsAPI.update(eventData.id, eventData);
      } else {
        await eventsAPI.create(eventData);
      }
      fetchEvents();
      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const handleDeleteEvent = async (id) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await eventsAPI.delete(id);
        fetchEvents();
        setDialogOpen(false);
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  // Filter events based on visible calendars
  const visibleEvents = events.filter(event => {
    const calendar = calendars.find(cal => cal.id === event.calendar_id);
    return calendar && calendar.visible;
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <CalendarHeader
          currentDate={currentDate}
          onPrev={handlePrev}
          onNext={handleNext}
          onToday={handleToday}
          view={view}
          onViewChange={setView}
        />

        <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <CalendarList
            calendars={calendars}
            onToggleCalendar={handleToggleCalendar}
            onCreateCalendar={handleCreateCalendar}
            onDeleteCalendar={handleDeleteCalendar}
          />

          <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
            <MonthView
              currentDate={currentDate}
              events={visibleEvents}
              onDateClick={handleDateClick}
              onEventClick={handleEventClick}
            />
          </Box>
        </Box>

        <EventDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
          event={selectedEvent}
          selectedDate={selectedDate}
          calendars={calendars}
        />
      </Box>
    </ThemeProvider>
  );
}

export default App;

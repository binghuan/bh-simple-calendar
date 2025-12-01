import React, { useState, useEffect } from 'react';
import { Box, CssBaseline, ThemeProvider, CircularProgress, Typography } from '@mui/material';
import { addMonths, subMonths } from 'date-fns';
import theme from './theme';
import { calendarsAPI, eventsAPI, initializeDatabase } from './services/api';

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
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbInitialized, setDbInitialized] = useState(false);
  const [initError, setInitError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  // 初始化 IndexedDB
  useEffect(() => {
    const initDB = async () => {
      try {
        await initializeDatabase();
        setDbInitialized(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
        setInitError(error.message);
        setLoading(false);
      }
    };
    initDB();
  }, []);

  // 資料庫初始化後載入日曆
  useEffect(() => {
    if (dbInitialized) {
      fetchCalendars();
    }
  }, [dbInitialized]);

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
      // Get all events including exceptions
      const response = await eventsAPI.getAll({ include_exceptions: true });
      
      // API 現在返回 { events, exceptions } 格式
      if (response.data.events && response.data.exceptions) {
        setEvents(response.data.events);
        setExceptions(response.data.exceptions);
      } else {
        // 向後兼容：如果 API 返回舊格式
        setEvents(Array.isArray(response.data) ? response.data : []);
        setExceptions([]);
      }
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

  // 儲存例外實例（只修改這一天）
  const handleSaveException = async (parentId, exceptionData) => {
    try {
      await eventsAPI.createException(parentId, exceptionData);
      fetchEvents();
      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving exception:', error);
    }
  };

  // 刪除事件（支援不同的刪除類型）
  const handleDeleteEvent = async (id, deleteType = 'all', instanceDate = null) => {
    const confirmMessages = {
      'this_only': 'Are you sure you want to delete this occurrence?',
      'this_and_future': 'Are you sure you want to delete this and all future occurrences?',
      'all': 'Are you sure you want to delete all occurrences of this event?'
    };

    if (window.confirm(confirmMessages[deleteType] || confirmMessages['all'])) {
      try {
        await eventsAPI.delete(id, { 
          delete_type: deleteType, 
          instance_date: instanceDate 
        });
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

  // Filter exceptions based on visible calendars
  const visibleExceptions = exceptions.filter(exception => {
    const calendar = calendars.find(cal => cal.id === exception.calendar_id);
    return calendar && calendar.visible;
  });

  if (initError) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: 2 }}>
          <Typography variant="h5" color="error">資料庫初始化失敗</Typography>
          <Typography color="text.secondary">{initError}</Typography>
          <Typography variant="body2" color="text.secondary">
            請確保您的瀏覽器支援 IndexedDB 並允許本網站儲存資料
          </Typography>
        </Box>
      </ThemeProvider>
    );
  }

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
              exceptions={visibleExceptions}
              onDateClick={handleDateClick}
              onEventClick={handleEventClick}
            />
          </Box>
        </Box>

        <EventDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSave={handleSaveEvent}
          onSaveException={handleSaveException}
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

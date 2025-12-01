import React, { useMemo } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import RepeatIcon from '@mui/icons-material/Repeat';
import EditIcon from '@mui/icons-material/Edit';
import {
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    format,
    isSameMonth,
    isSameDay,
    isToday
} from 'date-fns';
import { expandEvents, getMonthViewRange } from '../../utils/rruleHelper';

const MonthView = ({ currentDate, events, exceptions, onDateClick, onEventClick }) => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = eachDayOfInterval({
        start: startDate,
        end: endDate
    });

    // Calculate number of weeks to display
    const numberOfWeeks = Math.ceil(days.length / 7);

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Expand recurring events (including exception handling)
    const expandedEvents = useMemo(() => {
        console.log('[MonthView] Input events:', events);
        console.log('[MonthView] Input events with rrule:', events.filter(e => e.rrule));
        console.log('[MonthView] Input exceptions:', exceptions);
        
        const { start, end } = getMonthViewRange(currentDate);
        console.log('[MonthView] Date range:', { start: start.toString(), end: end.toString() });
        
        const result = expandEvents(events, start, end, exceptions);
        console.log('[MonthView] Expanded events:', result);
        return result;
    }, [events, exceptions, currentDate]);

    const getEventsForDay = (date) => {
        return expandedEvents.filter(event => {
            const eventStart = new Date(event.start_time);
            return isSameDay(eventStart, date);
        });
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Weekday headers */}
            <Box sx={{ display: 'flex', borderBottom: '1px solid #e0e0e0' }}>
                {weekDays.map(day => (
                    <Box key={day} sx={{ flex: '1 1 0%', p: 1, textAlign: 'center' }}>
                        <Typography variant="caption" fontWeight="bold" color="text.secondary">
                            {day}
                        </Typography>
                    </Box>
                ))}
            </Box>

            {/* Calendar grid */}
            <Box sx={{ flex: 1, display: 'flex', flexWrap: 'wrap' }}>
                {days.map((day, index) => {
                    const dayEvents = getEventsForDay(day);
                    const isCurrentMonth = isSameMonth(day, monthStart);
                    const isCurrentDay = isToday(day);

                    return (
                        <Box
                            key={day.toString()}
                            onClick={() => onDateClick(day)}
                            sx={{
                                flex: '1 1 calc(100% / 7)',
                                maxWidth: 'calc(100% / 7)',
                                height: `calc(100% / ${numberOfWeeks})`,
                                borderRight: '1px solid #e0e0e0',
                                borderBottom: '1px solid #e0e0e0',
                                p: 1,
                                cursor: 'pointer',
                                bgcolor: isCurrentMonth ? 'background.paper' : '#fafafa',
                                '&:hover': {
                                    bgcolor: '#f5f5f5'
                                },
                                overflow: 'hidden',
                                boxSizing: 'border-box'
                            }}
                        >
                            <Box sx={{ textAlign: 'center', mb: 1 }}>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        width: 24,
                                        height: 24,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: '50%',
                                        bgcolor: isCurrentDay ? 'primary.main' : 'transparent',
                                        color: isCurrentDay ? 'white' : (isCurrentMonth ? 'text.primary' : 'text.secondary'),
                                        fontWeight: isCurrentDay ? 'bold' : 'normal'
                                    }}
                                >
                                    {format(day, 'd')}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                {dayEvents.slice(0, 3).map(event => (
                                    <Paper
                                        key={event.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEventClick(event);
                                        }}
                                        sx={{
                                            p: 0.5,
                                            bgcolor: event.color || 'primary.main',
                                            color: 'white',
                                            cursor: 'pointer',
                                            overflow: 'hidden',
                                            whiteSpace: 'nowrap',
                                            textOverflow: 'ellipsis',
                                            fontSize: '0.75rem',
                                            borderRadius: 1,
                                            boxShadow: 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 0.5,
                                            // Exception events display different style
                                            border: event.isException ? '2px dashed rgba(255,255,255,0.5)' : 'none',
                                            '&:hover': {
                                                filter: 'brightness(0.9)'
                                            }
                                        }}
                                    >
                                        {/* Show repeat icon or exception icon */}
                                        {event.isException ? (
                                            <EditIcon sx={{ fontSize: '0.75rem', flexShrink: 0 }} />
                                        ) : (event.rrule || event.isRecurringInstance) && (
                                            <RepeatIcon sx={{ fontSize: '0.75rem', flexShrink: 0 }} />
                                        )}
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {event.title}
                                        </span>
                                    </Paper>
                                ))}
                                {dayEvents.length > 3 && (
                                    <Typography variant="caption" color="text.secondary" sx={{ pl: 0.5 }}>
                                        {dayEvents.length - 3} more
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
};

export default MonthView;

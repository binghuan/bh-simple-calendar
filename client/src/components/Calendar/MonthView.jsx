import React from 'react';
import { Box, Typography, Grid, Paper } from '@mui/material';
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

const MonthView = ({ currentDate, events, onDateClick, onEventClick }) => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = eachDayOfInterval({
        start: startDate,
        end: endDate
    });

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const getEventsForDay = (date) => {
        return events.filter(event => {
            const eventStart = new Date(event.start_time);
            return isSameDay(eventStart, date);
        });
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Weekday headers */}
            <Grid container sx={{ borderBottom: '1px solid #e0e0e0' }}>
                {weekDays.map(day => (
                    <Grid item xs={12 / 7} key={day}>
                        <Box sx={{ p: 1, textAlign: 'center' }}>
                            <Typography variant="caption" fontWeight="bold" color="text.secondary">
                                {day}
                            </Typography>
                        </Box>
                    </Grid>
                ))}
            </Grid>

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
                                width: `${100 / 7}%`,
                                height: 'calc(100% / 5)', // Assuming 5 weeks usually
                                borderRight: '1px solid #e0e0e0',
                                borderBottom: '1px solid #e0e0e0',
                                p: 1,
                                cursor: 'pointer',
                                bgcolor: isCurrentMonth ? 'background.paper' : '#fafafa',
                                '&:hover': {
                                    bgcolor: '#f5f5f5'
                                },
                                overflow: 'hidden'
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
                                            '&:hover': {
                                                filter: 'brightness(0.9)'
                                            }
                                        }}
                                    >
                                        {event.title}
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

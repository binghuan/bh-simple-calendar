import React, { useState } from 'react';
import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Checkbox,
    IconButton,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';

const CalendarList = ({ calendars, onToggleCalendar, onCreateCalendar, onDeleteCalendar }) => {
    const [open, setOpen] = useState(false);
    const [newCalendarName, setNewCalendarName] = useState('');
    const [newCalendarColor, setNewCalendarColor] = useState('#1976d2');

    const handleCreate = () => {
        if (newCalendarName) {
            onCreateCalendar({
                name: newCalendarName,
                color: newCalendarColor,
                description: ''
            });
            setOpen(false);
            setNewCalendarName('');
            setNewCalendarColor('#1976d2');
        }
    };

    return (
        <Box sx={{ p: 2, width: 250, borderRight: '1px solid #e0e0e0', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                    My Calendars
                </Typography>
                <IconButton size="small" onClick={() => setOpen(true)}>
                    <Add />
                </IconButton>
            </Box>

            <List dense>
                {calendars.map((calendar) => (
                    <ListItem
                        key={calendar.id}
                        secondaryAction={
                            <IconButton edge="end" size="small" onClick={() => onDeleteCalendar(calendar.id)}>
                                <Delete fontSize="small" />
                            </IconButton>
                        }
                        disablePadding
                    >
                        <ListItemIcon sx={{ minWidth: 40 }}>
                            <Checkbox
                                edge="start"
                                checked={calendar.visible !== false}
                                onChange={() => onToggleCalendar(calendar.id)}
                                sx={{
                                    color: calendar.color,
                                    '&.Mui-checked': {
                                        color: calendar.color,
                                    },
                                }}
                            />
                        </ListItemIcon>
                        <ListItemText primary={calendar.name} />
                    </ListItem>
                ))}
            </List>

            <Dialog open={open} onClose={() => setOpen(false)}>
                <DialogTitle>Create New Calendar</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Calendar Name"
                        fullWidth
                        variant="outlined"
                        value={newCalendarName}
                        onChange={(e) => setNewCalendarName(e.target.value)}
                    />
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="text.secondary">Color</Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            {['#1976d2', '#d32f2f', '#388e3c', '#f57c00', '#7b1fa2', '#0288d1'].map((color) => (
                                <Box
                                    key={color}
                                    onClick={() => setNewCalendarColor(color)}
                                    sx={{
                                        width: 24,
                                        height: 24,
                                        borderRadius: '50%',
                                        bgcolor: color,
                                        cursor: 'pointer',
                                        border: newCalendarColor === color ? '2px solid black' : 'none'
                                    }}
                                />
                            ))}
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreate} variant="contained">Create</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default CalendarList;

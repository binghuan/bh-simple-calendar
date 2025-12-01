import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Switch,
    Grid,
    Box
} from '@mui/material';
import { format } from 'date-fns';

const EventDialog = ({ open, onClose, onSave, onDelete, event, calendars, selectedDate }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        start_time: '',
        end_time: '',
        all_day: false,
        location: '',
        calendar_id: ''
    });

    useEffect(() => {
        if (event) {
            // Editing existing event
            setFormData({
                ...event,
                start_time: format(new Date(event.start_time), "yyyy-MM-dd'T'HH:mm"),
                end_time: format(new Date(event.end_time), "yyyy-MM-dd'T'HH:mm"),
            });
        } else if (selectedDate) {
            // Creating new event
            const start = new Date(selectedDate);
            start.setHours(9, 0, 0, 0);
            const end = new Date(selectedDate);
            end.setHours(10, 0, 0, 0);

            setFormData({
                title: '',
                description: '',
                start_time: format(start, "yyyy-MM-dd'T'HH:mm"),
                end_time: format(end, "yyyy-MM-dd'T'HH:mm"),
                all_day: false,
                location: '',
                calendar_id: calendars.length > 0 ? calendars[0].id : ''
            });
        }
    }, [event, selectedDate, calendars, open]);

    const handleChange = (e) => {
        const { name, value, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'all_day' ? checked : value
        }));
    };

    const handleSubmit = () => {
        onSave({
            ...formData,
            id: event?.id
        });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                {event ? 'Edit Event' : 'Create Event'}
            </DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <TextField
                        autoFocus
                        name="title"
                        label="Title"
                        fullWidth
                        value={formData.title}
                        onChange={handleChange}
                        required
                    />

                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.all_day}
                                        onChange={handleChange}
                                        name="all_day"
                                    />
                                }
                                label="All Day"
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                name="start_time"
                                label="Start"
                                type="datetime-local"
                                fullWidth
                                value={formData.start_time}
                                onChange={handleChange}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                name="end_time"
                                label="End"
                                type="datetime-local"
                                fullWidth
                                value={formData.end_time}
                                onChange={handleChange}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                    </Grid>

                    <FormControl fullWidth>
                        <InputLabel>Calendar</InputLabel>
                        <Select
                            name="calendar_id"
                            value={formData.calendar_id}
                            label="Calendar"
                            onChange={handleChange}
                        >
                            {calendars.map(cal => (
                                <MenuItem key={cal.id} value={cal.id}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: cal.color }} />
                                        {cal.name}
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <TextField
                        name="location"
                        label="Location"
                        fullWidth
                        value={formData.location}
                        onChange={handleChange}
                    />

                    <TextField
                        name="description"
                        label="Description"
                        fullWidth
                        multiline
                        rows={3}
                        value={formData.description}
                        onChange={handleChange}
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                {event && (
                    <Button onClick={() => onDelete(event.id)} color="error" sx={{ mr: 'auto' }}>
                        Delete
                    </Button>
                )}
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit} variant="contained">Save</Button>
            </DialogActions>
        </Dialog>
    );
};

export default EventDialog;

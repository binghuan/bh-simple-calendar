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
    Box,
    Typography,
    Chip,
    Alert
} from '@mui/material';
import RepeatIcon from '@mui/icons-material/Repeat';
import { format } from 'date-fns';
import RecurrenceDialog from './RecurrenceDialog';
import EditOptionsDialog from './EditOptionsDialog';
import { RECURRENCE_OPTIONS, getRRuleDescription, formatInstanceDate } from '../../utils/rruleHelper';

const EventDialog = ({ 
    open, 
    onClose, 
    onSave, 
    onSaveException,
    onDelete, 
    event, 
    calendars, 
    selectedDate 
}) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        start_time: '',
        end_time: '',
        all_day: false,
        location: '',
        calendar_id: '',
        rrule: ''
    });
    const [recurrenceDialogOpen, setRecurrenceDialogOpen] = useState(false);
    const [selectedRecurrence, setSelectedRecurrence] = useState('');
    const [editOptionsOpen, setEditOptionsOpen] = useState(false);
    const [deleteOptionsOpen, setDeleteOptionsOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState(null); // 'save' or 'delete'

    const isRecurringInstance = event?.isRecurringInstance && !event?.isException;
    const isException = event?.isException;
    const hasRecurrence = event?.rrule || event?.parentEvent?.rrule;

    useEffect(() => {
        if (event) {
            // Editing existing event
            const rrule = event.rrule || '';
            setFormData({
                ...event,
                start_time: format(new Date(event.start_time), "yyyy-MM-dd'T'HH:mm"),
                end_time: format(new Date(event.end_time), "yyyy-MM-dd'T'HH:mm"),
                rrule: rrule,
            });
            // Set recurrence option
            if (rrule) {
                const matchingOption = RECURRENCE_OPTIONS.find(opt => opt.value === rrule);
                setSelectedRecurrence(matchingOption ? rrule : 'custom');
            } else {
                setSelectedRecurrence('');
            }
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
                calendar_id: calendars.length > 0 ? calendars[0].id : '',
                rrule: ''
            });
            setSelectedRecurrence('');
        }
    }, [event, selectedDate, calendars, open]);

    const handleChange = (e) => {
        const { name, value, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'all_day' ? checked : value
        }));
    };

    const handleRecurrenceChange = (e) => {
        const value = e.target.value;
        setSelectedRecurrence(value);
        
        if (value === 'custom') {
            setRecurrenceDialogOpen(true);
        } else {
            setFormData(prev => ({
                ...prev,
                rrule: value
            }));
        }
    };

    const handleCustomRecurrenceSave = (rrule) => {
        setFormData(prev => ({
            ...prev,
            rrule: rrule
        }));
        setRecurrenceDialogOpen(false);
    };

    const handleSaveClick = () => {
        // If it's a recurring event instance (not exception), ask which ones to modify
        if (isRecurringInstance) {
            setPendingAction('save');
            setEditOptionsOpen(true);
        } else {
            doSave('all');
        }
    };

    const handleDeleteClick = () => {
        // If it's a recurring event instance, ask which ones to delete
        if (isRecurringInstance || (isException && event.parentEvent)) {
            setPendingAction('delete');
            setDeleteOptionsOpen(true);
        } else if (hasRecurrence && !isException) {
            // Main recurring event, ask for delete options
            setPendingAction('delete');
            setDeleteOptionsOpen(true);
        } else {
            doDelete('all');
        }
    };

    const handleEditOptionSelect = (option) => {
        setEditOptionsOpen(false);
        if (pendingAction === 'save') {
            doSave(option);
        }
    };

    const handleDeleteOptionSelect = (option) => {
        setDeleteOptionsOpen(false);
        if (pendingAction === 'delete') {
            doDelete(option);
        }
    };

    const doSave = (editType) => {
        if (editType === 'this_only' && isRecurringInstance) {
            // Only modify this instance - create exception
            const parentId = event.originalId || event.parentEvent?.id;
            const instanceDate = event.instanceDate 
                ? formatInstanceDate(event.instanceDate)
                : event.original_start_time;
            
            onSaveException(parentId, {
                ...formData,
                original_start_time: instanceDate,
            });
        } else {
            // Modify all instances - update main event
            const id = event?.originalId || event?.id;
            onSave({
                ...formData,
                id: id
            });
        }
    };

    const doDelete = (deleteType) => {
        const eventId = event?.originalId || event?.parentEvent?.id || event?.id;
        const instanceDate = event?.instanceDate 
            ? formatInstanceDate(event.instanceDate)
            : event?.original_start_time;

        onDelete(eventId, deleteType, instanceDate);
    };

    return (
        <>
            <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {event ? 'Edit Event' : 'Create Event'}
                    {isRecurringInstance && (
                        <Typography variant="caption" color="text.secondary" display="block">
                            This is a recurring event
                        </Typography>
                    )}
                    {isException && (
                        <Typography variant="caption" color="warning.main" display="block">
                            This is an exception to a recurring event
                        </Typography>
                    )}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        {isRecurringInstance && (
                            <Alert severity="info" sx={{ mb: 1 }}>
                                You can edit just this occurrence or all occurrences of this recurring event.
                            </Alert>
                        )}

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

                        {/* Repeat settings - only non-exception events can set this */}
                        {!isException && (
                            <FormControl fullWidth>
                                <InputLabel>Repeat</InputLabel>
                                <Select
                                    value={selectedRecurrence}
                                    label="Repeat"
                                    onChange={handleRecurrenceChange}
                                    startAdornment={
                                        formData.rrule ? (
                                            <RepeatIcon sx={{ mr: 1, color: 'primary.main' }} />
                                        ) : null
                                    }
                                >
                                    {RECURRENCE_OPTIONS.map(opt => (
                                        <MenuItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}

                        {/* Display custom recurrence rule description */}
                        {formData.rrule && selectedRecurrence === 'custom' && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chip
                                    icon={<RepeatIcon />}
                                    label={getRRuleDescription(formData.rrule)}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                    onClick={() => setRecurrenceDialogOpen(true)}
                                />
                            </Box>
                        )}

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
                        <Button 
                            onClick={handleDeleteClick} 
                            color="error" 
                            sx={{ mr: 'auto' }}
                        >
                            Delete
                        </Button>
                    )}
                    <Button onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSaveClick} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>

            <RecurrenceDialog
                open={recurrenceDialogOpen}
                onClose={() => {
                    setRecurrenceDialogOpen(false);
                    // If cancelled and no rrule set, return to "Does not repeat"
                    if (!formData.rrule) {
                        setSelectedRecurrence('');
                    }
                }}
                onSave={handleCustomRecurrenceSave}
                rruleString={formData.rrule}
                startDate={formData.start_time ? new Date(formData.start_time) : new Date()}
            />

            <EditOptionsDialog
                open={editOptionsOpen}
                onClose={() => setEditOptionsOpen(false)}
                onSelect={handleEditOptionSelect}
                mode="edit"
            />

            <EditOptionsDialog
                open={deleteOptionsOpen}
                onClose={() => setDeleteOptionsOpen(false)}
                onSelect={handleDeleteOptionSelect}
                mode="delete"
            />
        </>
    );
};

export default EventDialog;

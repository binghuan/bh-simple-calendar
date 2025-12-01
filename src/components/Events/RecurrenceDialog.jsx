import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Grid,
    Box,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
    Divider,
} from '@mui/material';
import { RRule } from 'rrule';
import { format, addMonths, addYears } from 'date-fns';
import {
    FREQUENCY_OPTIONS,
    WEEKDAY_OPTIONS,
    parseRRuleString,
    createRRuleString,
} from '../../utils/rruleHelper';

const RecurrenceDialog = ({ open, onClose, onSave, rruleString, startDate }) => {
    const [frequency, setFrequency] = useState(RRule.WEEKLY);
    const [interval, setInterval] = useState(1);
    const [weekdays, setWeekdays] = useState([]);
    const [endType, setEndType] = useState('never'); // 'never', 'count', 'until'
    const [count, setCount] = useState(10);
    const [until, setUntil] = useState('');

    useEffect(() => {
        if (open) {
            if (rruleString) {
                // 解析現有的 RRule
                const options = parseRRuleString(rruleString);
                if (options) {
                    setFrequency(options.freq || RRule.WEEKLY);
                    setInterval(options.interval || 1);
                    setWeekdays(options.byweekday || []);
                    
                    if (options.count) {
                        setEndType('count');
                        setCount(options.count);
                    } else if (options.until) {
                        setEndType('until');
                        setUntil(format(new Date(options.until), 'yyyy-MM-dd'));
                    } else {
                        setEndType('never');
                    }
                }
            } else {
                // 預設值
                setFrequency(RRule.WEEKLY);
                setInterval(1);
                setWeekdays([]);
                setEndType('never');
                setCount(10);
                // 預設結束日期為一年後
                setUntil(format(addYears(startDate || new Date(), 1), 'yyyy-MM-dd'));
            }
        }
    }, [open, rruleString, startDate]);

    const handleWeekdayToggle = (event, newWeekdays) => {
        setWeekdays(newWeekdays || []);
    };

    const handleSave = () => {
        const options = {
            freq: frequency,
            interval: interval,
        };

        // 週重複時加入選定的星期
        if (frequency === RRule.WEEKLY && weekdays.length > 0) {
            options.byweekday = weekdays;
        }

        // 結束條件
        if (endType === 'count') {
            options.count = count;
        } else if (endType === 'until') {
            options.until = new Date(until);
        }

        const rrule = createRRuleString(options);
        onSave(rrule);
    };

    const getFrequencyLabel = () => {
        const option = FREQUENCY_OPTIONS.find(f => f.value === frequency);
        return option ? option.label.toLowerCase() : 'day';
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Custom Recurrence</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
                    {/* 頻率與間隔 */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography>Repeat every</Typography>
                        <TextField
                            type="number"
                            value={interval}
                            onChange={(e) => setInterval(Math.max(1, parseInt(e.target.value) || 1))}
                            inputProps={{ min: 1, max: 99 }}
                            sx={{ width: 80 }}
                            size="small"
                        />
                        <FormControl sx={{ minWidth: 120 }} size="small">
                            <Select
                                value={frequency}
                                onChange={(e) => setFrequency(e.target.value)}
                            >
                                {FREQUENCY_OPTIONS.map(opt => (
                                    <MenuItem key={opt.value} value={opt.value}>
                                        {interval > 1 ? `${opt.label}s` : opt.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    {/* 週重複時顯示星期選擇 */}
                    {frequency === RRule.WEEKLY && (
                        <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Repeat on
                            </Typography>
                            <ToggleButtonGroup
                                value={weekdays}
                                onChange={handleWeekdayToggle}
                                aria-label="weekdays"
                                size="small"
                            >
                                {WEEKDAY_OPTIONS.map(day => (
                                    <ToggleButton 
                                        key={day.label} 
                                        value={day.value}
                                        sx={{ width: 40 }}
                                    >
                                        {day.short}
                                    </ToggleButton>
                                ))}
                            </ToggleButtonGroup>
                        </Box>
                    )}

                    <Divider />

                    {/* 結束條件 */}
                    <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Ends
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <FormControl fullWidth size="small">
                                    <Select
                                        value={endType}
                                        onChange={(e) => setEndType(e.target.value)}
                                    >
                                        <MenuItem value="never">Never</MenuItem>
                                        <MenuItem value="count">After</MenuItem>
                                        <MenuItem value="until">On date</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            
                            {endType === 'count' && (
                                <Grid item xs={12}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <TextField
                                            type="number"
                                            value={count}
                                            onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
                                            inputProps={{ min: 1, max: 999 }}
                                            size="small"
                                            sx={{ width: 100 }}
                                        />
                                        <Typography>occurrences</Typography>
                                    </Box>
                                </Grid>
                            )}
                            
                            {endType === 'until' && (
                                <Grid item xs={12}>
                                    <TextField
                                        type="date"
                                        value={until}
                                        onChange={(e) => setUntil(e.target.value)}
                                        size="small"
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                            )}
                        </Grid>
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} variant="contained">Done</Button>
            </DialogActions>
        </Dialog>
    );
};

export default RecurrenceDialog;

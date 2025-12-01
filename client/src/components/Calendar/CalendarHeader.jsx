import React from 'react';
import {
    Box,
    Typography,
    Button,
    IconButton,
    Stack,
    Select,
    MenuItem,
    FormControl
} from '@mui/material';
import {
    ChevronLeft,
    ChevronRight,
    Today
} from '@mui/icons-material';
import { format } from 'date-fns';

const CalendarHeader = ({
    currentDate,
    onPrev,
    onNext,
    onToday,
    view,
    onViewChange
}) => {
    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 2,
                borderBottom: '1px solid #e0e0e0'
            }}
        >
            <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                    <img
                        src="https://www.gstatic.com/images/branding/product/1x/calendar_2020q4_48dp.png"
                        alt="Logo"
                        style={{ width: 40, height: 40, marginRight: 8 }}
                    />
                    <Typography variant="h5" color="text.secondary" sx={{ fontWeight: 400 }}>
                        Calendar
                    </Typography>
                </Box>

                <Button
                    variant="outlined"
                    onClick={onToday}
                    sx={{ color: 'text.primary', borderColor: '#e0e0e0' }}
                >
                    Today
                </Button>

                <Box>
                    <IconButton onClick={onPrev} size="small">
                        <ChevronLeft />
                    </IconButton>
                    <IconButton onClick={onNext} size="small">
                        <ChevronRight />
                    </IconButton>
                </Box>

                <Typography variant="h5" sx={{ minWidth: 200, ml: 2 }}>
                    {format(currentDate, 'MMMM yyyy')}
                </Typography>
            </Stack>

            <Stack direction="row" spacing={2}>
                <FormControl size="small">
                    <Select
                        value={view}
                        onChange={(e) => onViewChange(e.target.value)}
                        sx={{ minWidth: 120 }}
                    >
                        <MenuItem value="month">Month</MenuItem>
                        <MenuItem value="week">Week</MenuItem>
                        <MenuItem value="day">Day</MenuItem>
                    </Select>
                </FormControl>
            </Stack>
        </Box>
    );
};

export default CalendarHeader;

import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider,
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import RepeatIcon from '@mui/icons-material/Repeat';
import RepeatOneIcon from '@mui/icons-material/RepeatOne';
import FastForwardIcon from '@mui/icons-material/FastForward';

/**
 * 編輯選項對話框 - 用於選擇編輯重複事件的範圍
 */
const EditOptionsDialog = ({ open, onClose, onSelect, mode = 'edit' }) => {
    const isDelete = mode === 'delete';
    const title = isDelete ? 'Delete recurring event' : 'Edit recurring event';

    const options = [
        {
            id: 'this_only',
            icon: <RepeatOneIcon />,
            primary: isDelete ? 'Delete this event only' : 'This event only',
            secondary: isDelete 
                ? 'Only this occurrence will be deleted' 
                : 'Only this occurrence will be changed',
        },
        {
            id: 'all',
            icon: <RepeatIcon />,
            primary: isDelete ? 'Delete all events' : 'All events',
            secondary: isDelete 
                ? 'All occurrences will be deleted' 
                : 'All occurrences will be changed',
        },
    ];

    // 刪除模式額外提供「這個及之後」選項
    if (isDelete) {
        options.splice(1, 0, {
            id: 'this_and_future',
            icon: <FastForwardIcon />,
            primary: 'This and following events',
            secondary: 'This and all future occurrences will be deleted',
        });
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent sx={{ p: 0 }}>
                <List>
                    {options.map((option, index) => (
                        <React.Fragment key={option.id}>
                            {index > 0 && <Divider />}
                            <ListItem disablePadding>
                                <ListItemButton onClick={() => onSelect(option.id)}>
                                    <ListItemIcon>{option.icon}</ListItemIcon>
                                    <ListItemText 
                                        primary={option.primary} 
                                        secondary={option.secondary}
                                    />
                                </ListItemButton>
                            </ListItem>
                        </React.Fragment>
                    ))}
                </List>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditOptionsDialog;

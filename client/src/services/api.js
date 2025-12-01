import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api/v1';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Calendars API
export const calendarsAPI = {
    getAll: () => api.get('/calendars'),
    getById: (id) => api.get(`/calendars/${id}`),
    create: (data) => api.post('/calendars', data),
    update: (id, data) => api.put(`/calendars/${id}`, data),
    delete: (id) => api.delete(`/calendars/${id}`),
};

// Events API
export const eventsAPI = {
    getAll: (params) => api.get('/events', { params }),
    getById: (id) => api.get(`/events/${id}`),
    create: (data) => api.post('/events', data),
    update: (id, data) => api.put(`/events/${id}`, data),
    delete: (id) => api.delete(`/events/${id}`),
};

export default api;

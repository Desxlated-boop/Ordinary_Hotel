const API_URL = import.meta.env.VITE_API_URL || '/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.error?.message || 'Request failed';
    throw new Error(message);
  }

  return data;
}

async function upload(path, formData) {
  const headers = {};

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error?.message || 'Request failed';
    throw new Error(message);
  }
  return data;
}

export const api = {
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/auth/me'),

  getRooms: (params = '') => request(`/rooms${params}`),
  getRoom: (id) => request(`/rooms/${id}`),

  createBooking: (body) => request('/bookings', { method: 'POST', body: JSON.stringify(body) }),
  getMyBookings: () => request('/bookings/my'),

  adminGetRooms: () => request('/admin/rooms'),
  adminCreateRoom: (body) => request('/admin/rooms', { method: 'POST', body: JSON.stringify(body) }),
  adminUpdateRoom: (id, body) => request(`/admin/rooms/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  adminDeleteRoom: (id) => request(`/admin/rooms/${id}`, { method: 'DELETE' }),
  adminGetBookings: () => request('/admin/bookings'),
  adminCancelBooking: (id) => request(`/admin/bookings/${id}/cancel`, { method: 'PATCH' }),
  adminConfirmBooking: (id) => request(`/admin/bookings/${id}/confirm`, { method: 'PATCH' }),
  adminBlockUser: (id) => request(`/admin/users/${id}/block`, { method: 'PATCH' }),
  adminUnblockUser: (id) => request(`/admin/users/${id}/unblock`, { method: 'PATCH' }),
  adminUploadRoomImage: (file) => {
    const form = new FormData();
    form.append('image', file);
    return upload('/admin/uploads/room-image', form);
  },

  // Assignment №1 REST client integrations
  adminGetEmployees: () => request('/admin/employees'),
  adminHireEmployee: (body) => request('/admin/employees', { method: 'POST', body: JSON.stringify(body) }),
  adminFireEmployee: (id) => request(`/admin/employees/${id}`, { method: 'DELETE' }),
  adminGetAssignmentStats: (date = '') => request(`/admin/assignment/stats${date ? `?date=${encodeURIComponent(date)}` : ''}`),
  adminGetAssignmentQuery1: (floor, roomId) => request(`/admin/assignment/query1?floor=${floor}&roomId=${roomId}`),
  adminGetAssignmentQuery2: (city) => request(`/admin/assignment/query2?city=${encodeURIComponent(city)}`),
  adminGetAssignmentQuery3: (clientName, dayOfWeek) => request(`/admin/assignment/query3?clientName=${encodeURIComponent(clientName)}&dayOfWeek=${encodeURIComponent(dayOfWeek)}`),
};

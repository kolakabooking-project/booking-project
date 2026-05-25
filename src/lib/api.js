/**
 * API utility for communicating with the BOOKOLAKA backend.
 * All requests include credentials (cookies) for session auth.
 */

const API_BASE = '/api';

/**
 * Core fetch wrapper with error handling.
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  const config = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Remove Content-Type for FormData (file uploads)
  if (options.body instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  const res = await fetch(url, config);

  // Handle non-JSON responses
  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return null;
  }

  const data = await res.json();

  if (!res.ok) {
    const message = data.error || data.message || `HTTP ${res.status}`;
    const error = new Error(message);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

// ─── Auth ───

export const authApi = {
  /**
   * Sign in with NIP (username) and password via Better Auth.
   */
  async signIn(nip, password) {
    const res = await fetch('/api/auth/sign-in/username', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: nip, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Login gagal');
    }
    return data;
  },

  /**
   * Sign out — clears session cookie.
   */
  async signOut() {
    await fetch('/api/auth/sign-out', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
  },

  /**
   * Get current session (checks if user is still logged in).
   */
  async getSession() {
    const res = await fetch('/api/auth/get-session', {
      method: 'GET',
      credentials: 'include',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data;
  },

  /**
   * Get current user profile.
   */
  async getMe() {
    return request('/me');
  },

  /**
   * Change password for the currently authenticated user.
   * Uses Better Auth's built-in change-password endpoint.
   */
  async changePassword(currentPassword, newPassword) {
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.message || data?.error || 'Gagal mengubah password');
    }
    return data;
  },
};

// ─── Bookings ───

export const bookingApi = {
  getAll: (params) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.search) qs.set('search', params.search);
    if (params?.startDate) qs.set('startDate', params.startDate);
    if (params?.endDate) qs.set('endDate', params.endDate);
    if (params?.vehicleId) qs.set('vehicleId', params.vehicleId);
    const query = qs.toString();
    return request(`/bookings${query ? `?${query}` : ''}`);
  },
  getMine: () => request('/bookings/mine'),
  getPending: () => request('/bookings/pending'),
  getNotifications: () => request('/bookings/notifications'),
  getForDate: (date) => request(`/bookings/date/${date}`),
  getById: (id) => request(`/bookings/${id}`),
  create: (data) => request('/bookings', { method: 'POST', body: JSON.stringify(data) }),
  createMandatory: (data) => request('/bookings/mandatory', { method: 'POST', body: JSON.stringify(data) }),
  approve: (id, vehicleId, driverId) =>
    request(`/bookings/${id}/approve`, { method: 'PATCH', body: JSON.stringify({ vehicleId, driverId }) }),
  reject: (id, alasan) =>
    request(`/bookings/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ alasan }) }),
  cancel: (id) => request(`/bookings/${id}/cancel`, { method: 'PATCH' }),
  submitReview: (id, reviewNotes) =>
    request(`/bookings/${id}/review`, { method: 'POST', body: JSON.stringify({ reviewNotes }) }),
  markReviewRead: (id) =>
    request(`/bookings/${id}/review/read`, { method: 'PATCH' }),
};

// ─── Vehicles ───

export const vehicleApi = {
  getAll: () => request('/vehicles'),
  getAvailable: (start, end) => request(`/vehicles/available?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`),
  getById: (id) => request(`/vehicles/${id}`),
  create: (data) => request('/vehicles', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/vehicles/${id}`, { method: 'DELETE' }),
  uploadPhoto: (id, file) => {
    const formData = new FormData();
    formData.append('photo', file);
    return request(`/vehicles/${id}/photo`, { method: 'POST', body: formData });
  },
};

// ─── Drivers ───

export const driverApi = {
  getAll: () => request('/drivers'),
  getAvailable: (start, end) => request(`/drivers/available?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`),
  getById: (id) => request(`/drivers/${id}`),
  create: (data) => request('/drivers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/drivers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/drivers/${id}`, { method: 'DELETE' }),
  uploadPhoto: (id, file) => {
    const formData = new FormData();
    formData.append('photo', file);
    return request(`/drivers/${id}/photo`, { method: 'POST', body: formData });
  },
};

// ─── Reports ───

export const reportApi = {
  getSummary: (params) => {
    const qs = new URLSearchParams();
    if (params?.startDate) qs.set('startDate', params.startDate);
    if (params?.endDate) qs.set('endDate', params.endDate);
    if (params?.vehicleId) qs.set('vehicleId', params.vehicleId);
    const query = qs.toString();
    return request(`/reports/summary${query ? `?${query}` : ''}`);
  },
  getExport: (params) => {
    const qs = new URLSearchParams();
    if (params?.startDate) qs.set('startDate', params.startDate);
    if (params?.endDate) qs.set('endDate', params.endDate);
    if (params?.vehicleId) qs.set('vehicleId', params.vehicleId);
    const query = qs.toString();
    return request(`/reports/export${query ? `?${query}` : ''}`);
  },
};

// ─── Rooms ───

export const roomApi = {
  getAll: () => request('/rooms'),
  getAvailable: (start, end) => request(`/rooms/available?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`),
  getById: (id) => request(`/rooms/${id}`),
  create: (data) => request('/rooms', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/rooms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/rooms/${id}`, { method: 'DELETE' }),
  uploadPhoto: (id, file) => {
    const formData = new FormData();
    formData.append('photo', file);
    return request(`/rooms/${id}/photo`, { method: 'POST', body: formData });
  },
};

// ─── Room Bookings ───

export const roomBookingApi = {
  getAll: (params) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.search) qs.set('search', params.search);
    if (params?.startDate) qs.set('startDate', params.startDate);
    if (params?.endDate) qs.set('endDate', params.endDate);
    if (params?.roomId) qs.set('roomId', params.roomId);
    const query = qs.toString();
    return request(`/room-bookings${query ? `?${query}` : ''}`);
  },
  getMine: () => request('/room-bookings/mine'),
  getNotifications: () => request('/room-bookings/notifications'),
  getForDate: (date) => request(`/room-bookings/date/${date}`),
  getById: (id) => request(`/room-bookings/${id}`),
  create: (data) => request('/room-bookings', { method: 'POST', body: JSON.stringify(data) }),
  createMandatory: (data) => request('/room-bookings/mandatory', { method: 'POST', body: JSON.stringify(data) }),
  cancel: (id, alasan) => request(`/room-bookings/${id}/cancel`, { method: 'PATCH', body: JSON.stringify({ alasan }) }),
  submitReview: (id, reviewNotes) =>
    request(`/room-bookings/${id}/review`, { method: 'POST', body: JSON.stringify({ reviewNotes }) }),
  markReviewRead: (id) =>
    request(`/room-bookings/${id}/review/read`, { method: 'PATCH' }),
};

// ─── Room Reports ───

export const roomReportApi = {
  getSummary: (params) => {
    const qs = new URLSearchParams();
    if (params?.startDate) qs.set('startDate', params.startDate);
    if (params?.endDate) qs.set('endDate', params.endDate);
    if (params?.roomId) qs.set('roomId', params.roomId);
    const query = qs.toString();
    return request(`/room-reports/summary${query ? `?${query}` : ''}`);
  },
  getExport: (params) => {
    const qs = new URLSearchParams();
    if (params?.startDate) qs.set('startDate', params.startDate);
    if (params?.endDate) qs.set('endDate', params.endDate);
    if (params?.roomId) qs.set('roomId', params.roomId);
    const query = qs.toString();
    return request(`/room-reports/export${query ? `?${query}` : ''}`);
  },
};

// ─── Chat ───

export const chatApi = {
  getUsers: () => request('/chat/users'),
  getHistory: (userId, currentUserId, currentUserRole) => {
    const qs = new URLSearchParams();
    if (currentUserId) qs.set('currentUserId', currentUserId);
    if (currentUserRole) qs.set('currentUserRole', currentUserRole);
    return request(`/chat/history/${userId}?${qs.toString()}`);
  },
  sendMessage: (data) => request('/chat/send', { method: 'POST', body: JSON.stringify(data) }),
  markAsRead: (data) => request('/chat/mark-read', { method: 'POST', body: JSON.stringify(data) }),
  clearHistory: (userId, role) => request(`/chat/clear/${userId}`, { method: 'DELETE', body: JSON.stringify({ role }) }),
};

// ─── Service Status (public) ───

export const serviceApi = {
  getStatus: () => request('/service-status'),
};

// ─── Superadmin ───

export const superadminApi = {
  // Consolidated dashboard — single request replaces 4 parallel calls
  getDashboard: () => request('/superadmin/dashboard'),

  // Users
  getUsers: (params) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.role) qs.set('role', params.role);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    const query = qs.toString();
    return request(`/superadmin/users${query ? `?${query}` : ''}`);
  },
  getStats: () => request('/superadmin/stats'),
  createUser: (data) => request('/superadmin/users', { method: 'POST', body: JSON.stringify(data) }),
  deleteUser: (id) => request(`/superadmin/users/${id}`, { method: 'DELETE' }),
  changeRole: (id, role) => request(`/superadmin/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
  resetPassword: (id) => request(`/superadmin/users/${id}/reset-password`, { method: 'PATCH' }),

  // Service Control
  getServiceStatus: () => request('/superadmin/settings/service-status'),
  toggleService: (kdoActive, roomActive) => request('/superadmin/settings/service-status', { method: 'PATCH', body: JSON.stringify({ kdoActive, roomActive }) }),

  // Activity Logs
  getLogs: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.action) qs.set('action', params.action);
    if (params.userId) qs.set('userId', params.userId);
    if (params.search) qs.set('search', params.search);
    if (params.startDate) qs.set('startDate', params.startDate);
    if (params.endDate) qs.set('endDate', params.endDate);
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    const query = qs.toString();
    return request(`/superadmin/logs${query ? `?${query}` : ''}`);
  },
  exportLogs: (startDate, endDate) => {
    const qs = new URLSearchParams();
    if (startDate) qs.set('startDate', startDate);
    if (endDate) qs.set('endDate', endDate);
    return request(`/superadmin/logs/export?${qs.toString()}`);
  },
  cleanupLogs: () => request('/superadmin/logs/cleanup', { method: 'POST' }),
  resetData: (type, password) => request('/superadmin/reset', { method: 'POST', body: JSON.stringify({ type, password }) }),
};

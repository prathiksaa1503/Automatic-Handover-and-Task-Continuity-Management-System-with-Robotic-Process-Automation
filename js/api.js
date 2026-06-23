// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// ======================
// AUTH STORAGE HELPERS
// ======================
function getToken() {
  return localStorage.getItem('token');
}

function getCurrentUser() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

function setAuth(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

// ======================
// API REQUEST HELPER
// ======================
async function apiRequest(endpoint, options = {}) {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
}

// ======================
// AUTH API
// ======================
const authAPI = {
  register: async (userData) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  login: async (email, password, role) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role })
    });
  },

  getCurrentUser: async () => {
    return apiRequest('/auth/me');
  }
};

// ======================
// TASKS API
// ======================
const tasksAPI = {
  getAll: async (filters = {}) => {
    const query = new URLSearchParams(filters).toString();
    return apiRequest(`/tasks${query ? `?${query}` : ''}`);
  },

  getById: async (id) => {
    return apiRequest(`/tasks/${id}`);
  },

  create: async (taskData) => {
    return apiRequest('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData)
    });
  },

  update: async (id, taskData) => {
    return apiRequest(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(taskData)
    });
  },

  delete: async (id) => {
    return apiRequest(`/tasks/${id}`, {
      method: 'DELETE'
    });
  }
};

// ======================
// HANDOVERS API
// ======================
const handoversAPI = {
  getAll: async (filters = {}) => {
    const query = new URLSearchParams(filters).toString();
    return apiRequest(`/handovers${query ? `?${query}` : ''}`);
  },

  getById: async (id) => {
    return apiRequest(`/handovers/${id}`);
  },

  create: async (handoverData) => {
    return apiRequest('/handovers', {
      method: 'POST',
      body: JSON.stringify(handoverData)
    });
  },

  update: async (id, handoverData) => {
    return apiRequest(`/handovers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(handoverData)
    });
  },

  acknowledge: async (id) => {
    return apiRequest(`/handovers/${id}/acknowledge`, {
      method: 'POST'
    });
  },

  complete: async (id) => {
    return apiRequest(`/handovers/${id}/complete`, {
      method: 'POST'
    });
  }
};

// ======================
// AVAILABILITY API
// ======================
const availabilityAPI = {
  getMyAvailability: async () => {
    return apiRequest('/availability/me');
  },

  updateMyAvailability: async (availabilityData) => {
    return apiRequest('/availability/me', {
      method: 'PUT',
      body: JSON.stringify(availabilityData)
    });
  },

  getAll: async () => {
    return apiRequest('/availability');
  }
};

// ======================
// DASHBOARD API
// ======================
const dashboardAPI = {
  getEmployeeDashboard: async () => {
    return apiRequest('/dashboard/employee');
  },

  getManagerDashboard: async () => {
    return apiRequest('/dashboard/manager');
  },

  getAdminDashboard: async () => {
    return apiRequest('/dashboard/admin');
  },

  getUsers: async () => {
    return apiRequest('/dashboard/users');
  }
};

// ======================
// EXPORT TO WINDOW
// ======================
window.api = {
  auth: authAPI,
  tasks: tasksAPI,
  handovers: handoversAPI,
  availability: availabilityAPI,
  dashboard: dashboardAPI,
  getToken,
  getCurrentUser,
  setAuth,
  clearAuth
};

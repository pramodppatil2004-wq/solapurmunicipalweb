// API Client for Solapur Municipal Corporation Grievance Portal
const API_BASE = '/api';

const api = {
  // Helper for requests
  async request(endpoint, options = {}) {
    const defaultHeaders = {
      'Content-Type': 'application/json'
    };

    const token = localStorage.getItem('smc_officer_token');
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {})
      }
    };

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, config);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `HTTP error ${response.status}`);
      }
      return data;
    } catch (error) {
      console.error(`API Error on [${options.method || 'GET'} ${endpoint}]:`, error);
      throw error;
    }
  },

  // Get live stats and transparency feed
  async getStats() {
    return this.request('/stats');
  },

  // Get list of grievances with optional filters
  async getGrievances(params = {}) {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'all') query.append('status', params.status);
    if (params.department && params.department !== 'all') query.append('department', params.department);
    if (params.ward && params.ward !== 'all') query.append('ward', params.ward);
    if (params.priority && params.priority !== 'all') query.append('priority', params.priority);
    if (params.search) query.append('search', params.search);

    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request(`/grievances${qs}`);
  },

  // Track single or multiple grievances by Token or Mobile
  async trackGrievance(query) {
    const encoded = encodeURIComponent(query.trim());
    return this.request(`/grievances/track/${encoded}`);
  },

  // Lodge a new grievance
  async createGrievance(data) {
    return this.request('/grievances', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Officer updates grievance status
  async updateStatus(id, updateData) {
    return this.request(`/grievances/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(updateData)
    });
  },

  // Citizen submits satisfaction feedback
  async submitFeedback(id, feedbackData) {
    return this.request(`/grievances/${id}/feedback`, {
      method: 'POST',
      body: JSON.stringify(feedbackData)
    });
  },

  // Officer login
  async login(username, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  },

  // Verify active session
  async verifySession() {
    return this.request('/auth/verify');
  }
};

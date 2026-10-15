// API Client for Solapur Municipal Corporation Grievance Portal
const API_BASE = '/api';

const api = {
  // Helper for requests
  async request(endpoint, options = {}) {
    const defaultHeaders = {
      'Content-Type': 'application/json'
    };

    // Determine appropriate authorization token
    const isOfficerReq = endpoint.includes('/auth/login') || endpoint.includes('/auth/verify') || (options.authType === 'officer');
    const officerToken = localStorage.getItem('smc_officer_token');
    const citizenToken = localStorage.getItem('smc_citizen_token');

    if (isOfficerReq && officerToken) {
      defaultHeaders['Authorization'] = `Bearer ${officerToken}`;
    } else if (citizenToken) {
      defaultHeaders['Authorization'] = `Bearer ${citizenToken}`;
    } else if (officerToken) {
      defaultHeaders['Authorization'] = `Bearer ${officerToken}`;
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

  // Get live stats
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
    return this.request(`/grievances${qs}`, { authType: 'officer' });
  },

  // Get grievances lodged by logged in citizen
  async getMyGrievances() {
    return this.request('/grievances/my');
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
      body: JSON.stringify(updateData),
      authType: 'officer'
    });
  },

  // Citizen submits satisfaction feedback
  async submitFeedback(id, feedbackData) {
    return this.request(`/grievances/${id}/feedback`, {
      method: 'POST',
      body: JSON.stringify(feedbackData)
    });
  },

  // Citizen Registration
  async citizenRegister(userData) {
    return this.request('/auth/citizen/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  // Citizen Login
  async citizenLogin(identifier, password) {
    return this.request('/auth/citizen/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password })
    });
  },

  // Verify Citizen Session
  async citizenVerify() {
    return this.request('/auth/citizen/verify');
  },

  // Officer login
  async login(username, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  },

  // Officer / Staff Registration
  async adminRegister(officerData) {
    return this.request('/auth/admin/register', {
      method: 'POST',
      body: JSON.stringify(officerData),
      authType: 'officer'
    });
  },

  // Verify Officer active session
  async verifySession() {
    return this.request('/auth/verify', { authType: 'officer' });
  },

  // Get all registered officers
  async getOfficers() {
    return this.request('/auth/admin/officers', { authType: 'officer' });
  }
};

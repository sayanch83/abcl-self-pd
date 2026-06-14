import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('abcl_officer_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('abcl_officer_token');
      localStorage.removeItem('abcl_officer');
      if (window.location.pathname.startsWith('/officer')) {
        window.location.href = '/officer/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/me'),
};

export const applicationApi = {
  getStats: () => api.get('/applications/stats'),
  getAll: (params) => api.get('/applications', { params }),
  getById: (id) => api.get(`/applications/${id}`),
  triggerPd: (id) => api.post(`/applications/${id}/trigger-pd`),
  updateOutcome: (id, data) => api.post(`/applications/${id}/pd-outcome`, data),
};

export const pdApi = {
  getLinkInfo: (token) => api.get(`/pd/${token}/info`),
  requestOtp: (token, data) => api.post(`/pd/${token}/request-otp`, data),
  validateOtp: (token, data) => api.post(`/pd/${token}/validate-otp`, data),
  uploadPhoto: (sessionToken, formData) =>
    api.post('/pd/upload-photo', formData, {
      headers: { Authorization: `Bearer ${sessionToken}`, 'Content-Type': 'multipart/form-data' },
    }),
  submit: (sessionToken, data) =>
    api.post('/pd/submit', data, {
      headers: { Authorization: `Bearer ${sessionToken}` },
    }),
};

export const demoConfigApi = {
  getAll:      ()        => api.get('/demo-config'),
  create:      (data)    => api.post('/demo-config', data),
  update:      (id, data)=> api.put(`/demo-config/${id}`, data),
  remove:      (id)      => api.delete(`/demo-config/${id}`),
  resetStatus: (id)      => api.post(`/demo-config/${id}/reset`),
};

export default api;

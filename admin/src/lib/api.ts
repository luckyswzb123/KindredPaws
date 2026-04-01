import axios from 'axios';
import { clearAdminSession } from './auth';

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_BASE_URL ||
  '/api';

const api = axios.create({
  baseURL: API_BASE,
});

// Add a request interceptor to include the Bearer token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kp_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearAdminSession();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export const adminApi = {
  // Auth
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),

  // Stats
  getStats: () => api.get('/admin/stats'),

  // Users
  getUsers: () => api.get('/admin/users'),
  createUser: (data: any) => api.post('/admin/users', data),
  updateUser: (id: string, data: any) => api.put(`/admin/users/${id}`, data),
  updateUserAdmin: (id: string, is_admin: boolean) =>
    api.patch(`/admin/users/${id}/admin`, { is_admin }),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),

  // Pets
  getPets: () => api.get('/admin/pets'),
  createPet: (data: any) => api.post('/admin/pets', data),
  updatePet: (id: string, data: any) => api.put(`/admin/pets/${id}`, data),
  deletePet: (id: string) => api.delete(`/admin/pets/${id}`),
  togglePetStatus: (id: string, status: string) => api.patch(`/admin/pets/${id}/status`, { status }),
  
  // Applications
  getApplications: () => api.get('/admin/applications'),
  updateApplicationStatus: (id: string, status: string) => 
    api.patch(`/admin/applications/${id}/status`, { status }),

  // Upload
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/admin/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default api;

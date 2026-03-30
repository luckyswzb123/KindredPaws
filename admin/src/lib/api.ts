import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

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

export const adminApi = {
  // Stats
  getStats: () => api.get('/admin/stats'),

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

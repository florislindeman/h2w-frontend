import axios from 'axios';

const API_URL = 'https://h2wchatbot-production.up.railway.app';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
};

export const documentsAPI = {
  upload: (formData: FormData) =>
    api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  list: () => api.get('/documents/'),
};

export const chatAPI = {
  ask: (question: string, document_ids: string[]) =>
    api.post('/chat/ask', { question, document_ids }),
};

// ADD THIS - Categories API
export const categoriesAPI = {
  list: () => api.get('/categories/'),
  create: (name: string, description?: string) =>
    api.post('/categories/', { name, description }),
  delete: (categoryId: string) =>
    api.delete(`/categories/${categoryId}`),
};

export default api;

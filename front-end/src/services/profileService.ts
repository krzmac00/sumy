import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

// Helper to get auth token
const getAuthToken = () => localStorage.getItem('auth_token');

// Create axios instance with auth
const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const profileService = {
  uploadProfilePicture: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('profile_picture', file);
    
    const response = await api.post('/accounts/profile-picture/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },
  
  deleteProfilePicture: async (): Promise<any> => {
    const response = await api.delete('/accounts/profile-picture/');
    return response.data;
  },
};

export default profileService;
import axios from 'axios';
import {
  Advertisement,
  AdvertisementDetail,
  AdvertisementCreateData,
  AdvertisementUpdateData,
  AdvertisementFilters,
  Comment,
  CommentCreateData,
  CommentUpdateData,
} from '../types/noticeboard';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Advertisement endpoints
export const advertisementAPI = {
  // Get list of advertisements with optional filters
  list: async (filters?: AdvertisementFilters): Promise<Advertisement[]> => {
    const params = new URLSearchParams();
    
    if (filters) {
      if (filters.category) params.append('category', filters.category);
      if (filters.is_active !== undefined) params.append('is_active', filters.is_active.toString());
      if (filters.price_min !== undefined) params.append('price_min', filters.price_min.toString());
      if (filters.price_max !== undefined) params.append('price_max', filters.price_max.toString());
      if (filters.search) params.append('search', filters.search);
    }
    
    console.log('=== API REQUEST ===');
    console.log('URL:', `/api/noticeboard/advertisements/?${params}`);
    console.log('Filters:', filters);
    
    const response = await apiClient.get(`/api/noticeboard/advertisements/?${params}`);
    
    console.log('=== API RESPONSE ===');
    console.log('Status:', response.status);
    console.log('Headers:', response.headers);
    console.log('Data type:', typeof response.data);
    console.log('Data is array:', Array.isArray(response.data));
    console.log('Data:', response.data);
    
    // Check if response.data has a results property (pagination)
    if (response.data && typeof response.data === 'object' && 'results' in response.data) {
      console.log('Response has pagination structure');
      console.log('Results:', response.data.results);
      console.log('Count:', response.data.count);
      return response.data.results;
    }
    
    return response.data;
  },

  // Get single advertisement detail
  get: async (id: number): Promise<AdvertisementDetail> => {
    const response = await apiClient.get(`/api/noticeboard/advertisements/${id}/`);
    return response.data;
  },

  // Create new advertisement
  create: async (data: AdvertisementCreateData): Promise<Advertisement> => {
    const response = await apiClient.post(`/api/noticeboard/advertisements/`, data);
    return response.data;
  },

  // Update advertisement
  update: async (id: number, data: AdvertisementUpdateData): Promise<Advertisement> => {
    const response = await apiClient.patch(`/api/noticeboard/advertisements/${id}/`, data);
    return response.data;
  },

  // Delete advertisement
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/noticeboard/advertisements/${id}/`);
  },

  // Renew/extend advertisement expiration
  renew: async (id: number, days: number = 30): Promise<Advertisement> => {
    const response = await apiClient.post(`/api/noticeboard/advertisements/${id}/renew/`, { days });
    return response.data;
  },

  // Get comments for an advertisement
  getComments: async (advertisementId: number): Promise<Comment[]> => {
    const response = await apiClient.get(`/api/noticeboard/advertisements/${advertisementId}/comments/`);
    return response.data;
  },

  // Create comment on advertisement
  createComment: async (advertisementId: number, data: CommentCreateData): Promise<Comment> => {
    const response = await apiClient.post(
      `/api/noticeboard/advertisements/${advertisementId}/comments/`,
      data
    );
    return response.data;
  },
};

// Comment endpoints
export const commentAPI = {
  // Update comment
  update: async (id: number, data: CommentUpdateData): Promise<Comment> => {
    const response = await apiClient.patch(`/api/noticeboard/comments/${id}/`, data);
    return response.data;
  },

  // Delete comment
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/noticeboard/comments/${id}/`);
  },

  // Toggle comment visibility
  toggleVisibility: async (id: number): Promise<Comment> => {
    const response = await apiClient.post(`/api/noticeboard/comments/${id}/toggle_visibility/`);
    return response.data;
  },
};

// Helper function to format price
export const formatPrice = (price: number | null): string => {
  if (price === null) return '';
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
  }).format(price);
};

// Helper function to format date
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString('pl-PL');
};
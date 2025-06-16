import axios from 'axios';
import { NewsCategory, NewsItem, NewsFilters } from '../types/news';

const API_BASE_URL = 'http://localhost:8000/api/news';

// Helper to get auth token
const getAuthToken = () => localStorage.getItem('auth_token');

// Create axios instance with auth
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Note: We don't add auth headers for news API since most endpoints are public
// If you need auth for specific endpoints, add it in the individual methods

export const newsAPI = {
  // Categories
  getCategories: async (): Promise<NewsCategory[]> => {
    const response = await api.get('/categories/');
    return response.data;
  },

  // News items
  getNewsItems: async (filters?: NewsFilters): Promise<any> => {
    const params = new URLSearchParams();
    
    if (filters) {
      if (filters.categories.length > 0) {
        filters.categories.forEach(catId => params.append('category', catId.toString()));
      }
      if (filters.dateFrom) params.append('date_from', filters.dateFrom);
      if (filters.dateTo) params.append('date_to', filters.dateTo);
      if (filters.search) params.append('search', filters.search);
    }
    
    const response = await api.get('/items/', { params });
    return response.data;
  },

  getNewsItem: async (id: number): Promise<NewsItem> => {
    const response = await api.get(`/items/${id}/`);
    return response.data;
  },

  createNewsItem: async (data: {
    title: string;
    content: string;
    category_ids: number[];
    event_date?: string;
    event_location?: string;
  }): Promise<NewsItem> => {
    const token = getAuthToken();
    const response = await api.post('/items/create/', data, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return response.data;
  },

  updateNewsItem: async (id: number, data: Partial<{
    title: string;
    content: string;
    category_ids: number[];
    event_date?: string;
    event_location?: string;
    is_published: boolean;
  }>): Promise<NewsItem> => {
    const token = getAuthToken();
    const response = await api.patch(`/items/${id}/`, data, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return response.data;
  },

  deleteNewsItem: async (id: number): Promise<void> => {
    const token = getAuthToken();
    await api.delete(`/items/${id}/`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
  },
};

export default newsAPI;
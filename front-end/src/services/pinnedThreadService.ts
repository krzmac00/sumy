import axios from 'axios';
import { Thread } from '../types/forum';

const API_BASE_URL = 'http://localhost:8000';

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

export interface PinnedThread {
  id: number;
  thread: number;
  thread_data: Thread;
  pinned_at: string;
  last_viewed: string;
  unread_count: number;
}

export interface PinResponse {
  status: 'pinned' | 'unpinned';
  message: string;
  data?: PinnedThread;
}

class PinnedThreadService {
  async pinThread(threadId: number): Promise<PinResponse> {
    const response = await api.post<PinResponse>('/api/v1/threads/pin/', {
      thread_id: threadId
    });
    return response.data;
  }

  async getPinnedThreads(): Promise<PinnedThread[]> {
    const response = await api.get<PinnedThread[]>('/api/v1/threads/pinned/');
    return response.data;
  }

  async markThreadAsViewed(threadId: number): Promise<void> {
    await api.post(`/api/v1/threads/${threadId}/mark-viewed/`);
  }

  async getPinStatus(threadId: number): Promise<boolean> {
    const response = await api.get<{ is_pinned: boolean }>(`/api/v1/threads/${threadId}/pin-status/`);
    return response.data.is_pinned;
  }

  async getBulkPinStatus(threadIds: number[]): Promise<{ [threadId: number]: boolean }> {
    const response = await api.post<{ pin_statuses: { [threadId: number]: boolean } }>('/api/v1/threads/bulk-pin-status/', {
      thread_ids: threadIds
    });
    return response.data.pin_statuses;
  }
}

export const pinnedThreadService = new PinnedThreadService();
import { CustomCalendarEvent } from '@/types/event';
import { Post, PostCreateData, PostUpdateData, Thread, ThreadCreateData, VoteData, VoteResponse } from '../types/forum';
import axios from 'axios';
import { SchedulePlan } from '@/types/SchedulePlan';

/**
 * Base API URL
 * In development, this should point to your Django backend
 */
const API_BASE = 'http://localhost:8000';

/**
 * Headers for JSON requests
 */
const JSON_HEADERS = {
  'Content-Type': 'application/json',
};

/**
 * Thread API service
 */
export const threadAPI = {
  /**
   * Get all threads with optional blacklist, date range, and ordering parameters
   */
  getAll: async (blacklistOn = true, dateFrom?: string, dateTo?: string, ordering?: string): Promise<Thread[]> => {
    const params = new URLSearchParams();
    
    if (!blacklistOn) {
      params.append('blacklist', 'off');
    }
    
    if (dateFrom) {
      params.append('date_from', dateFrom);
    }
    
    if (dateTo) {
      params.append('date_to', dateTo);
    }
    
    if (ordering) {
      params.append('ordering', ordering);
    }
    
    const queryString = params.toString();
    const url = `${API_BASE}/threads/${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch threads: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Check if response is paginated (Django REST Framework pagination)
    if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
      return data.results;
    }
    
    // If it's a direct array
    if (Array.isArray(data)) {
      return data;
    }
    
    // If neither condition is met, return empty array to prevent errors
    return [];
  },

  /**
   * Get a specific thread by ID
   */
  getOne: async (id: number): Promise<Thread> => {
    const response = await fetch(`${API_BASE}/threads/${id}/`);
    if (!response.ok) {
      throw new Error(`Failed to fetch thread ${id}: ${response.statusText}`);
    }
    return response.json();
  },

  /**
   * Create a new thread
   */
  create: async (data: ThreadCreateData): Promise<Thread> => {
    const response = await fetch(`${API_BASE}/create-thread/`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create thread: ${error}`);
    }
    
    return response.json();
  },

  /**
   * Update a thread
   */
  update: async (id: number, data: Partial<ThreadCreateData>): Promise<Thread> => {
    const response = await fetch(`${API_BASE}/threads/${id}/`, {
      method: 'PATCH',
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Failed to update thread ${id}: ${response.statusText}`);
    }
    return response.json();
  },

  /**
   * Delete a thread
   */
  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE}/threads/${id}/`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete thread ${id}: ${response.statusText}`);
    }
  },

  /**
   * Admin takes threads from e-mail
   */
  threadsFromEmail: async (): Promise<void> => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get('http://localhost:8000/api/accounts/me/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.role === "admin") {
        const emailResponse = await axios.get('http://localhost:8000/api/email/fetch-delete/', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        axios.post('http://localhost:8000/api/email/create/', {
          emails: emailResponse.data.emails
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
        }
        }).then(response => {
          // Thread creation successful
        }).catch(error => {
              console.error('Błąd podczas tworzenia wątków:', error.response?.data || error.message);
        });
      }
    } catch (error) {
      console.error('Error fetching user info or threads:', error);
    }
  }
};

/**
 * Post API service
 */
export const postAPI = {
  /**
   * Get all posts
   */
  getAll: async (): Promise<Post[]> => {
    const response = await fetch(`${API_BASE}/posts/`);
    if (!response.ok) {
      throw new Error(`Failed to fetch posts: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Check if response is paginated (Django REST Framework pagination)
    if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
      return data.results;
    }
    
    // If it's a direct array
    if (Array.isArray(data)) {
      return data;
    }
    
    // If neither condition is met, return empty array to prevent errors
    return [];
  },

  /**
   * Get a specific post by ID
   */
  getOne: async (id: number): Promise<Post> => {
    const response = await fetch(`${API_BASE}/posts/${id}/`);
    if (!response.ok) {
      throw new Error(`Failed to fetch post ${id}: ${response.statusText}`);
    }
    return response.json();
  },

  /**
   * Create a new post
   */
  create: async (data: PostCreateData): Promise<Post> => {
    // Ensure required fields exist
    const postData: PostCreateData = {
      ...data,
      nickname: data.nickname || "Anonymous User",
      replying_to: Array.isArray(data.replying_to) ? data.replying_to : []
    };

    const response = await fetch(`${API_BASE}/posts/`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(postData),
    });
    
    if (!response.ok) {
      // Try to get more detailed error information
      try {
        const errorData = await response.json();
        throw new Error(`Failed to create post: ${JSON.stringify(errorData)}`);
      } catch (jsonError) {
        // If can't parse JSON, fall back to statusText
        throw new Error(`Failed to create post: ${response.statusText}`);
      }
    }
    return response.json();
  },

  /**
   * Update a post
   */
  update: async (id: number, data: PostUpdateData): Promise<Post> => {
    const response = await fetch(`${API_BASE}/posts/${id}/`, {
      method: 'PATCH',
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Failed to update post ${id}: ${response.statusText}`);
    }
    return response.json();
  },

  /**
   * Delete a post
   */
  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE}/posts/${id}/`, {
      method: 'DELETE',
      credentials: 'include', // Include credentials to send authentication cookies
    });

    if (!response.ok) {
      // Try to parse detailed error message
      try {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to delete post ${id}: ${response.statusText}`);
      } catch (jsonError) {
        // If can't parse JSON, fall back to statusText
        throw new Error(`Failed to delete post ${id}: ${response.statusText}`);
      }
    }
  },
};

/**
 * Vote API service
 */
export const voteAPI = {
  /**
   * Vote on a thread
   */
  voteThread: async (threadId: number, voteType: 'upvote' | 'downvote'): Promise<VoteResponse> => {
    const response = await fetch(`${API_BASE}/threads/${threadId}/vote/`, {
      method: 'POST',
      headers: JSON_HEADERS,
      credentials: 'include',
      body: JSON.stringify({ vote_type: voteType }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(errorData.error || `Failed to vote on thread: ${response.statusText}`);
    }
    
    return response.json();
  },

  /**
   * Vote on a post
   */
  votePost: async (postId: number, voteType: 'upvote' | 'downvote'): Promise<VoteResponse> => {
    const response = await fetch(`${API_BASE}/posts/${postId}/vote/`, {
      method: 'POST',
      headers: JSON_HEADERS,
      credentials: 'include',
      body: JSON.stringify({ vote_type: voteType }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(errorData.error || `Failed to vote on post: ${response.statusText}`);
    }
    
    return response.json();
  },
};

/**
 * Event API service
 */
export const eventAPI = {
  getAll: async (): Promise<CustomCalendarEvent[]> => {
    const url = `${API_BASE}/events/`;
    const response = await fetch(url, {
      headers: authHeaders()
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.statusText}`);
    }

    return data.results.map((event: any) => ({
      ...event,
      start: new Date(event.start_date),
      end: new Date(event.end_date),
      repeatType: event.repeat_type,
      schedule_plan: event.schedule_plan ?? null,
      room: event.room ?? null,
      teacher: event.teacher ?? null,
    }));
  },

  getOne: async (id: number): Promise<CustomCalendarEvent> => {
    const url = `${API_BASE}/events/${id}/`;
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Failed to fetch event ${id}: ${response.statusText}`);
    }

    return {
      ...data,
      start: new Date(data.start_date),
      end: new Date(data.end_date),
      repeatType: data.repeat_type,
      schedule_plan: data.schedule_plan ?? null,
      room: data.room ?? null,
      teacher: data.teacher ?? null,
    };
  },

  create: async (data: Omit<CustomCalendarEvent, "id">): Promise<CustomCalendarEvent> => {
    const url = `${API_BASE}/events/`;
    const payload = {
      ...data,
      start_date: data.start,
      end_date: data.end,
      repeat_type: data.repeatType,
      schedule_plan: data.schedule_plan ?? null,
      room: data.room ?? null,
      teacher: data.teacher ?? null,
    };

    const response = await fetch(url, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("[ERROR]", response.status, result);
    }

    return {
      ...result,
      start: new Date(result.start_date),
      end: new Date(result.end_date),
      repeatType: result.repeat_type,
      schedule_plan: result.schedule_plan ?? null,
      room: result.room ?? null,
      teacher: result.teacher ?? null,
    };
  },

  update: async (id: number, data: Partial<CustomCalendarEvent>): Promise<CustomCalendarEvent> => {
    const url = `${API_BASE}/events/${id}/`;
    const payload = {
      ...data,
      start_date: data.start,
      end_date: data.end,
      repeat_type: data.repeatType,
      schedule_plan: data.schedule_plan ?? null,
      room: data.room ?? null,
      teacher: data.teacher ?? null,
    };

    const response = await fetch(url, {
      method: "PUT",
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("[ERROR]", response.status, result);
    }

    return {
      ...result,
      start: new Date(result.start_date),
      end: new Date(result.end_date),
      repeatType: result.repeat_type,
      schedule_plan: result.schedule_plan ?? null,
      room: result.room ?? null,
      teacher: result.teacher ?? null,
    };
  },

  delete: async (id: number): Promise<void> => {
    const url = `${API_BASE}/events/${id}/`;
    console.log("[DELETE]", url);

    const response = await fetch(url, { method: "DELETE" });

    if (!response.ok) {
      console.error("[ERROR]", response.status, await response.text());
    }
  },
};

function authHeaders() {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const scheduleAPI = {
  getAll: async (): Promise<SchedulePlan[]> => {
    const url = `${API_BASE}/schedule-plans/`;

    try {
      const response = await axios.get(url, { headers: authHeaders() });
      const data = response.data;

      if (!Array.isArray(data.results)) {
        return [];
      }

      return data.results;
    } catch (err: any) {
      console.error("[ERROR GETTING SCHEDULES]", err.response?.status, err.response?.data);
      throw err;
    }
  },

  create: async (payload: Pick<SchedulePlan, 'name' | 'description' | 'code'>): Promise<SchedulePlan> => {
    const url = `${API_BASE}/schedule-plans/`;
    console.log("[POST]", url, payload);

    try {
      const response = await axios.post(url, payload, {
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (err: any) {
      console.error("[ERROR CREATING SCHEDULE]", err.response?.status, err.response?.data);
      throw err;
    }
  },

  getEvents: async (scheduleId: number): Promise<CustomCalendarEvent[]> => {
    const url = `${API_BASE}/events/?schedule_plan=${scheduleId}`;
    console.log("[GET EVENTS]", url);

    try {
      const response = await axios.get(url, { headers: authHeaders() });
      const data = response.data;

      if (!Array.isArray(data.results)) {
        return [];
      }

      return data.results.map((event: any) => ({
        id: event.id,
        title: event.title,
        description: event.description ?? '',
        category: event.category,
        color: event.color,
        repeatType: event.repeat_type,
        start: new Date(event.start_date),
        end: new Date(event.end_date),
        schedule_plan: event.schedule_plan ?? null,
        room: event.room ?? null,
        teacher: event.teacher ?? null,
      }));
    } catch (err: any) {
      console.error("[ERROR FETCHING EVENTS]", err.response?.status, err.response?.data);
      throw err;
    }
  },

  addEvent: async (scheduleId: number, event: Omit<CustomCalendarEvent, "id">): Promise<CustomCalendarEvent> => {
    const url = `${API_BASE}/events/`;
    const payload = {
      title: event.title,
      description: event.description ?? '',
      category: event.category,
      start_date: event.start,
      end_date: event.end,
      repeat_type: event.repeatType,
      room: event.room,
      teacher: event.teacher,
      schedule_plan: scheduleId,
    };

    try {
      const response = await axios.post(url, payload, {
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json',
        },
      });

      const saved = response.data;
      return {
        ...saved,
        start: new Date(saved.start_date),
        end: new Date(saved.end_date),
        repeatType: saved.repeat_type,
        schedule_plan: saved.schedule_plan ?? null,
        room: saved.room ?? null,
        teacher: saved.teacher ?? null,
        color: saved.color ?? '',
      };
    } catch (err: any) {
      console.error("[ERROR ADDING EVENT]", err.response?.status, err.response?.data);
      throw err;
    }
  },

  update: async (id: number, data: Partial<SchedulePlan>): Promise<void> => {
    const url = `${API_BASE}/schedule-plans/${id}/`;

    try {
      await axios.patch(url, data, {
        headers: authHeaders(),
      });
    } catch (err: any) {
      console.error("[ERROR UPDATING SCHEDULE]", err.response?.status, err.response?.data);
      throw err;
    }
  },

  deleteEvent: async (eventId: number): Promise<void> => {
    const url = `${API_BASE}/events/${eventId}/`;

    try {
      await axios.delete(url, {
        headers: authHeaders(),
      });
    } catch (err: any) {
      console.error("[ERROR DELETING EVENT]", err.response?.status, err.response?.data);
      throw err;
    }
  },

  updateEvent: async (scheduleId: number, event: CustomCalendarEvent): Promise<void> => {
    const baseId = event.id.toString().split('-')[0];
    const url = `${API_BASE}/events/${baseId}/`;

    const payload = {
      title: event.title,
      description: event.description ?? '',
      category: event.category,
      start_date: event.start,
      end_date: event.end,
      repeat_type: event.repeatType,
      room: event.room,
      teacher: event.teacher,
      schedule_plan: scheduleId,
    };

    try {
      await axios.patch(url, payload, {
        headers: authHeaders(),
      });
    } catch (err: any) {
      console.error("[ERROR UPDATING EVENT]", err.response?.status, err.response?.data);
    }
  },

  delete: async (id: number): Promise<void> => {
    const url = `${API_BASE}/schedule-plans/${id}/`;

    try {
      await axios.delete(url, {
        headers: authHeaders(),
      });
    } catch (err: any) {
      console.error("[ERROR DELETING SCHEDULE]", err.response?.status, err.response?.data);
    }
  },
};
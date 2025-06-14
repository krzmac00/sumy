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
   * Get all threads with optional blacklist and date range parameters
   */
  getAll: async (blacklistOn = true, dateFrom?: string, dateTo?: string): Promise<Thread[]> => {
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
    console.warn('Unexpected response format from threads API:', data);
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
          console.log('Utworzone wątki:', response.data.created_threads);
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
    console.warn('Unexpected response format from posts API:', data);
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

    console.log('Sending post data to server:', postData);
    
    const response = await fetch(`${API_BASE}/posts/`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(postData),
    });
    
    if (!response.ok) {
      // Try to get more detailed error information
      try {
        const errorData = await response.json();
        console.error('Server returned error:', errorData);
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
  /**
   * Get all events
   */
  getAll: async (): Promise<CustomCalendarEvent[]> => {
    const response = await fetch(`${API_BASE}/events/`);
    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.statusText}`);
    }
    const data = await response.json();

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

  /**
   * Get a specific event by ID
   */
  getOne: async (id: number): Promise<CustomCalendarEvent> => {
    const response = await fetch(`${API_BASE}/events/${id}/`);
    if (!response.ok) {
      throw new Error(`Failed to fetch event ${id}: ${response.statusText}`);
    }
    const event = await response.json();
    return {
      ...event,
      start: new Date(event.start_date),
      end: new Date(event.end_date),
      repeatType: event.repeat_type,
      schedule_plan: event.schedule_plan ?? null,
      room: event.room ?? null,
      teacher: event.teacher ?? null,
    };
  },

  /**
   * Create a new event
   */
  create: async (data: Omit<CustomCalendarEvent, "id">): Promise<CustomCalendarEvent> => {
    const response = await fetch(`${API_BASE}/events/`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({
        ...data,
        start_date: data.start,
        end_date: data.end,
        repeat_type: data.repeatType,
        schedule_plan: data.schedule_plan ?? null,
        room: data.room ?? null,
        teacher: data.teacher ?? null,
      }),
    });
    if (!response.ok) {
      throw new Error(`Failed to create event: ${response.statusText}`);
    }
    const event = await response.json();
    return {
      ...event,
      start: new Date(event.start_date),
      end: new Date(event.end_date),
      repeatType: event.repeat_type,
      schedule_plan: event.schedule_plan ?? null,
      room: event.room ?? null,
      teacher: event.teacher ?? null,
    };
  },

  /**
   * Update an existing event
   */
  update: async (id: number, data: Partial<CustomCalendarEvent>): Promise<CustomCalendarEvent> => {
    const response = await fetch(`${API_BASE}/events/${id}/`, {
      method: "PUT",
      headers: JSON_HEADERS,
      body: JSON.stringify({
        ...data,
        start_date: data.start,
        end_date: data.end,
        repeat_type: data.repeatType,
        schedule_plan: data.schedule_plan ?? null,
        room: data.room ?? null,
        teacher: data.teacher ?? null,
      }),
    });
    if (!response.ok) {
      throw new Error(`Failed to update event ${id}: ${response.statusText}`);
    }
    const event = await response.json();
    return {
      ...event,
      start: new Date(event.start_date),
      end: new Date(event.end_date),
      repeatType: event.repeat_type,
      schedule_plan: event.schedule_plan ?? null,
      room: event.room ?? null,
      teacher: event.teacher ?? null,
    };
  },

  /**
   * Delete an event
   */
  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE}/events/${id}/`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error(`Failed to delete event ${id}: ${response.statusText}`);
    }
  },
};

function authHeaders() {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const scheduleAPI = {
  /**
   * Get all schedules
   */
  getAll: async (): Promise<SchedulePlan[]> => {
    const response = await axios.get(`${API_BASE}/schedule-plans/`, {
      headers: authHeaders(),
    });

    const data = response.data;

    if (!Array.isArray(data.results)) {
      console.warn("Expected paginated results in getAll, got:", data);
      return [];
    }

    return data.results;
  },

  /**
   * Create a schedule plan
   */
  create: async (
    payload: Pick<SchedulePlan, 'name' | 'description' | 'code'>
  ): Promise<SchedulePlan> => {
    console.log(payload);
    const response = await axios.post(`${API_BASE}/schedule-plans/`, payload, {
      headers: {
        ...authHeaders(),
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  },

  /**
   * Get all events for a given schedule
   */
  getEvents: async (scheduleId: number): Promise<CustomCalendarEvent[]> => {
    const response = await axios.get(`${API_BASE}/events/?schedule_plan=${scheduleId}`, {
      headers: authHeaders(),
    });
    
    const data = response.data;

    if (!Array.isArray(data.results)) {
      console.warn("Expected paginated results in getEvents, got:", data);
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
  },

  /**
   * Add a new event to a schedule
   */
  addEvent: async (scheduleId: number, event: CustomCalendarEvent): Promise<void> => {
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

    console.log(payload);

    await axios.post(`${API_BASE}/events/`, payload, {
      headers: {
        ...authHeaders(),
        'Content-Type': 'application/json',
      },
    });
  },

  /**
   * Update a schedule plan (e.g. name/description)
   */
  update: async (id: number, data: Partial<SchedulePlan>): Promise<void> => {
    await axios.patch(`${API_BASE}/schedule-plans/${id}/`, data, {
      headers: authHeaders(),
    });
  },

  /**
   * Update a specific event in a schedule
   */
  updateEvent: async (scheduleId: number, event: CustomCalendarEvent): Promise<void> => {
    const baseId = event.id.toString().split('-')[0];

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

    await axios.patch(`${API_BASE}/events/${baseId}/`, payload, {
      headers: authHeaders(),
    });
  },

  /**
   * Delete a schedule plan (and associated events)
   */
  delete: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE}/schedule-plans/${id}/`, {
      headers: authHeaders(),
    });
  },
};
import { Post, PostCreateData, PostUpdateData, Thread, ThreadCreateData, VoteData, VoteResponse } from '../types/forum';

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
   * Get all threads
   */
  getAll: async (): Promise<Thread[]> => {
    const response = await fetch(`${API_BASE}/threads/`);
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
   
  create: async (data: ThreadCreateData): Promise<Thread> => {
    const response = await fetch(`${API_BASE}/threads/`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Failed to create thread: ${response.statusText}`);
    }
    return response.json();
  },*/


  /**
 * Create a new thread
 
create: async (data: ThreadCreateData): Promise<Thread> => {
  // First, create a post
  const postResponse = await fetch(`${API_BASE}/posts/`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({
      nickname: data.nickname,
      content: data.content,
    }),
  });
  
  if (!postResponse.ok) {
    const error = await postResponse.text();
    throw new Error(`Failed to create post: ${error}`);
  }
  
  const post = await postResponse.json();
  
  // Then, create the thread referencing the post
  const threadResponse = await fetch(`${API_BASE}/threads/`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({
      post: post.id, // Reference the created post
      category: data.category,
      title: data.title,
      visible_for_teachers: data.visible_for_teachers,
      can_be_answered: data.can_be_answered,
    }),
  });
  
  if (!threadResponse.ok) {
    const error = await threadResponse.text();
    throw new Error(`Failed to create thread: ${error}`);
  }
  
  return threadResponse.json();
}, */

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
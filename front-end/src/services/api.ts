import { Post, PostCreateData, PostUpdateData, Thread, ThreadCreateData } from '../types/forum';

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
    return response.json();
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
    return response.json();
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
    const response = await fetch(`${API_BASE}/posts/`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Failed to create post: ${response.statusText}`);
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
    });
    if (!response.ok) {
      throw new Error(`Failed to delete post ${id}: ${response.statusText}`);
    }
  },
};
/**
 * Interface for Post model
 */
export interface Post {
  id: number;
  nickname: string;
  content: string;
  date: string; // ISO datetime string
  was_edited: boolean;
  thread: number | null; // Thread ID
  replying_to: number[]; // Array of Post IDs this post replies to
  user?: number | null; // User ID of the post author
  is_anonymous: boolean;
  user_display_name: string; // Display name (either user's name or nickname)
}

/**
 * Interface for Thread model
 */
export interface Thread {
  id: number; // Thread ID (primary key)
  category: string;
  title: string;
  content: string; // Thread content
  nickname: string; // Thread author nickname
  visible_for_teachers: boolean;
  can_be_answered: boolean;
  last_activity_date: string; // ISO datetime string
  date: string; // Thread creation date
  posts: Post[]; // Related posts
  user?: number | null; // User ID of the thread author
  is_anonymous: boolean;
  author_display_name: string; // Display name (either user's name or nickname)
  
  // Legacy field for backward compatibility during migration
  post?: number; // Legacy post ID reference
}

/**
 * Interface for creating a new Thread
 */
export interface ThreadCreateData {
  title: string;
  category: string;
  content: string;
  nickname?: string; // Optional if using current user's name
  visible_for_teachers: boolean;
  can_be_answered: boolean;
  is_anonymous: boolean;
}

/**
 * Interface for creating a new Post
 */
export interface PostCreateData {
  nickname?: string;
  content: string;
  thread: number;
  replying_to: number[];
  is_anonymous: boolean;
}

/**
 * Interface for updating a Post
 */
export interface PostUpdateData {
  content: string;
}
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
}

/**
 * Interface for Thread model
 */
export interface Thread {
  post: number; // Post ID (primary key)
  category: string;
  title: string;
  visible_for_teachers: boolean;
  can_be_answered: boolean;
  last_activity_date: string; // ISO datetime string
  nickname: string; // From associated post
  content: string; // From associated post
  posts: Post[]; // Related posts
}

/**
 * Interface for creating a new Thread
 */
export interface ThreadCreateData {
  title: string;
  category: string;
  content: string;
  nickname: string;
  visible_for_teachers: boolean;
  can_be_answered: boolean;
}

/**
 * Interface for creating a new Post
 */
export interface PostCreateData {
  nickname: string;
  content: string;
  thread: number;
  replying_to: number[];
}

/**
 * Interface for updating a Post
 */
export interface PostUpdateData {
  content: string;
}
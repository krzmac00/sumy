export interface Author {
  id: number;
  login: string;
  first_name: string;
  last_name: string;
}

export type AdvertisementCategory = 
  | 'announcement'
  | 'sale'
  | 'buy'
  | 'service'
  | 'event'
  | 'lost_found'
  | 'other';

export interface Advertisement {
  id: number;
  title: string;
  content: string;
  category: AdvertisementCategory;
  author: Author;
  created_date: string;
  last_activity_date: string;
  is_active: boolean;
  expires_at: string | null;
  contact_info: string;
  price: number | null;
  location: string;
  comments_count: number;
  is_expired: boolean;
  can_edit: boolean;
}

export interface AdvertisementDetail extends Advertisement {
  comments: Comment[];
}

export interface Comment {
  id: number;
  advertisement: number;
  author: Author;
  content: string;
  created_date: string;
  is_public: boolean;
  was_edited: boolean;
  can_edit: boolean;
  can_view: boolean;
}

export interface AdvertisementCreateData {
  title: string;
  content: string;
  category: AdvertisementCategory;
  expires_at?: string;
  contact_info?: string;
  price?: number;
  location?: string;
}

export interface AdvertisementUpdateData extends Partial<AdvertisementCreateData> {
  is_active?: boolean;
}

export interface CommentCreateData {
  content: string;
  is_public?: boolean;
}

export interface CommentUpdateData {
  content?: string;
  is_public?: boolean;
}

export interface AdvertisementFilters {
  category?: AdvertisementCategory;
  is_active?: boolean;
  price_min?: number;
  price_max?: number;
  search?: string;
}

export const CATEGORY_COLORS: Record<AdvertisementCategory, string> = {
  announcement: '#2563eb', // blue
  sale: '#10b981', // green
  buy: '#f59e0b', // amber
  service: '#8b47ff', // purple
  event: '#ef4444', // red
  lost_found: '#6366f1', // indigo
  other: '#6b7280', // gray
};
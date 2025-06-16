export interface NewsCategory {
  id: number;
  name: string;
  slug: string;
  parent: number | null;
  category_type: 'university' | 'faculty' | 'announcement' | 'event';
  children: NewsCategory[];
  full_path: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  order: number;
}

export interface NewsAuthor {
  id: number;
  first_name: string;
  last_name: string;
  role: string;
  display_name: string;
}

export interface NewsItem {
  id: number;
  title: string;
  content: string;
  author: NewsAuthor;
  categories: NewsCategory[];
  all_categories: NewsCategory[];
  created_at: string;
  updated_at: string;
  is_published: boolean;
  event_date: string | null;
  event_location: string | null;
  can_edit: boolean;
}

export interface NewsFilters {
  categories: number[];
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}
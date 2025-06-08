
/**
 * Categories for threads across different forum sections
 * Each category has a unique identifier that matches the i18n key
 */
export const THREAD_CATEGORIES = [
  'general',
  'exams',
  'assignments',
  'materials',
  'courses',
  'lecturers',
  'events',
  'technical',
  'other'
] as const;

export type ThreadCategory = typeof THREAD_CATEGORIES[number];

/**
 * Get translated category options for selection components
 * 
 * @param t Translation function
 * @returns Array of objects with value and label for each category
 */
export const getTranslatedCategories = (t: (key: string) => string) => {
  return THREAD_CATEGORIES.map(category => ({
    value: category,
    label: translateCategory(category, t)
  }));
};

/**
 * Translate a category ID to its localized display name
 * 
 * @param category The category ID to translate
 * @param t Translation function
 * @returns Translated category name
 */
export const translateCategory = (category: string, t: (key: string) => string): string => {
  return t(`categories.${category}`);
};
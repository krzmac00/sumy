import { TFunction } from 'i18next';

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
];

/**
 * Get translated category options for selection components
 * 
 * @param t Translation function
 * @returns Array of objects with value and label for each category
 */
export const getTranslatedCategories = (t: TFunction) => {
  return THREAD_CATEGORIES.map(category => ({
    value: category,
    label: t(`categories.${category}`)
  }));
};

/**
 * Translate a category ID to its localized display name
 * 
 * @param categoryId The category ID to translate
 * @param t Translation function
 * @returns Translated category name
 */
export const translateCategory = (categoryId: string, t: TFunction): string => {
  return t(`categories.${categoryId}`);
};
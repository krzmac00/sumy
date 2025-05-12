import { TFunction } from 'i18next';

/**
 * Format a date as a "time ago" string with the following rules:
 * - If within 1 hour: how many minutes ago (1-59 min)
 * - If within 24 hours: how many hours ago (1-23 hr. ago)
 * - If within 7 days: how many days ago (1-7)
 * - If within 1 month: how many weeks ago (1-5)
 * - If within 1 year: how many months ago (1-11)
 * - Else: how many years ago
 * 
 * @param dateString ISO date string to format
 * @param t Translation function
 * @returns Formatted string in the user's language
 */
export const formatTimeAgo = (dateString: string, t: TFunction): string => {
  const date = new Date(dateString);
  const now = new Date();
  
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);
  
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${t('time.minutesAgo', { count: diffInMinutes })}`;
  } else if (diffInHours < 24) {
    return `${diffInHours} ${t('time.hoursAgo', { count: diffInHours })}`;
  } else if (diffInDays < 7) {
    return `${diffInDays} ${t('time.daysAgo', { count: diffInDays })}`;
  } else if (diffInWeeks < 5) {
    return `${diffInWeeks} ${t('time.weeksAgo', { count: diffInWeeks })}`;
  } else if (diffInMonths < 12) {
    return `${diffInMonths} ${t('time.monthsAgo', { count: diffInMonths })}`;
  } else {
    return `${diffInYears} ${t('time.yearsAgo', { count: diffInYears })}`;
  }
};

/**
 * Format a date in the user's locale
 * @param dateString ISO date string to format
 * @returns Formatted date string
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('default', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};
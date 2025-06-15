/**
 * Utility to handle media URLs from the backend
 */

const API_BASE_URL = 'http://localhost:8000';

export function getMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  // If it's already a full URL, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // If it's a relative URL, prepend the API base URL
  if (url.startsWith('/')) {
    return `${API_BASE_URL}${url}`;
  }
  
  // If it doesn't start with /, add it
  return `${API_BASE_URL}/${url}`;
}
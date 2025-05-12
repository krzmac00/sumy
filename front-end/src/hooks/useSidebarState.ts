import { useState, useEffect } from 'react';

/**
 * Custom hook to manage sidebar state with localStorage persistence
 * @param initialState - Default state (if no stored value)
 * @returns [sidebarOpen, setSidebarOpen] - State and setter
 */
export const useSidebarState = (initialState: boolean = false): [boolean, (value: boolean) => void] => {
  // Try to get stored value, or use initialState if none exists
  const [sidebarOpen, setSidebarOpenState] = useState<boolean>(() => {
    const storedValue = localStorage.getItem('sidebarOpen');
    return storedValue !== null ? JSON.parse(storedValue) : initialState;
  });

  // Update localStorage whenever the state changes
  useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  // Return state and setter
  return [sidebarOpen, setSidebarOpenState];
};

export default useSidebarState;
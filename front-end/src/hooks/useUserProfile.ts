import { useState, useEffect } from 'react';
import axios from 'axios';

interface UserProfileData {
  id: number;
  login: string;
  first_name: string;
  last_name: string;
  role: string;
  bio: string;
  date_joined: string;
}

export const useUserProfile = (userId: string) => {
  const [userData, setUserData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setError('Invalid user ID');
      return;
    }

    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get(
          `http://localhost:8000/api/accounts/users/${userId}/profile/`
        );
        
        setUserData(response.data);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setError('User not found');
        } else {
          setError('Failed to load user profile');
        }
        console.error('Error fetching user profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  return { userData, loading, error };
};
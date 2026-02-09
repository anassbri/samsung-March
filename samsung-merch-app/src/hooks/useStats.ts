import { useQuery } from '@tanstack/react-query';
import { getUsersStats } from '../api/usersApi';

/**
 * Hook to fetch user statistics
 */
export const useUserStats = () => {
  return useQuery({
    queryKey: ['userStats'],
    queryFn: getUsersStats,
    staleTime: 60000, // 1 minute
  });
};

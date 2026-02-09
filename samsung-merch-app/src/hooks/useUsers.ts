import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, getUsersByRole, createUser, assignPromoterToSFOS, getUserById } from '../api/usersApi';
import { Role, CreateUserDto } from '../types/user';
import { toast } from 'react-hot-toast';

/**
 * Hook to fetch users with pagination and optional role filter
 */
export const useUsers = (page: number = 0, size: number = 20, role?: Role) => {
  return useQuery({
    queryKey: ['users', page, size, role],
    queryFn: () => getUsers(page, size, role),
    staleTime: 30000, // 30 seconds
  });
};

/**
 * Hook to fetch users by role
 */
export const useUsersByRole = (role: Role, page: number = 0, size: number = 20) => {
  return useQuery({
    queryKey: ['users', role, page, size],
    queryFn: () => getUsersByRole(role, page, size),
    staleTime: 30000,
  });
};

/**
 * Hook to fetch a single user by ID
 */
export const useUser = (id: number) => {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => getUserById(id),
    enabled: !!id,
  });
};

/**
 * Hook to create a new user
 */
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: CreateUserDto) => createUser(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
      toast.success('Utilisateur créé avec succès !');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Erreur lors de la création';
      toast.error(message);
    },
  });
};

/**
 * Hook to assign a promoter to an SFOS
 */
export const useAssignPromoterToSFOS = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ promoterId, sfosId }: { promoterId: number; sfosId: number }) =>
      assignPromoterToSFOS(promoterId, sfosId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Promoter assigné avec succès !');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Erreur lors de l\'assignation';
      toast.error(message);
    },
  });
};

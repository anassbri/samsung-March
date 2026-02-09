import api from '../services/api';
import { User, UserStats, CreateUserDto, UsersPageResponse, Role } from '../types/user';

/**
 * Get user statistics (counts by role)
 */
export const getUsersStats = async (): Promise<UserStats> => {
  const response = await api.get<UserStats>('/users/stats');
  return response.data;
};

/**
 * Get users with pagination and optional role filter
 */
export const getUsers = async (
  page: number = 0,
  size: number = 20,
  role?: Role
): Promise<UsersPageResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });
  
  if (role) {
    params.append('role', role);
  }
  
  const response = await api.get<UsersPageResponse>(`/users?${params.toString()}`);
  return response.data;
};

/**
 * Get users by role (convenience method)
 */
export const getUsersByRole = async (
  role: Role,
  page: number = 0,
  size: number = 20
): Promise<UsersPageResponse> => {
  return getUsers(page, size, role);
};

/**
 * Get user by ID
 */
export const getUserById = async (id: number): Promise<User> => {
  const response = await api.get<User>(`/users/${id}`);
  return response.data;
};

/**
 * Create a new user
 */
export const createUser = async (userData: CreateUserDto): Promise<User> => {
  const response = await api.post<User>('/users', userData);
  return response.data;
};

/**
 * Assign a promoter to an SFOS manager
 */
export const assignPromoterToSFOS = async (
  promoterId: number,
  sfosId: number
): Promise<User> => {
  const response = await api.put<User>(`/users/${promoterId}/assign/${sfosId}`);
  return response.data;
};

/**
 * Bulk import users from CSV
 */
export const importUsersBulk = async (users: CreateUserDto[]): Promise<User[]> => {
  const response = await api.post<User[]>('/users/bulk', users);
  return response.data;
};

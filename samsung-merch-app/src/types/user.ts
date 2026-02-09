export enum Role {
  PROMOTER = 'PROMOTER',
  SFOS = 'SFOS',
  SUPERVISOR = 'SUPERVISOR',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  region: string | null;
  managerId: number | null;
  managerName: string | null;
  subordinatesCount: number;
}

export interface UserStats {
  sfos: number;
  promoters: number;
  supervisors: number;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role: Role;
  region: string;
  sfosId?: number; // Required if role is PROMOTER
}

export interface UsersPageResponse {
  content: User[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

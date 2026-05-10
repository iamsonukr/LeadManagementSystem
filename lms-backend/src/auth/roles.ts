import { Types } from 'mongoose';
export const ROLES = {
  ADMIN: 'Admin',
  MANAGER: 'Sales Manager',
  SALES_EXECUTIVE: 'Sales Executive',
} as const;

export type AppRole = (typeof ROLES)[keyof typeof ROLES];

export interface RequestUser {
  id: string;
  email: string;
  role: AppRole | string;
  name?: string;
}

export const isAdmin = (user: RequestUser) => user.role === ROLES.ADMIN;

export const isManager = (user: RequestUser) => user.role === ROLES.MANAGER;

export const isSalesExecutive = (user: RequestUser) =>
  user.role === ROLES.SALES_EXECUTIVE;

export const userAssignmentKeys = (user: RequestUser) =>
  [user.id, user.email, user.name].filter(Boolean) as string[];

export const userAssignmentIds = (user: RequestUser) =>
  [new Types.ObjectId(user.id)];

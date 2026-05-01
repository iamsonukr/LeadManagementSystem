import apiClient from './apiClient';

export interface LoginPayload { email: string; password: string; }
export interface RegisterPayload { name: string; email: string; password: string; role?: string; department?: string; }

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'sales_executive';
  department: string;
  isActive: boolean;
  createdAt: string;
}

export interface AuthResponse { user: AuthUser; access_token: string; }

const authService = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const { data } = await apiClient.post('/auth/login', payload);
    return data.data;
  },
  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const { data } = await apiClient.post('/users', payload);
    return data.data;
  },
  logout: async (): Promise<void> => {},
  refresh: async (): Promise<{ accessToken: string }> => {
    throw new Error('Refresh endpoint is not available');
  },
  getMe: async (): Promise<AuthUser> => {
    const { data } = await apiClient.get('/auth/me');
    return data.data;
  },
  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiClient.patch('/users/me/password', { currentPassword, newPassword });
  },
};

export default authService;

import apiClient from './apiClient';

export interface LoginPayload { email: string; password: string; }
export interface RegisterPayload { name: string; email: string; password: string; role?: string; department?: string; }

export interface AuthUser {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: 'Admin' | 'Sales Manager' | 'Sales Executive';
  department?: string | null;
  phone?: string | null;
  status?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface AuthResponse { user: AuthUser; access_token: string; }

const toRegisterApiPayload = (payload: RegisterPayload) => {
  const [firstName = '', ...lastNameParts] = payload.name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return {
    firstName,
    lastName: lastNameParts.join(' ') || firstName,
    email: payload.email,
    password: payload.password,
    role: payload.role,
    department: payload.department,
  };
};

const authService = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const { data } = await apiClient.post('/auth/login', payload);
    return data.data;
  },
  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const { data } = await apiClient.post('/users', toRegisterApiPayload(payload));
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

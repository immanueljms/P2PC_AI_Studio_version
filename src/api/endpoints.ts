import client from './client';
import { User, HostProfile, GameSession } from '../types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export const authApi = {
  login: (credentials: any) => 
    client.post<ApiResponse<any>>('/api/login', credentials),
    
  register: (userData: any) => 
    client.post<ApiResponse<any>>('/api/register', userData),
    
  getMe: () => 
    client.get<ApiResponse<User>>('/api/me'),
};

export const hostApi = {
  getProfile: () => 
    client.get<ApiResponse<HostProfile>>('/api/host/profile'),
    
  updateProfile: (profile: any) => 
    client.post<ApiResponse<any>>('/api/host/profile', profile),
    
  getHosts: (game?: string) => 
    client.get<ApiResponse<HostProfile[]>>(`/api/hosts${game ? `?game=${encodeURIComponent(game)}` : ''}`),
};

export const sessionApi = {
  getAciveSession: () => 
    client.get<ApiResponse<GameSession | null>>('/api/sessions/active'),
    
  getHistory: () => 
    client.get<ApiResponse<GameSession[]>>('/api/sessions/history'),
    
  book: (data: { host_id: number; game_name: string }) => 
    client.post<ApiResponse<GameSession>>('/api/sessions/book', data),
    
  complete: (sessionId: number) => 
    client.post<ApiResponse<any>>(`/api/sessions/${sessionId}/complete`),
};

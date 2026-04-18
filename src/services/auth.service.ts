import api from '@/lib/axios'
import type { ApiResponse, LoginInput, RegisterInput, User } from '@/types/api'

export const authService = {
  login: async (data: LoginInput): Promise<User> => {
    const res = await api.post<ApiResponse<User>>('/auth/login', data)
    return res.data.data
  },

  register: async (data: RegisterInput): Promise<User> => {
    const res = await api.post<ApiResponse<User>>('/auth/register', data)
    return res.data.data
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout')
  },

  me: async (): Promise<User> => {
    const res = await api.get<ApiResponse<User>>('/auth/me')
    return res.data.data
  },
}

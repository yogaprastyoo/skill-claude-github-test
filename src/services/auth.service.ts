import api from '@/lib/axios'
import type { ApiResponse, AuthPayload, LoginInput, RegisterInput, User } from '@/types/api'

export const authService = {
  login: async (data: LoginInput): Promise<AuthPayload> => {
    const res = await api.post<ApiResponse<AuthPayload>>('/auth/login', data)
    return res.data.data
  },

  register: async (data: RegisterInput): Promise<AuthPayload> => {
    const res = await api.post<ApiResponse<AuthPayload>>('/auth/register', data)
    return res.data.data
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout')
  },

  me: async (): Promise<User> => {
    const res = await api.get<ApiResponse<User>>('/user')
    return res.data.data
  },
}

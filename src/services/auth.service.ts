import api, { getCsrfCookie } from '@/lib/axios'
import type { ApiResponse, LoginInput, RegisterInput, User } from '@/types/api'

export const authService = {
  login: async (data: LoginInput): Promise<void> => {
    await getCsrfCookie()
    await api.post<ApiResponse<null>>('/auth/login', data)
  },

  register: async (data: RegisterInput): Promise<User> => {
    await getCsrfCookie()
    const res = await api.post<ApiResponse<User>>('/auth/register', data)
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

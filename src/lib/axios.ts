import axios from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000'

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isPublicRoute = ['/login', '/register'].some((route) =>
      window.location.pathname.startsWith(route)
    )
    if (error.response?.status === 401 && !isPublicRoute) {
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const getCsrfCookie = () =>
  axios.get(`${BASE_URL}/sanctum/csrf-cookie`, { withCredentials: true })

export default api

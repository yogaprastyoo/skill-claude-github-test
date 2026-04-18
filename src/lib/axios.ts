import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
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

export default api

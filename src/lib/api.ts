// PARITY: este archivo se mantiene en paridad con su gemelo en el otro SPA.
// Diferencia permitida y normalizada por el script: basename en el redirect post-401
// (/prisier-admin/login vs /prisier-client/login). Corre scripts/check-parity.sh tras editar.
import axios from 'axios'
import mockApi, { type ApiClient } from '../mocks/mockApi'

const USE_MOCK = import.meta.env.VITE_MOCK_MODE === 'true'

const realApi = axios.create({
  baseURL: 'http://localhost:5001/api',
  headers: { 'Content-Type': 'application/json' },
})

realApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Mutex para evitar múltiples refresh simultáneos
let isRefreshing = false
let pendingRequests: Array<(token: string) => void> = []

function onRefreshed(token: string) {
  pendingRequests.forEach(cb => cb(token))
  pendingRequests = []
}

realApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      // Si ya hay un refresh en curso, encolar esta petición
      if (isRefreshing) {
        return new Promise((resolve) => {
          pendingRequests.push((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(realApi(originalRequest))
          })
        })
      }

      isRefreshing = true
      try {
        const accessToken = localStorage.getItem('access_token')
        const refreshToken = localStorage.getItem('refresh_token')
        const { data } = await axios.post('http://localhost:5001/api/auth/refresh', {
          accessToken,
          refreshToken,
        })
        localStorage.setItem('access_token', data.accessToken)
        localStorage.setItem('refresh_token', data.refreshToken)
        isRefreshing = false
        onRefreshed(data.accessToken)
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
        return realApi(originalRequest)
      } catch {
        isRefreshing = false
        pendingRequests = []
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/prisier-client/login'
      }
    }
    return Promise.reject(error)
  }
)

const api: ApiClient = USE_MOCK ? mockApi : realApi as unknown as ApiClient

export default api

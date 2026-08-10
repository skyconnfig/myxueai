import axios, { type AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios'
import { getStoredToken } from '@/api/auth'
import type { ApiErrorResponse, ApiResponse } from '@/types'

const http: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

http.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    const message =
      error.response?.data?.error?.message ??
      error.message ??
      'Network request failed'

    return Promise.reject(new Error(message))
  },
)

export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await http.request<ApiResponse<T>>(config)
  return response.data.data
}

export default http

import { request } from './http'
import type { AuthTokenResponse, AuthUser } from '@xueai/shared'

const TOKEN_KEY = 'xueai_token'

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export async function login(email: string, password: string): Promise<AuthTokenResponse> {
  const data = await request<AuthTokenResponse>({
    method: 'POST',
    url: '/auth/login',
    data: { email, password },
  })
  setStoredToken(data.token)
  return data
}

export async function register(email: string, password: string, name?: string): Promise<AuthTokenResponse> {
  const data = await request<AuthTokenResponse>({
    method: 'POST',
    url: '/auth/register',
    data: { email, password, name },
  })
  setStoredToken(data.token)
  return data
}

export async function fetchMe(): Promise<AuthUser | null> {
  const user = await request<AuthUser | null>({ method: 'GET', url: '/auth/me' })
  return user
}

export async function updateProfile(data: { name?: string; avatar?: string | null }) {
  return request<AuthUser>({
    method: 'PATCH',
    url: '/auth/profile',
    data,
  })
}

export function logout() {
  setStoredToken(null)
}

export interface AuthUser {
  id: string
  email: string
  name: string | null
  avatar: string | null
  credits: number
}

export interface AuthTokenResponse {
  token: string
  user: AuthUser
}

import bcrypt from 'bcryptjs'
import jwt, { type SignOptions } from 'jsonwebtoken'
import type { AuthUser } from '@xueai/shared'
import { prisma } from '../../config/database.js'
import { config } from '../../config/index.js'
import { AppError } from '../../middleware/error-handler.js'
import type { LoginInput, RegisterInput, UpdateProfileInput } from './auth.types.js'

function toAuthUser(user: {
  id: string
  email: string
  name: string | null
  avatar: string | null
  credits: number
}): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    credits: user.credits,
  }
}

function signToken(userId: string) {
  const options: SignOptions = { expiresIn: config.jwt.expiresIn as SignOptions['expiresIn'] }
  return jwt.sign({ sub: userId }, config.jwt.secret, options)
}

export class AuthService {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } })
    if (existing) {
      throw new AppError(409, 'EMAIL_EXISTS', '该邮箱已注册')
    }

    const passwordHash = await bcrypt.hash(input.password, 10)
    const user = await prisma.user.create({
      data: {
        email: input.email,
        password: passwordHash,
        name: input.name ?? input.email.split('@')[0],
        credits: config.workspace.defaultCredits,
      },
    })

    return { token: signToken(user.id), user: toAuthUser(user) }
  }

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } })
    if (!user) {
      throw new AppError(401, 'INVALID_CREDENTIALS', '邮箱或密码错误')
    }

    const valid = await bcrypt.compare(input.password, user.password)
    if (!valid) {
      throw new AppError(401, 'INVALID_CREDENTIALS', '邮箱或密码错误')
    }

    return { token: signToken(user.id), user: toAuthUser(user) }
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new AppError(404, 'USER_NOT_FOUND', '用户不存在')
    return toAuthUser(user)
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.avatar !== undefined ? { avatar: input.avatar } : {}),
      },
    })
    return toAuthUser(user)
  }

  async getDemoUser() {
    const passwordHash = await bcrypt.hash('demo123456', 10)
    return prisma.user.upsert({
      where: { email: config.demoUserEmail },
      update: { password: passwordHash },
      create: {
        email: config.demoUserEmail,
        password: passwordHash,
        name: 'Demo User',
        credits: config.workspace.defaultCredits,
      },
    })
  }

  verifyToken(token: string): string {
    try {
      const payload = jwt.verify(token, config.jwt.secret) as { sub?: string }
      if (!payload.sub) throw new AppError(401, 'INVALID_TOKEN', '无效的登录凭证')
      return payload.sub
    } catch {
      throw new AppError(401, 'INVALID_TOKEN', '登录已过期，请重新登录')
    }
  }
}

export const authService = new AuthService()

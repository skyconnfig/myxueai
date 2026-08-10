import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email('请输入有效邮箱'),
  password: z.string().min(6, '密码至少 6 位'),
  name: z.string().min(1).max(50).optional(),
})

export const loginSchema = z.object({
  email: z.string().email('请输入有效邮箱'),
  password: z.string().min(1, '请输入密码'),
})

export const updateProfileSchema = z.object({
  name: z.string().min(1, '昵称不能为空').max(50).optional(),
  avatar: z.string().url('头像必须是有效 URL').nullable().optional(),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

import { prisma } from '../../config/database.js'
import { AppError } from '../../middleware/error-handler.js'
import { authService } from '../auth/auth.service.js'

export class CreditsService {
  private async resolveUser(userId?: string) {
    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (user) return user
    }
    return authService.getDemoUser()
  }

  async getBalance(userId?: string) {
    const user = await this.resolveUser(userId)
    return user.credits
  }

  async deduct(amount: number, reason: string, userId?: string) {
    if (amount <= 0) {
      const balance = await this.getBalance(userId)
      return { balance, deducted: 0, reason }
    }
    const user = await this.resolveUser(userId)
    if (user.credits < amount) {
      throw new AppError(402, 'INSUFFICIENT_CREDITS', `AI 点数不足，需要 ${amount} 点，当前 ${user.credits} 点`)
    }
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { credits: { decrement: amount } },
    })
    return { balance: updated.credits, deducted: amount, reason }
  }
}

export const creditsService = new CreditsService()

import { Router } from 'express'
import { optionalAuth } from '../../middleware/auth.js'
import { authController } from './auth.controller.js'

const router = Router()

router.post('/register', ...authController.register)
router.post('/login', ...authController.login)
router.get('/me', optionalAuth, authController.me)
router.patch('/profile', ...authController.updateProfile)

export default router

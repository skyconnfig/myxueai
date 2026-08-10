import { Router } from 'express'
import { sendSuccess } from '../../utils/response.js'

const router = Router()

router.get('/', (_req, res) => {
  return sendSuccess(res, null, 'Video module ready — script & scene APIs pending')
})

export default router

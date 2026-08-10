import { Router } from 'express'
import { assetController } from './asset.controller.js'

const router = Router()

router.get('/', ...assetController.list)
router.get('/:id', assetController.getById)
router.post('/upload', ...assetController.upload)
router.delete('/:id', assetController.remove)

export default router

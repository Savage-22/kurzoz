import { Router } from 'express'
import multer from 'multer'
import AvanceController from './avance.Controller.js'

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

const router = Router()

router.post('/:id/avance', upload.single('pdf'), AvanceController.upload)
router.post('/:id/avance/preview', upload.single('pdf'), AvanceController.preview)

export default router

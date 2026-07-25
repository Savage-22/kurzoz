import { Router } from 'express'
import multer from 'multer'
import HistorialController from './historial.Controller.js'
import { authenticate, authorizeStudentAccess } from '../../auth/middleware/auth.middleware.js'

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

const router = Router()

router.use('/:id/*', authenticate, authorizeStudentAccess)
router.use('/:id', authenticate, authorizeStudentAccess)

router.post('/:id/historial', upload.single('pdf'), HistorialController.upload)
router.post('/:id/historial/preview', upload.single('pdf'), HistorialController.preview)

export default router

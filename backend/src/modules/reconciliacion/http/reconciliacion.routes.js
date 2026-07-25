import { Router } from 'express'
import ReconciliacionController from './reconciliacion.Controller.js'
import { authenticate, authorizeStudentAccess } from '../../auth/middleware/auth.middleware.js'

// Colgada de /students/:id junto con las rutas del motor.
const router = Router()

router.use('/:id/*', authenticate, authorizeStudentAccess)
router.use('/:id', authenticate, authorizeStudentAccess)

router.get('/:id/discrepancies', ReconciliacionController.discrepancies)

export default router

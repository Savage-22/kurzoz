import { Router } from 'express'
import AsistenteController from './asistente.Controller.js'
import { validateExplainBody } from './asistente.validation.js'
import { authenticate, authorizeStudentAccess } from '../../auth/middleware/auth.middleware.js'

// Rutas del asistente colgadas de /students/:id.
const router = Router()

router.use('/:id/*', authenticate, authorizeStudentAccess)
router.use('/:id', authenticate, authorizeStudentAccess)

router.post('/:id/plans/explain', validateExplainBody, AsistenteController.explain)

export default router

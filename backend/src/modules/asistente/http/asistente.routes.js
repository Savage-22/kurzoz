import { Router } from 'express'
import AsistenteController from './asistente.Controller.js'
import { validateExplainBody } from './asistente.validation.js'

// Rutas del asistente colgadas de /students/:id.
const router = Router()

router.post('/:id/plans/explain', validateExplainBody, AsistenteController.explain)

export default router

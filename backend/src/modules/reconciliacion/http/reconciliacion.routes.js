import { Router } from 'express'
import ReconciliacionController from './reconciliacion.Controller.js'

// Colgada de /students/:id junto con las rutas del motor.
const router = Router()

router.get('/:id/discrepancies', ReconciliacionController.discrepancies)

export default router

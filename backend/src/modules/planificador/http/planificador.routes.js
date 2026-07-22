import { Router } from 'express'
import PlanificadorController from './planificador.Controller.js'
import { validateInstitucional } from './planificador.validation.js'

// Rutas del planificador institucional (base /planificador).
const router = Router()

router.post('/institucional', validateInstitucional, PlanificadorController.institucional)

export default router

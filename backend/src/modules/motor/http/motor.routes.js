import { Router } from 'express'
import MotorController from './motor.Controller.js'
import { validateAdjustmentBody, validateScheduleBody } from './motor.validation.js'

// Rutas del motor colgadas de /students/:id.
const router = Router()

router.get('/:id/remaining', MotorController.remaining)
router.get('/:id/eligible', MotorController.eligible)
router.get('/:id/graph', MotorController.graph)
router.post('/:id/schedules', validateScheduleBody, MotorController.schedules)
router.post('/:id/adjustments', validateAdjustmentBody, MotorController.adjustments)

export default router

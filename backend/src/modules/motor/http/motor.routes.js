import { Router } from 'express'
import MotorController from './motor.Controller.js'
import { validateAdjustmentBody, validateScheduleBody } from './motor.validation.js'
import { authenticate, authorizeStudentAccess } from '../../auth/middleware/auth.middleware.js'

// Rutas del motor colgadas de /students/:id.
const router = Router()

router.use('/:id/*', authenticate, authorizeStudentAccess)
router.use('/:id', authenticate, authorizeStudentAccess)

router.get('/:id/remaining', MotorController.remaining)
router.get('/:id/eligible', MotorController.eligible)
router.get('/:id/graph', MotorController.graph)
router.patch('/:id/courses/:code/status', MotorController.markCourseStatus)
router.post('/:id/schedules', validateScheduleBody, MotorController.schedules)
router.post('/:id/adjustments', validateAdjustmentBody, MotorController.adjustments)
router.post('/:id/adjustments/solicitud', validateAdjustmentBody, MotorController.solicitudAjustes)

export default router

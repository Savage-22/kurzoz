import { Router } from 'express'
import DisponibilidadController from './disponibilidad.Controller.js'
import { validateCreate, validateUpdate } from './disponibilidad.validation.js'

// Rutas de disponibilidad docente (base /disponibilidad).
const router = Router()

router.get('/docentes', DisponibilidadController.listTeachers)
router.get('/', DisponibilidadController.listByTeacher)
router.post('/', validateCreate, DisponibilidadController.create)
router.put('/:id', validateUpdate, DisponibilidadController.update)
router.delete('/:id', DisponibilidadController.deactivate)

export default router

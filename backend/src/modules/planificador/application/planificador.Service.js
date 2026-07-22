// Orquesta el optimizador institucional: carga la oferta del término, los
// ciclos de los cursos y la disponibilidad docente, y llama a la lógica pura.
import { NotFoundError } from '../../../shared/errors.js'
import MotorRepository from '../../motor/infrastructure/motor.Repository.js'
import DisponibilidadModel from '../../disponibilidad/infrastructure/disponibilidad.Model.js'
import { optimizeInstitutional } from './institucional.js'

class PlanificadorService {
    static async optimizarInstitucional(termCode, { weights } = {}) {
        const term = await MotorRepository.getTerm(termCode)
        if (!term) throw new NotFoundError(`Término ${termCode} no existe`)

        const [courses, offerings, availability] = await Promise.all([
            MotorRepository.getCourses(),
            MotorRepository.getOfferings(term.id),
            DisponibilidadModel.listAll(),
        ])
        const courseCycle = new Map(courses.map((c) => [c.code, c.cycleNumber]))
        return optimizeInstitutional({ offerings, availability, courseCycle }, weights)
    }
}

export default PlanificadorService

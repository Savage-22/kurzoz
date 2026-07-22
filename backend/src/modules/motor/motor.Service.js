// Orquesta el motor de planificación: carga datos con el repositorio y los pasa
// a la lógica pura (application). Las funciones puras no tocan la base; este
// servicio es el único que la consulta.
import MotorRepository from './infrastructure/motor.Repository.js'
import { computeRemaining } from './application/remaining.js'
import { validateEligibility } from './application/eligibility.js'

class MotorService {
    // #7 · Cursos que le faltan al alumno para egresar.
    static async computeRemaining(studentId) {
        const [courses, studentStatus, equivalences] = await Promise.all([
            MotorRepository.getCourses(),
            MotorRepository.getStudentStatus(studentId),
            MotorRepository.getEquivalences(),
        ])
        return computeRemaining({ courses, studentStatus, equivalences })
    }

    // #8 · De los faltantes, cuáles son cursables en el término.
    static async validateEligibility(studentId, termCode, options = {}) {
        const term = await MotorRepository.getTerm(termCode)
        if (!term) throw new Error(`Término ${termCode} no existe`)

        const [{ remaining }, studentStatus, prerequisites, offerings] = await Promise.all([
            MotorService.computeRemaining(studentId),
            MotorRepository.getStudentStatus(studentId),
            MotorRepository.getPrerequisites(),
            MotorRepository.getOfferings(term.id),
        ])
        return validateEligibility({ remaining, studentStatus, prerequisites, term, offerings }, options)
    }
}

export default MotorService

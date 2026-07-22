// Orquesta el motor de planificación: carga datos con el repositorio y los pasa
// a la lógica pura (application). Las funciones puras no tocan la base; este
// servicio es el único que la consulta.
import MotorRepository from './infrastructure/motor.Repository.js'
import { computeRemaining } from './application/remaining.js'

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
}

export default MotorService

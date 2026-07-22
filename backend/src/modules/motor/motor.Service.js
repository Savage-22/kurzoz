// Orquesta el motor de planificación: carga datos con el repositorio y los pasa
// a la lógica pura (application). Las funciones puras no tocan la base; este
// servicio es el único que la consulta.
import { NotFoundError } from '../../shared/errors.js'
import MotorRepository from './infrastructure/motor.Repository.js'
import { computeRemaining } from './application/remaining.js'
import { validateEligibility } from './application/eligibility.js'
import { generateSchedules } from './application/schedules.js'
import { rankPlans } from './application/ranking.js'
import { computeCoursePriorities } from './application/coursePriority.js'
import { recommendAdjustments } from './application/adjustments.js'

// Agrupa secciones ofertadas por código de curso.
const groupSectionsByCourse = (offerings) => {
    const byCourse = new Map()
    for (const section of offerings) {
        if (!byCourse.has(section.courseCode)) byCourse.set(section.courseCode, [])
        byCourse.get(section.courseCode).push(section)
    }
    return byCourse
}

class MotorService {
    // #7 · Cursos que le faltan al alumno para egresar.
    static async computeRemaining(studentId) {
        if (!(await MotorRepository.studentExists(studentId))) {
            throw new NotFoundError(`El alumno ${studentId} no existe`)
        }
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
        if (!term) throw new NotFoundError(`Término ${termCode} no existe`)

        const [{ remaining }, studentStatus, prerequisites, offerings] = await Promise.all([
            MotorService.computeRemaining(studentId),
            MotorRepository.getStudentStatus(studentId),
            MotorRepository.getPrerequisites(),
            MotorRepository.getOfferings(term.id),
        ])
        return validateEligibility({ remaining, studentStatus, prerequisites, term, offerings }, options)
    }

    // #10 · Horarios válidos (sin choques) que maximizan cursos dentro del tope,
    // conservando también planes de casi-máxima cantidad con cursos estratégicos.
    static async generateSchedules(studentId, termCode, { maxCredits = 24, chainInProgress = false, maxResults = 12, slack = 1 } = {}) {
        const term = await MotorRepository.getTerm(termCode)
        if (!term) throw new NotFoundError(`Término ${termCode} no existe`)

        const [{ remaining }, studentStatus, courses, prerequisites, offerings] = await Promise.all([
            MotorService.computeRemaining(studentId),
            MotorRepository.getStudentStatus(studentId),
            MotorRepository.getCourses(),
            MotorRepository.getPrerequisites(),
            MotorRepository.getOfferings(term.id),
        ])
        const { eligible } = validateEligibility(
            { remaining, studentStatus, prerequisites, term, offerings },
            { chainInProgress },
        )
        const sectionsByCourse = groupSectionsByCourse(offerings)
        const priorityByCourse = computeCoursePriorities({ courses, prerequisites, term })
        const result = generateSchedules({ eligible, sectionsByCourse, maxCredits, priorityByCourse }, { maxResults, slack })
        return { ...result, priorityByCourse }
    }

    // #11 · Genera horarios y los ordena por objetivos (pesos configurables).
    static async generateRankedPlans(studentId, termCode, options = {}) {
        const { schedules, priorityByCourse, ...meta } = await MotorService.generateSchedules(studentId, termCode, options)
        const ranked = rankPlans(schedules, { weights: options.weights, priorityByCourse })
        return { plans: ranked, ...meta }
    }

    // #12 · Propone ajustes mínimos (mover bloque / abrir grupo) que permiten
    // llevar más cursos. No modifica la oferta oficial; son sugerencias.
    static async recommendAdjustments(studentId, termCode, { desiredCourses = null, hostCycle = null, maxCredits = 24, chainInProgress = true, maxShiftSlots = 6 } = {}) {
        const term = await MotorRepository.getTerm(termCode)
        if (!term) throw new NotFoundError(`Término ${termCode} no existe`)

        const [{ remaining }, studentStatus, prerequisites, offerings] = await Promise.all([
            MotorService.computeRemaining(studentId),
            MotorRepository.getStudentStatus(studentId),
            MotorRepository.getPrerequisites(),
            MotorRepository.getOfferings(term.id),
        ])
        const { eligible } = validateEligibility(
            { remaining, studentStatus, prerequisites, term, offerings },
            { chainInProgress },
        )
        const sectionsByCourse = groupSectionsByCourse(offerings)
        return recommendAdjustments({ eligible, sectionsByCourse, maxCredits, maxShiftSlots }, { desiredCourses, hostCycle })
    }
}

export default MotorService

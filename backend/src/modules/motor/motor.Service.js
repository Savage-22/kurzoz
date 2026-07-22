// Orquesta el motor de planificación: carga datos con el repositorio y los pasa
// a la lógica pura (application). Las funciones puras no tocan la base; este
// servicio es el único que la consulta.
import MotorRepository from './infrastructure/motor.Repository.js'
import { computeRemaining } from './application/remaining.js'
import { validateEligibility } from './application/eligibility.js'
import { generateSchedules } from './application/schedules.js'
import { buildUnlockIndex, rankPlans } from './application/ranking.js'

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

    // #10 · Horarios válidos (sin choques) que maximizan cursos dentro del tope.
    static async generateSchedules(studentId, termCode, { maxCredits = 24, chainInProgress = false, maxResults = 10 } = {}) {
        const term = await MotorRepository.getTerm(termCode)
        if (!term) throw new Error(`Término ${termCode} no existe`)

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
        return generateSchedules({ eligible, sectionsByCourse, maxCredits }, { maxResults })
    }

    // #11 · Genera horarios y los ordena por objetivos (pesos configurables).
    static async generateRankedPlans(studentId, termCode, options = {}) {
        const { schedules, ...meta } = await MotorService.generateSchedules(studentId, termCode, options)
        const prerequisites = await MotorRepository.getPrerequisites()
        const unlockByCourse = buildUnlockIndex(prerequisites)
        const ranked = rankPlans(schedules, { weights: options.weights, unlockByCourse })
        return { plans: ranked, ...meta }
    }
}

export default MotorService

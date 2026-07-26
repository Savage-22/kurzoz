// Controllers del motor: orquestan (leen params/body, llaman al service, arman
// el sobre) y delegan errores con next(). Sin lógica de negocio.
import MotorService from '../motor.Service.js'
import { formatSolicitud } from '../application/adjustments.js'
import pool from '../../../shared/db/pool.js'

const DEFAULT_TERM = '2026-II'

class MotorController {
    // #7 · GET /students/:id/remaining
    static async remaining(req, res, next) {
        try {
            const data = await MotorService.computeRemaining(req.params.id)
            res.status(200).json({ success: true, message: 'Cursos faltantes calculados', data })
        } catch (error) {
            next(error)
        }
    }

    // #8 · GET /students/:id/eligible?term=2026-II&chain=true
    static async eligible(req, res, next) {
        try {
            const term = req.query.term || DEFAULT_TERM
            const options = { chainInProgress: req.query.chain === 'true' }
            const data = await MotorService.validateEligibility(req.params.id, term, options)
            res.status(200).json({ success: true, message: 'Cursos elegibles evaluados', data })
        } catch (error) {
            next(error)
        }
    }

    // #36 · GET /students/:id/graph?term=2026-II
    static async graph(req, res, next) {
        try {
            const term = req.query.term || DEFAULT_TERM
            const data = await MotorService.getGraph(req.params.id, term)
            res.status(200).json({ success: true, message: 'Grafo de prerrequisitos generado', data })
        } catch (error) {
            next(error)
        }
    }

    // PATCH /students/:id/courses/:code/status
    static async markCourseStatus(req, res, next) {
        try {
            const { id: studentId, code } = req.params
            const { status } = req.body
            if (!['APROBADO', 'EN_CURSO', 'PENDIENTE'].includes(status)) {
                return res.status(400).json({ success: false, message: 'Estado inválido' })
            }
            await pool.query(
                `INSERT INTO student_course (student_id, course_code, status, grade, modality)
                 VALUES ($1, $2, $3, NULL, NULL)
                 ON CONFLICT (student_id, course_code)
                 DO UPDATE SET status = EXCLUDED.status, grade = EXCLUDED.grade`,
                [studentId, code, status],
            )
            res.status(200).json({ success: true, message: `Curso ${code} marcado como ${status}` })
        } catch (error) {
            next(error)
        }
    }

    // #10 + #11 · POST /students/:id/schedules
    static async schedules(req, res, next) {
        try {
            const { term = DEFAULT_TERM, ...options } = req.body ?? {}
            const data = await MotorService.generateRankedPlans(req.params.id, term, options)
            res.status(200).json({ success: true, message: 'Horarios generados y rankeados', data })
        } catch (error) {
            next(error)
        }
    }

    // #12 + #39 · POST /students/:id/adjustments
    static async adjustments(req, res, next) {
        try {
            const { term = DEFAULT_TERM, ...options } = req.body ?? {}
            const data = await MotorService.recommendAdjustments(req.params.id, term, options)
            res.status(200).json({ success: true, message: 'Recomendaciones de ajuste generadas', data })
        } catch (error) {
            next(error)
        }
    }

    // #39 · POST /students/:id/adjustments/solicitud
    static async solicitudAjustes(req, res, next) {
        try {
            const { term = DEFAULT_TERM, studentName, ...options } = req.body ?? {}
            const data = await MotorService.recommendAdjustments(req.params.id, term, options)
            const solicitud = formatSolicitud(data, { studentName, termCode: term })
            res.status(200).json({ success: true, message: 'Solicitud de ajustes generada', data: solicitud })
        } catch (error) {
            next(error)
        }
    }
}

export default MotorController

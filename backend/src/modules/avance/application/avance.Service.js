// Importa el avance curricular de un alumno (PDF) a student_course. El avance
// es la fuente de verdad del estado académico. Idempotente: re-importar
// actualiza sin duplicar. No aborta ante inconsistencias; las reporta.
import pool from '../../../shared/db/pool.js'
import { readAvanceRows } from '../infrastructure/avance.PdfReader.js'
import AvanceModel from '../infrastructure/avance.Model.js'
import { parseAvance } from './avance.parser.js'

class AvanceService {
    // Lee y normaliza el avance SIN tocar la base de datos.
    static async buildFromPdf(filePath) {
        const rows = await readAvanceRows(filePath)
        return parseAvance(rows)
    }

    // Importa el avance a la base para un alumno.
    // inProgress: códigos que el alumno cursa ahora (2026-I) y que en el avance
    // figuran sin nota; se marcan EN_CURSO en vez de PENDIENTE.
    static async importFromPdf(filePath, { inProgress = [] } = {}) {
        const parsed = await AvanceService.buildFromPdf(filePath)
        const report = { warnings: [], skipped: [] }

        if (!parsed.student) {
            throw new Error('No se pudo identificar al alumno en el PDF (nombre y código).')
        }

        // Integridad: todo curso del avance debe existir en la malla cargada.
        const known = new Set((await pool.query('SELECT code FROM course')).rows.map((r) => r.code))
        const inProgressSet = new Set(inProgress)

        const courses = []
        let computedApprovedCredits = 0
        for (const course of parsed.courses) {
            if (!known.has(course.code)) {
                report.skipped.push(`Curso ${course.code} (${course.name}) no está en la malla; se omite`)
                continue
            }
            let status = course.status
            if (status === 'PENDIENTE' && inProgressSet.has(course.code)) status = 'EN_CURSO'
            if (status === 'APROBADO') computedApprovedCredits += course.credits

            courses.push({ code: course.code, status, grade: course.grade, modality: null })
        }

        // Verificación cruzada: los créditos aprobados calculados deben coincidir
        // con el resumen del PDF. Si no, se avisa pero no se detiene.
        const reported = parsed.approvedCreditsReported
        const creditsMatch = reported === null ? null : computedApprovedCredits === reported
        if (creditsMatch === false) {
            report.warnings.push(
                `Créditos aprobados calculados (${computedApprovedCredits}) ≠ resumen del PDF (${reported})`,
            )
        }

        await AvanceModel.withTransaction(async (client) => {
            await AvanceModel.upsertStudent(client, parsed.student)
            await AvanceModel.replaceStudentCourses(client, parsed.student.id, courses)
        })

        return {
            student: parsed.student,
            total: courses.length,
            approved: courses.filter((c) => c.status === 'APROBADO').length,
            inProgress: courses.filter((c) => c.status === 'EN_CURSO').length,
            pending: courses.filter((c) => c.status === 'PENDIENTE').length,
            computedApprovedCredits,
            reportedApprovedCredits: reported,
            creditsMatch,
            ...report,
        }
    }
}

export default AvanceService

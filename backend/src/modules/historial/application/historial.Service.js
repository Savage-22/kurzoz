// Importa el historial de notas de un alumno (PDF) a student_enrollment.
// El historial es más granular que el avance: incluye semestre, docente,
// modalidad y fecha por cada curso. Idempotente: re-importar reemplaza.
import pool from '../../../shared/db/pool.js'
import { readHistorialRows } from '../infrastructure/historial.PdfReader.js'
import HistorialModel from '../infrastructure/historial.Model.js'
import { parseHistorial } from './historial.parser.js'

class HistorialService {
    // Lee y normaliza el historial SIN tocar la base de datos.
    static async buildFromPdf(filePath) {
        const rows = await readHistorialRows(filePath)
        return parseHistorial(rows)
    }

    // Importa el historial a la base para un alumno.
    static async importFromPdf(filePath) {
        const parsed = await HistorialService.buildFromPdf(filePath)
        const report = { warnings: [], skipped: [] }

        if (!parsed.student) {
            throw new Error('No se pudo identificar al alumno en el PDF (nombre y código).')
        }

        // Integridad: todo curso del historial debe existir en la malla cargada.
        const known = new Set((await pool.query('SELECT code FROM course')).rows.map((r) => r.code))

        const enrollments = []
        for (const e of parsed.enrollments) {
            if (!known.has(e.code)) {
                report.skipped.push(`Curso ${e.code} (${e.name}) no está en la malla; se omite`)
                continue
            }
            enrollments.push(e)
        }

        await HistorialModel.withTransaction(async (client) => {
            await HistorialModel.upsertStudent(client, parsed.student)
            await HistorialModel.replaceEnrollments(client, parsed.student.id, enrollments)
            await HistorialModel.updateStudentCoursesFromEnrollments(client, parsed.student.id, enrollments)
        })

        // Estadísticas
        const semesters = [...new Set(enrollments.map((e) => e.semester))].sort()
        const totalCredits = enrollments.reduce((sum, e) => sum + (e.credits ?? 0), 0)
        const approvedCount = enrollments.filter((e) => e.grade !== null && e.grade >= 11).length
        const avgGrade = enrollments.filter((e) => e.grade !== null).length > 0
            ? Number((enrollments.filter((e) => e.grade !== null).reduce((sum, e) => sum + e.grade, 0) /
                enrollments.filter((e) => e.grade !== null).length).toFixed(2))
            : null

        return {
            student: parsed.student,
            total: enrollments.length,
            semesters,
            totalCredits,
            approved: approvedCount,
            avgGrade,
            ...report,
        }
    }
}

export default HistorialService

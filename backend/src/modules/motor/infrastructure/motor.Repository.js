// Acceso a datos del motor de planificación. Concentra todas las consultas y
// entrega estructuras planas para que la lógica del motor (application) sea
// pura y testeable sin base de datos.
import pool from '../../../shared/db/pool.js'

class MotorRepository {
    // Cursos activos de la malla, con paridad ya derivada.
    static async getCourses() {
        const { rows } = await pool.query(
            `SELECT code, name, credits, type, cycle_number AS "cycleNumber", cycle_parity AS "cycleParity"
             FROM course WHERE is_active = TRUE
             ORDER BY code`,
        )
        return rows
    }

    // Estado del alumno por curso: code -> { status, grade }.
    static async getStudentStatus(studentId) {
        const { rows } = await pool.query(
            'SELECT course_code AS code, status, grade FROM student_course WHERE student_id = $1',
            [studentId],
        )
        return rows
    }

    static async getEquivalences() {
        const { rows } = await pool.query('SELECT old_code AS "oldCode", new_code AS "newCode" FROM equivalence')
        return rows
    }

    static async getPrerequisites() {
        const { rows } = await pool.query(
            `SELECT course_code AS "courseCode", requires_code AS "requiresCode", kind, or_group AS "orGroup"
             FROM prerequisite`,
        )
        return rows
    }

    static async getTerm(termCode) {
        const { rows } = await pool.query('SELECT id, code, parity FROM term WHERE code = $1', [termCode])
        return rows[0] || null
    }

    // Oferta del término con secciones y sesiones anidadas.
    static async getOfferings(termId) {
        const { rows } = await pool.query(
            `SELECT o.id AS "offeringId", o.course_code AS "courseCode", o.teacher, o.ht, o.hp,
                    sec.id AS "sectionId", sec.group_label AS "groupLabel",
                    se.day, se.start_min AS "startMin", se.end_min AS "endMin", se.kind, se.pavilion, se.room
             FROM offering o
             JOIN section sec ON sec.offering_id = o.id
             LEFT JOIN session se ON se.section_id = sec.id
             WHERE o.term_id = $1 AND o.is_active = TRUE AND sec.is_active = TRUE
             ORDER BY o.course_code, sec.group_label, se.day, se.start_min`,
            [termId],
        )

        // Agrupa filas planas en secciones con sus sesiones.
        const sections = new Map()
        for (const r of rows) {
            if (!sections.has(r.sectionId)) {
                sections.set(r.sectionId, {
                    sectionId: r.sectionId,
                    courseCode: r.courseCode,
                    teacher: r.teacher,
                    groupLabel: r.groupLabel,
                    ht: r.ht,
                    hp: r.hp,
                    sessions: [],
                })
            }
            if (r.day !== null) {
                sections.get(r.sectionId).sessions.push({
                    day: r.day,
                    startMin: r.startMin,
                    endMin: r.endMin,
                    kind: r.kind,
                    pavilion: r.pavilion,
                    room: r.room,
                })
            }
        }
        return [...sections.values()]
    }
}

export default MotorRepository

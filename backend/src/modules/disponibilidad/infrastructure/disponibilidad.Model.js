// Acceso a datos de la disponibilidad docente. Sin lógica de negocio. Consultas
// parametrizadas y soft delete (is_active). El docente se referencia por nombre
// (offering.teacher).
import pool from '../../../shared/db/pool.js'

const SELECT_WINDOW = `id, teacher, day, start_min AS "startMin", end_min AS "endMin"`

class DisponibilidadModel {
    // Docentes reales, tomados de la oferta activa (no hardcodeados).
    static async listTeachers() {
        const { rows } = await pool.query(
            `SELECT DISTINCT teacher FROM offering
             WHERE is_active = TRUE AND teacher <> ''
             ORDER BY teacher`,
        )
        return rows.map((r) => r.teacher)
    }

    static async listByTeacher(teacher) {
        const { rows } = await pool.query(
            `SELECT ${SELECT_WINDOW} FROM teacher_availability
             WHERE teacher = $1 AND is_active = TRUE
             ORDER BY day, start_min`,
            [teacher],
        )
        return rows
    }

    static async findById(id) {
        const { rows } = await pool.query(
            `SELECT ${SELECT_WINDOW} FROM teacher_availability WHERE id = $1 AND is_active = TRUE`,
            [id],
        )
        return rows[0] || null
    }

    // Ventanas activas del docente que se solapan con [startMin, endMin) el mismo
    // día, excluyendo opcionalmente un id (para el update).
    static async findOverlapping(teacher, day, startMin, endMin, excludeId = null) {
        const { rows } = await pool.query(
            `SELECT id FROM teacher_availability
             WHERE teacher = $1 AND day = $2 AND is_active = TRUE
               AND start_min < $4 AND $3 < end_min
               AND ($5::int IS NULL OR id <> $5)`,
            [teacher, day, startMin, endMin, excludeId],
        )
        return rows
    }

    static async create({ teacher, day, startMin, endMin }) {
        const { rows } = await pool.query(
            `INSERT INTO teacher_availability (teacher, day, start_min, end_min)
             VALUES ($1, $2, $3, $4)
             RETURNING ${SELECT_WINDOW}`,
            [teacher, day, startMin, endMin],
        )
        return rows[0]
    }

    static async update(id, { day, startMin, endMin }) {
        const { rows } = await pool.query(
            `UPDATE teacher_availability SET day = $2, start_min = $3, end_min = $4
             WHERE id = $1 AND is_active = TRUE
             RETURNING ${SELECT_WINDOW}`,
            [id, day, startMin, endMin],
        )
        return rows[0] || null
    }

    static async deactivate(id) {
        const { rowCount } = await pool.query(
            'UPDATE teacher_availability SET is_active = FALSE WHERE id = $1 AND is_active = TRUE',
            [id],
        )
        return rowCount > 0
    }
}

export default DisponibilidadModel

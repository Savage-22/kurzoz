// Acceso a datos de cuentas de usuario.
import pool from '../../../shared/db/pool.js'

class AuthModel {
    static async findByStudentId(studentId) {
        const { rows } = await pool.query(
            `SELECT u.id, u.student_id, u.password_hash, u.role, u.is_active, u.created_at, s.name as student_name
             FROM user_account u
             JOIN student s ON s.id = u.student_id
             WHERE u.student_id = $1`,
            [studentId],
        )
        return rows[0]
    }

    static async findById(id) {
        const { rows } = await pool.query(
            `SELECT u.id, u.student_id, u.password_hash, u.role, u.is_active, u.created_at, s.name as student_name
             FROM user_account u
             JOIN student s ON s.id = u.student_id
             WHERE u.id = $1`,
            [id],
        )
        return rows[0]
    }

    static async create(studentId, passwordHash, role = 'STUDENT') {
        const { rows } = await pool.query(
            `INSERT INTO user_account (student_id, password_hash, role)
             VALUES ($1, $2, $3)
             RETURNING id, student_id, role, is_active, created_at`,
            [studentId, passwordHash, role],
        )
        return rows[0]
    }

    static async updatePassword(id, passwordHash) {
        await pool.query('UPDATE user_account SET password_hash = $1 WHERE id = $2', [passwordHash, id])
    }

    static async ensureStudentExists(studentId) {
        const { rows } = await pool.query('SELECT id FROM student WHERE id = $1', [studentId])
        if (rows.length === 0) {
            await pool.query('INSERT INTO student (id, name) VALUES ($1, $2)', [studentId, null])
        }
    }
}

export default AuthModel

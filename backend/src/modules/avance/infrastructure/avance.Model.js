// Acceso a datos del avance del alumno. Recibe filas ya normalizadas y las
// persiste dentro de la transacción que abre el servicio.
import pool from '../../../shared/db/pool.js'

// Placeholders "($1,$2),($3,$4)..." para insert multi-fila.
const buildValues = (rows, columnsPerRow) =>
    rows
        .map((_, rowIndex) => {
            const base = rowIndex * columnsPerRow
            const placeholders = Array.from({ length: columnsPerRow }, (_, c) => `$${base + c + 1}`)
            return `(${placeholders.join(', ')})`
        })
        .join(', ')

class AvanceModel {
    static async upsertStudent(client, student) {
        await client.query(
            `INSERT INTO student (id, name)
             VALUES ($1, $2)
             ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, is_active = TRUE`,
            [student.id, student.name],
        )
    }

    // Reemplazo total del avance del alumno: se vuelve a importar completo, así
    // que se rehace su estado sin dejar cursos huérfanos de una corrida anterior.
    static async replaceStudentCourses(client, studentId, courses) {
        await client.query('DELETE FROM student_course WHERE student_id = $1', [studentId])
        if (courses.length === 0) return
        const values = buildValues(courses, 5)
        const params = courses.flatMap((c) => [studentId, c.code, c.status, c.grade, c.modality])
        await client.query(
            `INSERT INTO student_course (student_id, course_code, status, grade, modality)
             VALUES ${values}`,
            params,
        )
    }

    static async withTransaction(steps) {
        const client = await pool.connect()
        try {
            await client.query('BEGIN')
            const result = await steps(client)
            await client.query('COMMIT')
            return result
        } catch (error) {
            await client.query('ROLLBACK')
            throw error
        } finally {
            client.release()
        }
    }
}

export default AvanceModel

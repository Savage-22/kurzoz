// Acceso a datos del historial de notas. Recibe filas ya normalizadas y las
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

class HistorialModel {
    static async upsertStudent(client, student) {
        await client.query(
            `INSERT INTO student (id, name)
             VALUES ($1, $2)
             ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, is_active = TRUE`,
            [student.id, student.name],
        )
    }

    // Reemplazo total del historial del alumno: se vuelve a importar completo.
    static async replaceEnrollments(client, studentId, enrollments) {
        await client.query('DELETE FROM student_enrollment WHERE student_id = $1', [studentId])
        if (enrollments.length === 0) return
        const values = buildValues(enrollments, 9)
        const params = enrollments.flatMap((e) => [
            studentId,
            e.code,
            e.semester,
            e.grade,
            e.gradeText,
            e.date,
            e.modality,
            e.professor,
            e.group,
        ])
        await client.query(
            `INSERT INTO student_enrollment (student_id, course_code, semester, grade, grade_text, date, modality, professor, group_label)
             VALUES ${values}`,
            params,
        )
    }

    // Normaliza modalidad del historial a los valores del CHECK de student_course
    static normalizeModality(modality) {
        if (!modality) return null
        const map = {
            'REGULAR': 'REGULAR',
            'CONVALIDACION': 'CONVALIDADO',
            'DIRIGIDO-MOVILIDAD': 'REGULAR',
            'CURSO DE VERANO': 'VACACIONAL',
            'CONVALIDACION POR PASANTIA': 'CONVALIDADO',
        }
        return map[modality] ?? null
    }

    // También actualiza student_course con los datos más recientes del historial.
    static async updateStudentCoursesFromEnrollments(client, studentId, enrollments) {
        // Tomar la nota más reciente por curso (basado en la fecha)
        const latestByCourse = new Map()
        for (const e of enrollments) {
            if (e.grade === null) continue
            const existing = latestByCourse.get(e.code)
            if (!existing || isLaterDate(e.date, existing.date)) {
                latestByCourse.set(e.code, e)
            }
        }

        // Eliminar registros existentes del alumno
        await client.query('DELETE FROM student_course WHERE student_id = $1', [studentId])

        if (latestByCourse.size === 0) return

        const courses = [...latestByCourse.values()].map((e) => ({
            code: e.code,
            status: e.grade >= 11 ? 'APROBADO' : 'PENDIENTE',
            grade: e.grade,
            modality: HistorialModel.normalizeModality(e.modality),
        }))

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

// Compara dos fechas DD/MM/YYYY
const isLaterDate = (dateA, dateB) => {
    if (!dateA) return false
    if (!dateB) return true
    const [dA, mA, yA] = dateA.split('/').map(Number)
    const [dB, mB, yB] = dateB.split('/').map(Number)
    if (yA !== yB) return yA > yB
    if (mA !== mB) return mA > mB
    return dA > dB
}

export default HistorialModel

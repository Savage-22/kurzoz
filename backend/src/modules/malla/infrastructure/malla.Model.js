// Acceso a datos de la malla. Sin lógica de negocio: recibe filas ya
// normalizadas y las persiste. Los métodos aceptan un client para correr
// dentro de la transacción que abre el servicio.
import pool from '../../../shared/db/pool.js'

// Construye placeholders "($1,$2),($3,$4)..." para un insert multi-fila.
const buildValues = (rows, columnsPerRow) =>
    rows
        .map((_, rowIndex) => {
            const base = rowIndex * columnsPerRow
            const placeholders = Array.from({ length: columnsPerRow }, (_, c) => `$${base + c + 1}`)
            return `(${placeholders.join(', ')})`
        })
        .join(', ')

class MallaModel {
    // Upsert de cursos: re-correr refresca datos sin borrar (otras tablas los referencian).
    static async upsertCourses(client, courses) {
        if (courses.length === 0) return
        const values = buildValues(courses, 5)
        const params = courses.flatMap((c) => [c.code, c.name, c.credits, c.type, c.cycleNumber])
        await client.query(
            `INSERT INTO course (code, name, credits, type, cycle_number)
             VALUES ${values}
             ON CONFLICT (code) DO UPDATE
                SET name = EXCLUDED.name,
                    credits = EXCLUDED.credits,
                    type = EXCLUDED.type,
                    cycle_number = EXCLUDED.cycle_number,
                    is_active = TRUE`,
            params,
        )
    }

    // Reemplazo total: la malla se importa completa, así que se rehace la tabla
    // de enlace (sin filas huérfanas de una corrida anterior).
    static async replacePrerequisites(client, prerequisites) {
        await client.query('DELETE FROM prerequisite')
        if (prerequisites.length === 0) return
        const values = buildValues(prerequisites, 4)
        const params = prerequisites.flatMap((p) => [p.courseCode, p.requiresCode, p.kind, p.orGroup])
        await client.query(
            `INSERT INTO prerequisite (course_code, requires_code, kind, or_group)
             VALUES ${values}`,
            params,
        )
    }

    static async replaceEquivalences(client, equivalences) {
        await client.query('DELETE FROM equivalence')
        if (equivalences.length === 0) return
        const values = buildValues(equivalences, 3)
        const params = equivalences.flatMap((e) => [e.oldCode, e.newCode, e.note])
        await client.query(
            `INSERT INTO equivalence (old_code, new_code, note)
             VALUES ${values}
             ON CONFLICT (old_code, new_code) DO NOTHING`,
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

export default MallaModel

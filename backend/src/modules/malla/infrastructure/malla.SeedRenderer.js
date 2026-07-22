// Convierte la malla ya normalizada en SQL de seed idempotente. Función pura:
// recibe datos, devuelve texto; sin I/O ni base de datos. Así la malla queda
// versionada y se carga con `npm run seed`, sin depender del Excel.

// Escapa un valor para SQL: string entre comillas (duplicando las internas),
// número tal cual, null/undefined -> NULL.
const sql = (value) => {
    if (value === null || value === undefined || value === '') return 'NULL'
    if (typeof value === 'number') return String(value)
    return `'${String(value).replace(/'/g, "''")}'`
}

const row = (values) => `    (${values.map(sql).join(', ')})`

export const renderMallaSeed = ({ courses, prerequisites, equivalences }) => {
    const parts = []

    parts.push('-- Seed 002 · Malla 2026: cursos, prerrequisitos y equivalencias.')
    parts.push('-- GENERADO por `npm run malla:seed` desde Convalidaciones.xlsx. No editar a mano.')
    parts.push('-- Son datos institucionales públicos: permiten levantar la BD sin el Excel.')
    parts.push('')

    // Cursos: upsert para refrescar sin borrar (otras tablas los referencian).
    parts.push('INSERT INTO course (code, name, credits, type, cycle_number) VALUES')
    parts.push(courses.map((c) => row([c.code, c.name, c.credits, c.type, c.cycleNumber])).join(',\n'))
    parts.push('ON CONFLICT (code) DO UPDATE')
    parts.push('    SET name = EXCLUDED.name,')
    parts.push('        credits = EXCLUDED.credits,')
    parts.push('        type = EXCLUDED.type,')
    parts.push('        cycle_number = EXCLUDED.cycle_number,')
    parts.push('        is_active = TRUE;')
    parts.push('')

    // Prerrequisitos: reemplazo total (la malla se carga completa; sin huérfanos).
    parts.push('DELETE FROM prerequisite;')
    if (prerequisites.length > 0) {
        parts.push('INSERT INTO prerequisite (course_code, requires_code, kind, or_group) VALUES')
        parts.push(prerequisites.map((p) => row([p.courseCode, p.requiresCode, p.kind, p.orGroup])).join(',\n') + ';')
    }
    parts.push('')

    // Equivalencias: reemplazo total.
    parts.push('DELETE FROM equivalence;')
    if (equivalences.length > 0) {
        parts.push('INSERT INTO equivalence (old_code, new_code, note) VALUES')
        parts.push(equivalences.map((e) => row([e.oldCode, e.newCode, e.note])).join(',\n'))
        parts.push('ON CONFLICT (old_code, new_code) DO NOTHING;')
    }
    parts.push('')

    return parts.join('\n')
}

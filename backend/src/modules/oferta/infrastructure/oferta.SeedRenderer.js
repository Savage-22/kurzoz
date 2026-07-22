// Convierte la oferta 2026-II ya normalizada en SQL de seed idempotente.
// Función pura. Usa claves naturales (curso+docente, grupo) para enlazar
// session→section→offering sin depender de ids SERIAL. Borra primero la oferta
// del término para que re-correr reemplace en limpio (section/session caen en
// cascada).

// null/undefined -> NULL; cadena vacía SÍ se emite como '' (p. ej. docente sin
// nombre en el PDF: la columna teacher es NOT NULL con default '').
const sql = (value) => {
    if (value === null || value === undefined) return 'NULL'
    if (typeof value === 'number') return String(value)
    return `'${String(value).replace(/'/g, "''")}'`
}

const valuesBlock = (rows, toCols) => rows.map((r) => `    (${toCols(r).map(sql).join(', ')})`).join(',\n')

export const renderOfertaSeed = ({ offerings, sections, sessions }) => {
    const parts = []
    parts.push('-- Seed 003 · Oferta 2026-II: offering, section y session (horario oficial).')
    parts.push('-- GENERADO por `npm run oferta:seed` desde la Resolución de carga lectiva.')
    parts.push('-- Dato institucional público: permite levantar la BD sin el PDF.')
    parts.push('-- Requiere 001_terms.sql (término 2026-II) y 002_malla.sql (cursos).')
    parts.push('')
    parts.push("DELETE FROM offering WHERE term_id = (SELECT id FROM term WHERE code = '2026-II');")
    parts.push('')

    // Offerings: curso + docente + HT/HP, atados al término 2026-II.
    parts.push('INSERT INTO offering (term_id, course_code, teacher, ht, hp)')
    parts.push("SELECT (SELECT id FROM term WHERE code = '2026-II'), v.course_code, v.teacher, v.ht, v.hp")
    parts.push('FROM (VALUES')
    parts.push(valuesBlock(offerings, (o) => [o.courseCode, o.teacher, o.ht, o.hp]))
    parts.push(') AS v(course_code, teacher, ht, hp);')
    parts.push('')

    // Sections: grupo de cada offering (enlazado por curso+docente).
    parts.push('INSERT INTO section (offering_id, group_label)')
    parts.push('SELECT o.id, v.group_label')
    parts.push('FROM (VALUES')
    parts.push(valuesBlock(sections, (s) => [s.courseCode, s.teacher, s.groupLabel]))
    parts.push(') AS v(course_code, teacher, group_label)')
    parts.push("JOIN term t ON t.code = '2026-II'")
    parts.push('JOIN offering o ON o.term_id = t.id AND o.course_code = v.course_code AND o.teacher = v.teacher;')
    parts.push('')

    // Sessions: bloques horarios (enlazados por curso+docente+grupo).
    parts.push('INSERT INTO session (section_id, day, start_min, end_min, kind, pavilion, room)')
    parts.push('SELECT sec.id, v.day, v.start_min, v.end_min, v.kind, v.pavilion, v.room')
    parts.push('FROM (VALUES')
    parts.push(valuesBlock(sessions, (s) => [s.courseCode, s.teacher, s.groupLabel, s.day, s.startMin, s.endMin, s.kind, s.pavilion, s.room]))
    parts.push(') AS v(course_code, teacher, group_label, day, start_min, end_min, kind, pavilion, room)')
    parts.push("JOIN term t ON t.code = '2026-II'")
    parts.push('JOIN offering o ON o.term_id = t.id AND o.course_code = v.course_code AND o.teacher = v.teacher')
    parts.push('JOIN section sec ON sec.offering_id = o.id AND sec.group_label = v.group_label;')
    parts.push('')

    return parts.join('\n')
}

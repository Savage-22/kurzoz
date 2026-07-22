// #9 · Detección de choques de horario. Puro. Dos bloques chocan si son el
// mismo día y sus rangos se solapan en minutos. El solape es estricto: tocarse
// en el borde (09:15 fin vs 09:15 inicio) NO es choque.

// ¿Se solapan dos rangos [aStart,aEnd) y [bStart,bEnd)?
export const rangesOverlap = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && bStart < aEnd

// ¿Chocan dos secciones? (alguna sesión de una solapa alguna de la otra).
export const sectionsOverlap = (a, b) => {
    for (const sa of a.sessions) {
        for (const sb of b.sessions) {
            if (sa.day === sb.day && rangesOverlap(sa.startMin, sa.endMin, sb.startMin, sb.endMin)) return true
        }
    }
    return false
}

// Reporta todos los solapamientos entre las secciones de un conjunto candidato.
// O(n²) sobre las sesiones: suficiente para el MVP.
export const detectConflicts = (sections) => {
    const conflicts = []
    for (let i = 0; i < sections.length; i++) {
        for (let j = i + 1; j < sections.length; j++) {
            const a = sections[i]
            const b = sections[j]
            for (const sa of a.sessions) {
                for (const sb of b.sessions) {
                    if (sa.day !== sb.day || !rangesOverlap(sa.startMin, sa.endMin, sb.startMin, sb.endMin)) continue
                    conflicts.push({
                        courseA: a.courseCode,
                        courseB: b.courseCode,
                        groupA: a.groupLabel,
                        groupB: b.groupLabel,
                        day: sa.day,
                        overlapStart: Math.max(sa.startMin, sb.startMin),
                        overlapEnd: Math.min(sa.endMin, sb.endMin),
                    })
                }
            }
        }
    }
    return conflicts
}

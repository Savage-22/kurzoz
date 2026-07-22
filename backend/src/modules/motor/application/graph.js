// #36 · Grafo de prerrequisitos del alumno. Puro. Traduce la malla + el estado
// del alumno a nodos (cursos con su estado) y aristas (relaciones de
// prerrequisito). Reutiliza la prioridad de grafo (#coursePriority) para marcar
// los cursos estratégicos. El estado de cada curso, de mayor a menor:
//   aprobado > en_curso > elegible (cursable este término) > bloqueado.

const statusOf = (code, { doneSet, enCursoSet, eligibleSet }) => {
    if (doneSet.has(code)) return 'aprobado'
    if (enCursoSet.has(code)) return 'en_curso'
    if (eligibleSet.has(code)) return 'elegible'
    return 'bloqueado'
}

export const buildGraph = ({ courses, prerequisites, doneSet, enCursoSet, eligibleSet, priorityByCourse }) => {
    const codes = new Set(courses.map((c) => c.code))

    const nodes = courses.map((course) => {
        const priority = priorityByCourse.get(course.code)
        const factors = priority?.factors ?? {}
        return {
            code: course.code,
            name: course.name,
            cycle: course.cycleNumber,
            parity: course.cycleParity,
            type: course.type,
            credits: course.credits,
            status: statusOf(course.code, { doneSet, enCursoSet, eligibleSet }),
            priority: priority?.score ?? 0,
            strategic: (factors.opensNextTerm ?? 0) > 0,
            unlocks: factors.unlockCount ?? 0,
        }
    })

    // Solo aristas entre cursos vigentes (evita colas a códigos viejos que ya no
    // están en la malla).
    const edges = prerequisites
        .filter((p) => codes.has(p.requiresCode) && codes.has(p.courseCode))
        .map((p) => ({ source: p.requiresCode, target: p.courseCode, kind: p.kind, orGroup: p.orGroup }))

    return { nodes, edges }
}

// Prioridad de cada curso a partir del grafo de prerrequisitos. Puro. Modela
// "qué tan estratégico es llevar este curso ahora" combinando factores:
//   - obligatorio: pesa más que un electivo;
//   - desbloqueo: cuántos cursos dependen de él (directa o transitivamente) →
//     un cuello de botella abre muchas puertas;
//   - abre el próximo término: dependientes directos de paridad OPUESTA, que se
//     ofertan el ciclo siguiente (ej. un curso PAR que habilita uno IMPAR);
//   - urgencia de ciclo: los de ciclos más tempranos están más atrasados.
// Con esto el motor deja de mirar solo el año del alumno y valora correlativos
// de ciclos anteriores (caso 3202 → 4104).

// "requiere" invertido: requires_code -> [cursos que lo exigen].
const buildDependents = (prerequisites) => {
    const dependents = new Map()
    for (const p of prerequisites) {
        if (!dependents.has(p.requiresCode)) dependents.set(p.requiresCode, [])
        dependents.get(p.requiresCode).push(p.courseCode)
    }
    return dependents
}

// Conjunto de cursos que dependen (transitivamente) de `code`. Memoizado; el
// grafo de prerrequisitos es acíclico.
const transitiveDependents = (code, dependents, memo, stack = new Set()) => {
    if (memo.has(code)) return memo.get(code)
    const result = new Set()
    if (stack.has(code)) return result // guarda ante ciclos inesperados
    stack.add(code)
    for (const child of dependents.get(code) ?? []) {
        result.add(child)
        for (const d of transitiveDependents(child, dependents, memo, stack)) result.add(d)
    }
    stack.delete(code)
    memo.set(code, result)
    return result
}

const DEFAULT_WEIGHTS = { obligatorio: 4, unlock: 3, opensNextTerm: 8, cycleUrgency: 1 }

export const computeCoursePriorities = ({ courses, prerequisites, term }, weights = {}) => {
    const w = { ...DEFAULT_WEIGHTS, ...weights }
    const dependents = buildDependents(prerequisites)
    const byCode = new Map(courses.map((c) => [c.code, c]))
    const maxCycle = Math.max(1, ...courses.map((c) => c.cycleNumber ?? 0))
    const oppositeParity = term?.parity === 'PAR' ? 'IMPAR' : 'PAR'
    const memo = new Map()

    const priorities = new Map()
    for (const course of courses) {
        const unlockCount = transitiveDependents(course.code, dependents, memo).size
        const opensNextTerm = (dependents.get(course.code) ?? []).filter(
            (code) => byCode.get(code)?.cycleParity === oppositeParity,
        ).length
        const obligatorio = course.type === 'OBL' ? 1 : 0
        const cycleUrgency = course.cycleNumber ? maxCycle - course.cycleNumber : 0

        const score =
            w.obligatorio * obligatorio +
            w.unlock * unlockCount +
            w.opensNextTerm * opensNextTerm +
            w.cycleUrgency * cycleUrgency

        priorities.set(course.code, {
            score,
            factors: { obligatorio, unlockCount, opensNextTerm, cycleUrgency },
        })
    }
    return priorities
}

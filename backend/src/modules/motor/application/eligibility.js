// #8 · Elegibilidad de los faltantes en un término. Puro. Un curso es cursable
// si: cumple la paridad del término (2026-II solo pares), tiene oferta y sus
// prerrequisitos están satisfechos (Y = todos; O = al menos uno por grupo).
// EN_CURSO cuenta como "aprobado a fin de ciclo" solo si se activa encadenar.

const buildPrereqIndex = (prerequisites) => {
    const byCourse = new Map()
    for (const p of prerequisites) {
        if (!byCourse.has(p.courseCode)) byCourse.set(p.courseCode, { y: [], oGroups: new Map() })
        const entry = byCourse.get(p.courseCode)
        if (p.kind === 'Y') entry.y.push(p.requiresCode)
        else {
            if (!entry.oGroups.has(p.orGroup)) entry.oGroups.set(p.orGroup, [])
            entry.oGroups.get(p.orGroup).push(p.requiresCode)
        }
    }
    return byCourse
}

// Devuelve el primer prerrequisito insatisfecho, o null si todos se cumplen.
const missingPrereq = (courseCode, prereqIndex, satisfied) => {
    const entry = prereqIndex.get(courseCode)
    if (!entry) return null
    for (const code of entry.y) {
        if (!satisfied.has(code)) return `prereq faltante: ${code}`
    }
    for (const [, codes] of entry.oGroups) {
        if (!codes.some((c) => satisfied.has(c))) return `prereq faltante (uno de): ${codes.join(', ')}`
    }
    return null
}

export const validateEligibility = ({ remaining, studentStatus, prerequisites, term, offerings }, { chainInProgress = false } = {}) => {
    const prereqIndex = buildPrereqIndex(prerequisites)
    const offeredCodes = new Set(offerings.map((s) => s.courseCode))

    const satisfied = new Set(
        studentStatus
            .filter((s) => s.status === 'APROBADO' || (chainInProgress && s.status === 'EN_CURSO'))
            .map((s) => s.code),
    )

    const eligible = []
    const excluded = []
    for (const course of remaining) {
        if (course.cycleParity && term.parity && course.cycleParity !== term.parity) {
            excluded.push({ code: course.code, reason: 'paridad', detail: `ciclo ${course.cycleParity} no se dicta en ${term.code}` })
            continue
        }
        if (!offeredCodes.has(course.code)) {
            excluded.push({ code: course.code, reason: 'sin oferta', detail: `no hay oferta en ${term.code}` })
            continue
        }
        const missing = missingPrereq(course.code, prereqIndex, satisfied)
        if (missing) {
            excluded.push({ code: course.code, reason: 'prereq', detail: missing })
            continue
        }
        eligible.push(course)
    }

    return { eligible, excluded }
}

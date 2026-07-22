// #10 · Generación de horarios válidos. Puro. Elige a lo sumo una sección por
// curso elegible, evitando choques y respetando el tope de créditos. Maximiza
// la cantidad de cursos, pero también conserva planes de casi-máxima cantidad
// (slack) con mayor prioridad de grafo, para no descartar cursos estratégicos
// que cuestan un cupo (p. ej. un correlativo que abre un curso del próximo
// ciclo). Devuelve varios candidatos para que el ranking (#11) los compare.
import { sectionsOverlap } from './conflicts.js'

const NODE_CAP = 500000 // corta la búsqueda combinatoria en casos degenerados
const PER_COUNT_CAP = 80 // planes que se retienen por cada nivel de cantidad

const signature = (sections) =>
    sections
        .map((s) => `${s.courseCode}/${s.groupLabel}`)
        .sort()
        .join('|')

const noConflict = (chosen, section) => !chosen.some((s) => sectionsOverlap(s, section))

export const generateSchedules = ({ eligible, sectionsByCourse, maxCredits, priorityByCourse = new Map() }, { maxResults = 12, slack = 1 } = {}) => {
    // Solo cursos con al menos una sección ofertada se pueden agendar.
    const courses = eligible
        .map((c) => ({ code: c.code, credits: c.credits, sections: sectionsByCourse.get(c.code) || [] }))
        .filter((c) => c.sections.length > 0)

    const priorityOf = (code) => priorityByCourse.get(code)?.score ?? 0

    let maxCount = 0
    const byCount = new Map() // cantidad -> Map(firma -> plan)
    let nodes = 0

    const record = (chosen, credits) => {
        const count = chosen.length
        if (count === 0) return
        if (count > maxCount) maxCount = count
        if (count < maxCount - slack) return

        if (!byCount.has(count)) byCount.set(count, new Map())
        const level = byCount.get(count)
        const sig = signature(chosen)
        if (level.has(sig)) return
        const prioritySum = chosen.reduce((sum, s) => sum + priorityOf(s.courseCode), 0)
        level.set(sig, { sections: [...chosen], credits, prioritySum })

        // Poda el nivel a los de mayor prioridad para acotar memoria.
        if (level.size > PER_COUNT_CAP) {
            const top = [...level.entries()].sort((a, b) => b[1].prioritySum - a[1].prioritySum).slice(0, PER_COUNT_CAP)
            level.clear()
            for (const [k, v] of top) level.set(k, v)
        }
    }

    const search = (i, chosen, credits) => {
        if (nodes++ > NODE_CAP) return
        if (i === courses.length) { record(chosen, credits); return }
        const course = courses[i]
        for (const section of course.sections) {
            if (credits + course.credits <= maxCredits && noConflict(chosen, section)) {
                chosen.push(section)
                search(i + 1, chosen, credits + course.credits)
                chosen.pop()
            }
        }
        search(i + 1, chosen, credits)
    }
    search(0, [], 0)

    // Reúne los niveles [maxCount .. maxCount-slack], reservando cupos para los
    // niveles de menor cantidad (ahí viven los planes con cursos estratégicos).
    const eligibleCodes = eligible.map((c) => c.code)
    const levelPlans = (count) =>
        [...(byCount.get(count)?.values() ?? [])]
            .sort((a, b) => b.prioritySum - a.prioritySum)
            .map((p) => ({ ...p, count }))

    const reserve = Math.min(4, maxResults - 1)
    const topLevel = levelPlans(maxCount).slice(0, maxResults - reserve)
    const lowerLevels = []
    for (let c = maxCount - 1; c >= Math.max(1, maxCount - slack); c--) lowerLevels.push(...levelPlans(c))
    const chosenPlans = [...topLevel, ...lowerLevels.slice(0, maxResults - topLevel.length)]

    const schedules = chosenPlans.map((s) => {
        const included = new Set(s.sections.map((x) => x.courseCode))
        return {
            courses: s.sections.map((x) => ({ code: x.courseCode, group: x.groupLabel })),
            credits: s.credits,
            sections: s.sections,
            leftOut: eligibleCodes.filter((code) => !included.has(code)),
        }
    })

    return { schedules, maxCourses: Math.max(0, maxCount), eligibleCount: courses.length, truncated: nodes > NODE_CAP }
}

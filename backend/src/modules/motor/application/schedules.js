// #10 · Generación de horarios válidos. Puro. Elige a lo sumo una sección por
// curso elegible, evitando choques y respetando el tope de créditos, buscando
// maximizar la cantidad de cursos. Devuelve varios candidatos para que el
// ranking (#11) los compare.
import { sectionsOverlap } from './conflicts.js'

const NODE_CAP = 500000 // corta la búsqueda combinatoria en casos degenerados

const signature = (sections) =>
    sections
        .map((s) => `${s.courseCode}/${s.groupLabel}`)
        .sort()
        .join('|')

const noConflict = (chosen, section) => !chosen.some((s) => sectionsOverlap(s, section))

export const generateSchedules = ({ eligible, sectionsByCourse, maxCredits }, { maxResults = 10 } = {}) => {
    // Solo cursos con al menos una sección ofertada se pueden agendar.
    const courses = eligible
        .map((c) => ({ code: c.code, credits: c.credits, sections: sectionsByCourse.get(c.code) || [] }))
        .filter((c) => c.sections.length > 0)

    let bestCount = -1
    const best = new Map() // firma -> horario, solo los de mayor cantidad de cursos
    let nodes = 0

    const record = (chosen, credits) => {
        const count = chosen.length
        if (count < bestCount) return
        if (count > bestCount) { bestCount = count; best.clear() }
        const sig = signature(chosen)
        if (!best.has(sig)) best.set(sig, { sections: [...chosen], credits })
    }

    const search = (i, chosen, credits) => {
        if (nodes++ > NODE_CAP) return
        if (i === courses.length) { record(chosen, credits); return }
        const course = courses[i]
        // Tomar una sección del curso (si cabe en créditos y no choca).
        for (const section of course.sections) {
            if (credits + course.credits <= maxCredits && noConflict(chosen, section)) {
                chosen.push(section)
                search(i + 1, chosen, credits + course.credits)
                chosen.pop()
            }
        }
        // O saltarlo.
        search(i + 1, chosen, credits)
    }
    search(0, [], 0)

    const eligibleCodes = eligible.map((c) => c.code)
    const schedules = [...best.values()]
        .sort((a, b) => b.sections.length - a.sections.length || b.credits - a.credits)
        .slice(0, maxResults)
        .map((s) => {
            const included = new Set(s.sections.map((x) => x.courseCode))
            return {
                courses: s.sections.map((x) => ({ code: x.courseCode, group: x.groupLabel })),
                credits: s.credits,
                sections: s.sections,
                leftOut: eligibleCodes.filter((code) => !included.has(code)),
            }
        })

    return { schedules, maxCourses: Math.max(0, bestCount), eligibleCount: courses.length, truncated: nodes > NODE_CAP }
}

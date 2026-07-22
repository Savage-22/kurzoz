// #12 + #38 · Recomendador de ajustes de horario. Puro y NO modifica la oferta
// oficial: trabaja sobre secciones clonadas. Ante un set de cursos deseados que
// cruza ciclos, separa un "host" (el ciclo que aporta más cursos deseados, con
// grupo ÚNICO que lleva toda su cohorte → bloques INMOVIBLES) de los "cursos
// visitantes" (de otros ciclos, que se ponen al día). El único candidato a
// intervención es el visitante:
//   - si su grupo es ÚNICO (una sola sección) NO se mueve su bloque —eso
//     desplazaría a su propia cohorte—; se propone un GRUPO NUEVO en un tramo
//     libre;
//   - si tiene ≥2 grupos ofertados (hay flexibilidad real) también se evalúa
//     MOVER un bloque.
// El host se infiere automáticamente pero se puede sobrescribir manualmente.
// Cada propuesta trae su ganancia (cursos desbloqueados) y su disrupción.
import { generateSchedules } from './schedules.js'
import { rangesOverlap } from './conflicts.js'

const SLOT = 45
const DAY_START = 375 // 06:15
const DAY_END = 1350 // 22:30
const HYPOTHESIS = 'hipótesis de cambio, sujeta a aprobación de la facultad'

const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
const range = (s) => `${hhmm(s.startMin)}-${hhmm(s.endMin)}`

const cloneSection = (section) => ({ ...section, sessions: section.sessions.map((s) => ({ ...s })) })

// Máxima cantidad de cursos agendables con un universo de secciones dado.
const maxCourses = (courses, sectionsByCourse, maxCredits) =>
    generateSchedules({ eligible: courses, sectionsByCourse, maxCredits }, { maxResults: 1 }).maxCourses

const submap = (sectionsByCourse, codes) => {
    const map = new Map()
    for (const code of codes) if (sectionsByCourse.has(code)) map.set(code, sectionsByCourse.get(code))
    return map
}

// Ciclo host: el que aporta más cursos deseados (empate → ciclo mayor, la
// cohorte más avanzada). Un override manual gana sobre la inferencia.
const inferHostCycle = (courses, override) => {
    if (override != null) return override
    const countByCycle = new Map()
    for (const c of courses) {
        const cycle = c.cycleNumber ?? 0
        countByCycle.set(cycle, (countByCycle.get(cycle) ?? 0) + 1)
    }
    let hostCycle = null
    let best = -1
    for (const [cycle, count] of countByCycle) {
        if (count > best || (count === best && cycle > hostCycle)) {
            best = count
            hostCycle = cycle
        }
    }
    return hostCycle
}

// ¿Alguna sesión del bloque desplazado choca con las horas ocupadas?
const blockClashes = (sessions, busy) =>
    sessions.some((ss) => busy.some((b) => b.day === ss.day && rangesOverlap(ss.startMin, ss.endMin, b.startMin, b.endMin)))

// Mejor colocación de un GRUPO NUEVO: desplaza el bloque COMPLETO (todas sus
// sesiones, mismo patrón de días) al tramo libre más cercano que no cruce lo
// ocupado, prefiriendo horario más tarde. Devuelve las sesiones desplazadas o
// null si no cabe en ningún corrimiento.
const newGroupPlacement = (template, busy) => {
    const sessions = template.sessions
    if (!sessions || sessions.length === 0) return null
    const minStart = Math.min(...sessions.map((s) => s.startMin))
    const maxEnd = Math.max(...sessions.map((s) => s.endMin))
    const lo = DAY_START - minStart // corrimiento más negativo que mantiene el bloque en horario
    const hi = DAY_END - maxEnd // corrimiento más positivo

    // Corrimientos en pasos de SLOT ordenados por |delta| asc; a igual distancia,
    // primero el más tarde (+) porque los tramos de la tarde suelen estar libres.
    for (let d = 1; d * SLOT <= Math.max(hi, -lo); d++) {
        for (const delta of [d * SLOT, -d * SLOT]) {
            if (delta > hi || delta < lo) continue
            const shifted = sessions.map((s) => ({ ...s, startMin: s.startMin + delta, endMin: s.endMin + delta }))
            if (!blockClashes(shifted, busy)) return shifted
        }
    }
    return null
}

export const recommendAdjustments = (
    { eligible, sectionsByCourse, maxCredits = 24, maxShiftSlots = 6 },
    { desiredCourses = null, hostCycle: hostCycleOverride = null } = {},
) => {
    const courses = desiredCourses ? eligible.filter((c) => desiredCourses.includes(c.code)) : eligible
    const codes = courses.map((c) => c.code)
    const baseMap = submap(sectionsByCourse, codes)
    const baseline = generateSchedules({ eligible: courses, sectionsByCourse: baseMap, maxCredits }, { maxResults: 1 })
    const baseMax = baseline.maxCourses

    const hostCycle = inferHostCycle(courses, hostCycleOverride)
    const isHost = (course) => (course.cycleNumber ?? 0) === hostCycle
    const hostCourses = courses.filter(isHost).map((c) => c.code)
    const visitorCourses = courses.filter((c) => !isHost(c)).map((c) => c.code)

    const proposals = []

    // 1) MOVER un bloque: solo cursos VISITANTES con ≥2 grupos ofertados (mover
    // el bloque de un grupo ÚNICO desplazaría a su cohorte, no es realista).
    for (const course of courses) {
        if (isHost(course)) continue
        const sections = baseMap.get(course.code) || []
        if (sections.length < 2) continue
        for (const section of sections) {
            for (let si = 0; si < section.sessions.length; si++) {
                let bestForBlock = null
                for (let k = 1; k <= maxShiftSlots; k++) {
                    for (const delta of [k * SLOT, -k * SLOT]) {
                        const orig = section.sessions[si]
                        const start = orig.startMin + delta
                        const end = orig.endMin + delta
                        if (start < DAY_START || end > DAY_END) continue

                        const moved = cloneSection(section)
                        moved.sessions[si] = { ...orig, startMin: start, endMin: end }
                        const newMap = new Map(baseMap)
                        newMap.set(course.code, sections.map((s) => (s === section ? moved : s)))

                        const gain = maxCourses(courses, newMap, maxCredits) - baseMax
                        if (gain > 0) {
                            bestForBlock = {
                                type: 'MOVER',
                                course: course.code,
                                group: section.groupLabel,
                                day: orig.day,
                                from: range(orig),
                                to: `${hhmm(start)}-${hhmm(end)}`,
                                shiftSlots: delta / SLOT,
                                gain,
                                disruption: 1,
                                absSlots: k,
                                note: HYPOTHESIS,
                            }
                        }
                    }
                    if (bestForBlock) break // menor corrimiento posible para este bloque
                }
                if (bestForBlock) { delete bestForBlock.absSlots; proposals.push(bestForBlock) }
            }
        }
    }

    // 2) GRUPO NUEVO: para cada curso VISITANTE que quedó fuera del mejor horario
    // base, una sección alterna con el bloque completo corrido a un tramo libre.
    // Una sola propuesta (la mejor colocación) por curso.
    if (baseline.schedules.length > 0) {
        const busy = baseline.schedules[0].sections.flatMap((s) => s.sessions)
        const visitorSet = new Set(visitorCourses)
        for (const code of baseline.schedules[0].leftOut) {
            if (!visitorSet.has(code)) continue
            const template = (baseMap.get(code) || [])[0]
            if (!template) continue
            const shifted = newGroupPlacement(template, busy)
            if (!shifted) continue

            const newSection = { ...template, groupLabel: `${template.groupLabel}-NUEVO`, sessions: shifted }
            const newMap = new Map(baseMap)
            newMap.set(code, [...(baseMap.get(code) || []), newSection])
            const gain = maxCourses(courses, newMap, maxCredits) - baseMax
            if (gain > 0) {
                proposals.push({
                    type: 'NUEVO_GRUPO',
                    course: code,
                    group: newSection.groupLabel,
                    day: shifted[0].day,
                    to: range(shifted[0]),
                    sessions: shifted.map((s) => ({ day: s.day, from: hhmm(s.startMin), to: hhmm(s.endMin), startMin: s.startMin, endMin: s.endMin })),
                    gain,
                    disruption: 1,
                    note: HYPOTHESIS,
                })
            }
        }
    }

    proposals.sort((a, b) => b.gain - a.gain || a.disruption - b.disruption || Math.abs(a.shiftSlots || 0) - Math.abs(b.shiftSlots || 0))
    return { baselineCourses: baseMax, hostCycle, hostCourses, visitorCourses, proposals }
}

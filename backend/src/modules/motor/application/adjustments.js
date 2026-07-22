// #12 + #38 + #41 · Recomendador de ajustes de horario. Puro y NO modifica la
// oferta oficial: trabaja sobre secciones clonadas. Ante un set de cursos
// deseados que cruza ciclos, separa un "host" (el ciclo que aporta más cursos
// deseados, con grupo ÚNICO que lleva toda su cohorte → bloques INMOVIBLES) de
// los "cursos visitantes" (de otros ciclos, que se ponen al día). El único
// candidato a intervención es el visitante:
//   - si su grupo es ÚNICO (una sola sección) NO se mueve su bloque —eso
//     desplazaría a su propia cohorte—; se propone un GRUPO NUEVO en un tramo
//     libre;
//   - si tiene ≥2 grupos ofertados (hay flexibilidad real) también se evalúa
//     MOVER un bloque.
// Propone dos clases de ajuste: los de CANTIDAD (suben la cantidad de cursos
// cursables) y los de CONFORT (#41: no cambian la cantidad pero mejoran la
// comodidad — menos huecos, madrugadas, días sobrecargados). El host se infiere
// automáticamente pero se puede sobrescribir manualmente.
import { generateSchedules } from './schedules.js'
import { rangesOverlap } from './conflicts.js'
import { comfortScore } from './ranking.js'

const SLOT = 45
const DAY_START = 375 // 06:15
const DAY_END = 1350 // 22:30
const COMFORT_EPS = 0.01 // mejora de comodidad mínima para proponer un ajuste
const HYPOTHESIS = 'hipótesis de cambio, sujeta a aprobación de la facultad'

const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
const range = (s) => `${hhmm(s.startMin)}-${hhmm(s.endMin)}`

const cloneSection = (section) => ({ ...section, sessions: section.sessions.map((s) => ({ ...s })) })

// Máxima cantidad de cursos agendables con un universo de secciones dado.
const maxCourses = (courses, sectionsByCourse, maxCredits) =>
    generateSchedules({ eligible: courses, sectionsByCourse, maxCredits }, { maxResults: 1 }).maxCourses

// Cantidad máxima de cursos y la MEJOR comodidad alcanzable con esa cantidad.
const bestFit = (courses, sectionsByCourse, maxCredits) => {
    const result = generateSchedules({ eligible: courses, sectionsByCourse, maxCredits }, { maxResults: 20 })
    const atMax = result.schedules.filter((s) => s.sections.length === result.maxCourses)
    const comfort = atMax.length ? Math.max(...atMax.map((s) => comfortScore(s.sections))) : 0
    return { count: result.maxCourses, comfort }
}

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

// Todos los corrimientos válidos (en pasos de SLOT, bloque completo dentro de
// horario) de un bloque, ordenados por |delta| ascendente y prefiriendo el más
// tarde a igual distancia. Excluye el corrimiento 0 (posición original).
const blockShifts = (sessions) => {
    const minStart = Math.min(...sessions.map((s) => s.startMin))
    const maxEnd = Math.max(...sessions.map((s) => s.endMin))
    const lo = DAY_START - minStart
    const hi = DAY_END - maxEnd
    const shifts = []
    for (let d = 1; d * SLOT <= Math.max(hi, -lo); d++) {
        for (const delta of [d * SLOT, -d * SLOT]) {
            if (delta > hi || delta < lo) continue
            shifts.push(sessions.map((s) => ({ ...s, startMin: s.startMin + delta, endMin: s.endMin + delta })))
        }
    }
    return shifts
}

// Mejor colocación de un GRUPO NUEVO para SUBIR la cantidad: el primer tramo
// libre (más cercano, prefiriendo tarde) que no cruza lo ocupado.
const newGroupForCount = (template, busy) => {
    if (!template.sessions?.length) return null
    for (const shifted of blockShifts(template.sessions)) {
        if (!blockClashes(shifted, busy)) return shifted
    }
    return null
}

const newGroupSection = (template, sessions) => ({ ...template, groupLabel: `${template.groupLabel}-NUEVO`, sessions })

const nuevoGrupoProposal = (code, template, sessions, extra) => ({
    type: 'NUEVO_GRUPO',
    course: code,
    group: `${template.groupLabel}-NUEVO`,
    day: sessions[0].day,
    to: range(sessions[0]),
    sessions: sessions.map((s) => ({ day: s.day, from: hhmm(s.startMin), to: hhmm(s.endMin), startMin: s.startMin, endMin: s.endMin })),
    disruption: 1,
    note: HYPOTHESIS,
    ...extra,
})

export const recommendAdjustments = (
    { eligible, sectionsByCourse, maxCredits = 24, maxShiftSlots = 6 },
    { desiredCourses = null, hostCycle: hostCycleOverride = null } = {},
) => {
    const courses = desiredCourses ? eligible.filter((c) => desiredCourses.includes(c.code)) : eligible
    const codes = courses.map((c) => c.code)
    const baseMap = submap(sectionsByCourse, codes)
    const baseline = generateSchedules({ eligible: courses, sectionsByCourse: baseMap, maxCredits }, { maxResults: 1 })
    const baseMax = baseline.maxCourses
    const baseComfort = bestFit(courses, baseMap, maxCredits).comfort

    const hostCycle = inferHostCycle(courses, hostCycleOverride)
    const isHost = (course) => (course.cycleNumber ?? 0) === hostCycle
    const hostCourses = courses.filter(isHost).map((c) => c.code)
    const visitorCourses = courses.filter((c) => !isHost(c)).map((c) => c.code)
    const visitorSet = new Set(visitorCourses)
    // Horas ocupadas por el host (fijo): las colocaciones nuevas deben evitarlas.
    const hostBusy = hostCourses.flatMap((code) => (baseMap.get(code) || []).flatMap((s) => s.sessions))

    const proposals = []

    // 1) MOVER un bloque (solo visitantes con ≥2 grupos): primero por CANTIDAD
    // (menor corrimiento que sube cursos), si no por CONFORT (mayor mejora de
    // comodidad sin bajar la cantidad).
    for (const course of courses) {
        if (isHost(course)) continue
        const sections = baseMap.get(course.code) || []
        if (sections.length < 2) continue
        for (const section of sections) {
            for (let si = 0; si < section.sessions.length; si++) {
                const orig = section.sessions[si]
                let byCount = null
                let byComfort = null
                for (let k = 1; k <= maxShiftSlots; k++) {
                    for (const delta of [k * SLOT, -k * SLOT]) {
                        const start = orig.startMin + delta
                        const end = orig.endMin + delta
                        if (start < DAY_START || end > DAY_END) continue

                        const moved = cloneSection(section)
                        moved.sessions[si] = { ...orig, startMin: start, endMin: end }
                        const newMap = new Map(baseMap)
                        newMap.set(course.code, sections.map((s) => (s === section ? moved : s)))
                        const fit = bestFit(courses, newMap, maxCredits)

                        const base = {
                            type: 'MOVER',
                            course: course.code,
                            group: section.groupLabel,
                            day: orig.day,
                            from: range(orig),
                            to: `${hhmm(start)}-${hhmm(end)}`,
                            shiftSlots: delta / SLOT,
                            disruption: 1,
                            note: HYPOTHESIS,
                        }
                        if (fit.count - baseMax > 0) {
                            if (!byCount) byCount = { ...base, motive: 'CANTIDAD', gain: fit.count - baseMax, comfortGain: 0 }
                        } else if (fit.count === baseMax && fit.comfort - baseComfort > COMFORT_EPS) {
                            const comfortGain = Number((fit.comfort - baseComfort).toFixed(3))
                            if (!byComfort || comfortGain > byComfort.comfortGain) byComfort = { ...base, motive: 'CONFORT', gain: 0, comfortGain }
                        }
                    }
                    if (byCount) break // menor corrimiento posible que sube cursos
                }
                if (byCount) proposals.push(byCount)
                else if (byComfort) proposals.push(byComfort)
            }
        }
    }

    // 2) GRUPO NUEVO por CANTIDAD: para cada visitante que quedó FUERA del mejor
    // horario base, una sección alterna en el primer tramo libre. Uno por curso.
    if (baseline.schedules.length > 0) {
        const busy = baseline.schedules[0].sections.flatMap((s) => s.sessions)
        for (const code of baseline.schedules[0].leftOut) {
            if (!visitorSet.has(code)) continue
            const template = (baseMap.get(code) || [])[0]
            if (!template) continue
            const shifted = newGroupForCount(template, busy)
            if (!shifted) continue

            const newMap = new Map(baseMap)
            newMap.set(code, [...(baseMap.get(code) || []), newGroupSection(template, shifted)])
            const gain = maxCourses(courses, newMap, maxCredits) - baseMax
            if (gain > 0) proposals.push(nuevoGrupoProposal(code, template, shifted, { motive: 'CANTIDAD', gain, comfortGain: 0 }))
        }
    }

    // 3) GRUPO NUEVO por CONFORT (#41): para cada visitante YA cursable pero mal
    // ubicado, abrir un grupo en la colocación que MÁS mejora la comodidad sin
    // cambiar la cantidad de cursos. Si el curso ya tiene propuesta de cantidad,
    // se omite.
    const withCountProposal = new Set(proposals.filter((p) => p.motive === 'CANTIDAD').map((p) => p.course))
    for (const course of courses) {
        if (isHost(course) || withCountProposal.has(course.code)) continue
        const template = (baseMap.get(course.code) || [])[0]
        if (!template?.sessions?.length) continue

        let best = null
        for (const shifted of blockShifts(template.sessions)) {
            if (blockClashes(shifted, hostBusy)) continue
            const newMap = new Map(baseMap)
            newMap.set(course.code, [...(baseMap.get(course.code) || []), newGroupSection(template, shifted)])
            const fit = bestFit(courses, newMap, maxCredits)
            if (fit.count === baseMax && fit.comfort - baseComfort > COMFORT_EPS && (!best || fit.comfort > best.comfort)) {
                best = { shifted, comfort: fit.comfort }
            }
        }
        if (best) {
            proposals.push(nuevoGrupoProposal(course.code, template, best.shifted, { motive: 'CONFORT', gain: 0, comfortGain: Number((best.comfort - baseComfort).toFixed(3)) }))
        }
    }

    // Primero los que suben cursos (por ganancia), luego los de confort (por
    // mejora de comodidad); a igualdad, el de menor disrupción/corrimiento.
    proposals.sort(
        (a, b) => b.gain - a.gain || (b.comfortGain || 0) - (a.comfortGain || 0) || a.disruption - b.disruption || Math.abs(a.shiftSlots || 0) - Math.abs(b.shiftSlots || 0),
    )
    return { baselineCourses: baseMax, baseComfort: Number(baseComfort.toFixed(3)), hostCycle, hostCourses, visitorCourses, proposals }
}

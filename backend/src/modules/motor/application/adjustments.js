// #12 · Recomendador de ajustes de horario. Puro y NO modifica la oferta
// oficial: trabaja sobre secciones clonadas. Ante choques que impiden llevar
// más cursos, propone la intervención mínima que sube la cantidad de cursos
// cursables: MOVER un bloque en múltiplos de 45 min (mismo día, dentro del
// horario académico) o, si mover no alcanza, abrir un GRUPO NUEVO en un tramo
// libre. Cada propuesta trae su ganancia (cursos desbloqueados) y su disrupción.
import { generateSchedules } from './schedules.js'
import { rangesOverlap } from './conflicts.js'

const SLOT = 45
const DAY_START = 375 // 06:15
const DAY_END = 1350 // 22:30
const HYPOTHESIS = 'hipótesis de cambio, sujeta a aprobación de la facultad'

const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

const cloneSection = (section) => ({ ...section, sessions: section.sessions.map((s) => ({ ...s })) })

// Máxima cantidad de cursos agendables con un universo de secciones dado.
const maxCourses = (courses, sectionsByCourse, maxCredits) =>
    generateSchedules({ eligible: courses, sectionsByCourse, maxCredits }, { maxResults: 1 }).maxCourses

const submap = (sectionsByCourse, codes) => {
    const map = new Map()
    for (const code of codes) if (sectionsByCourse.has(code)) map.set(code, sectionsByCourse.get(code))
    return map
}

// Busca un tramo libre para un bloque de `duration` min que no choque con las
// sesiones ocupadas; devuelve {day, startMin, endMin} o null.
const findFreeSlot = (duration, busy) => {
    for (let day = 1; day <= 5; day++) {
        const daySessions = busy.filter((s) => s.day === day)
        for (let start = DAY_START; start + duration <= DAY_END; start += SLOT) {
            const end = start + duration
            if (!daySessions.some((s) => rangesOverlap(start, end, s.startMin, s.endMin))) return { day, startMin: start, endMin: end }
        }
    }
    return null
}

export const recommendAdjustments = (
    { eligible, sectionsByCourse, maxCredits = 24, maxShiftSlots = 6 },
    { desiredCourses = null } = {},
) => {
    const courses = desiredCourses ? eligible.filter((c) => desiredCourses.includes(c.code)) : eligible
    const codes = courses.map((c) => c.code)
    const baseMap = submap(sectionsByCourse, codes)
    const baseline = generateSchedules({ eligible: courses, sectionsByCourse: baseMap, maxCredits }, { maxResults: 1 })
    const baseMax = baseline.maxCourses

    const proposals = []

    // 1) MOVER un bloque: probar correr cada sesión de cada sección ±N slots.
    for (const course of courses) {
        for (const section of baseMap.get(course.code) || []) {
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
                        newMap.set(course.code, (baseMap.get(course.code) || []).map((s) => (s === section ? moved : s)))

                        const gain = maxCourses(courses, newMap, maxCredits) - baseMax
                        if (gain > 0 && (!bestForBlock || Math.abs(k) < bestForBlock.absSlots)) {
                            bestForBlock = {
                                type: 'MOVER',
                                course: course.code,
                                group: section.groupLabel,
                                day: orig.day,
                                from: `${hhmm(orig.startMin)}-${hhmm(orig.endMin)}`,
                                to: `${hhmm(start)}-${hhmm(end)}`,
                                shiftSlots: delta / SLOT,
                                gain,
                                disruption: 1,
                                absSlots: Math.abs(k),
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

    // 2) GRUPO NUEVO: si mover no sube el conteo, ofrecer una sección alterna en
    // un tramo libre para algún curso que quedó fuera del mejor horario base.
    if (proposals.length === 0 && baseline.schedules.length > 0) {
        const busy = baseline.schedules[0].sections.flatMap((s) => s.sessions)
        for (const code of baseline.schedules[0].leftOut) {
            const template = (baseMap.get(code) || [])[0]
            if (!template || template.sessions.length === 0) continue
            const duration = template.sessions[0].endMin - template.sessions[0].startMin
            const slot = findFreeSlot(duration, busy)
            if (!slot) continue

            const newSection = { ...template, groupLabel: `${template.groupLabel}-NUEVO`, sessions: [{ ...template.sessions[0], ...slot }] }
            const newMap = new Map(baseMap)
            newMap.set(code, [...(baseMap.get(code) || []), newSection])
            const gain = maxCourses(courses, newMap, maxCredits) - baseMax
            if (gain > 0) {
                proposals.push({
                    type: 'NUEVO_GRUPO',
                    course: code,
                    group: newSection.groupLabel,
                    day: slot.day,
                    to: `${hhmm(slot.startMin)}-${hhmm(slot.endMin)}`,
                    gain,
                    disruption: 1,
                    note: HYPOTHESIS,
                })
            }
        }
    }

    proposals.sort((a, b) => b.gain - a.gain || a.disruption - b.disruption || Math.abs(a.shiftSlots || 0) - Math.abs(b.shiftSlots || 0))
    return { baselineCourses: baseMax, proposals }
}

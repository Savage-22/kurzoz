// #55 · Optimizador institucional incremental. Puro y determinista. Parte de la
// oferta oficial (1º-5º) y propone corrimientos MÍNIMOS de bloques completos
// para, en este orden de dureza:
//   HARD  1. Respetar la disponibilidad de cada docente (ninguna sesión fuera
//            de sus ventanas), y no crear choques DENTRO de un mismo ciclo
//            (la cohorte ya está agendada sin cruces).
//   SOFT  2. Reducir choques CROSS-ciclo (los que sufren quienes se ponen al día).
//         3. No doble-reservar aulas.
//   COST  4. Mover lo menos posible (mínima disrupción).
// No usa IA: misma entrada → misma salida.
import { rangesOverlap } from '../../motor/application/conflicts.js'

const SLOT = 45
const DAY_START = 375 // 06:15
const DAY_END = 1350 // 22:30
const HARD = 1000 // peso de las restricciones duras
const DEFAULT_WEIGHTS = { room: 5, cross: 1, move: 0.1 }

const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

const groupAvailability = (availability) => {
    const byTeacher = new Map()
    for (const w of availability) {
        if (!byTeacher.has(w.teacher)) byTeacher.set(w.teacher, [])
        byTeacher.get(w.teacher).push(w)
    }
    return byTeacher
}

// ¿La sesión cae completa dentro de alguna ventana del docente ese día?
const sessionAllowed = (session, windows) =>
    windows.some((w) => w.day === session.day && session.startMin >= w.startMin && session.endMin <= w.endMin)

// Sesiones fuera de ventana de un bloque (0 si el docente no tiene ventanas
// definidas → se considera sin restricción).
const blockViolations = (block, availabilityByTeacher) => {
    const windows = availabilityByTeacher.get(block.teacher)
    if (!windows || windows.length === 0) return 0
    return block.sessions.filter((s) => !sessionAllowed(s, windows)).length
}

const totalViolations = (blocks, availabilityByTeacher) =>
    blocks.reduce((sum, b) => sum + blockViolations(b, availabilityByTeacher), 0)

// Choques por pares de sesiones: mismo ciclo, distinto ciclo y misma aula.
const conflictCounts = (blocks) => {
    const sessions = blocks.flatMap((b, bi) =>
        b.sessions.map((s) => ({ ...s, cycle: b.cycle, block: bi, room: s.room ? `${s.pavilion ?? ''}·${s.room}` : null })),
    )
    let sameCycle = 0
    let crossCycle = 0
    let room = 0
    for (let i = 0; i < sessions.length; i++) {
        for (let j = i + 1; j < sessions.length; j++) {
            const a = sessions[i]
            const b = sessions[j]
            if (a.day !== b.day || !rangesOverlap(a.startMin, a.endMin, b.startMin, b.endMin)) continue
            if (a.block !== b.block) {
                if (a.cycle === b.cycle) sameCycle++
                else crossCycle++
            }
            if (a.room && a.room === b.room && a.block !== b.block) room++
        }
    }
    return { sameCycle, crossCycle, room }
}

const scoreOf = (blocks, availabilityByTeacher, w) => {
    const { sameCycle, crossCycle, room } = conflictCounts(blocks)
    return HARD * (totalViolations(blocks, availabilityByTeacher) + sameCycle) + w.room * room + w.cross * crossCycle
}

// Corrimientos candidatos del bloque completo (dentro de horario), ordenados por
// |delta| ascendente y excluyendo el 0. Combina una grilla de SLOT con
// corrimientos que ALINEAN el bloque al borde de una ventana del docente (para
// poder entrar en su disponibilidad aunque no caiga en la grilla de 45 min).
const candidateDeltas = (sessions, windows) => {
    const minStart = Math.min(...sessions.map((s) => s.startMin))
    const maxEnd = Math.max(...sessions.map((s) => s.endMin))
    // Las ventanas del docente pueden ensanchar los límites del día (ej: un
    // docente disponible desde las 06:00, antes del inicio habitual).
    const earliest = windows.length ? Math.min(DAY_START, ...windows.map((x) => x.startMin)) : DAY_START
    const latest = windows.length ? Math.max(DAY_END, ...windows.map((x) => x.endMin)) : DAY_END
    const lo = earliest - minStart
    const hi = latest - maxEnd
    const deltas = new Set()

    for (let d = 1; d * SLOT <= Math.max(hi, -lo); d++) {
        for (const delta of [d * SLOT, -d * SLOT]) {
            if (delta <= hi && delta >= lo) deltas.add(delta)
        }
    }
    for (const w of windows) {
        for (const s of sessions) {
            if (s.day !== w.day) continue
            for (const delta of [w.startMin - s.startMin, w.endMin - s.endMin]) {
                if (delta !== 0 && delta >= lo && delta <= hi) deltas.add(delta)
            }
        }
    }
    return [...deltas].sort((a, b) => Math.abs(a) - Math.abs(b))
}

const shiftSessions = (sessions, delta) => sessions.map((s) => ({ ...s, startMin: s.startMin + delta, endMin: s.endMin + delta }))

const snapshot = (blocks, availabilityByTeacher) => {
    const { sameCycle, crossCycle, room } = conflictCounts(blocks)
    return { teacherViolations: totalViolations(blocks, availabilityByTeacher), sameCycleConflicts: sameCycle, crossCycleConflicts: crossCycle, roomConflicts: room }
}

export const optimizeInstitutional = ({ offerings, availability, courseCycle }, weights = {}) => {
    const w = { ...DEFAULT_WEIGHTS, ...weights }
    const availabilityByTeacher = groupAvailability(availability)

    const blocks = offerings
        .filter((sec) => sec.sessions?.length > 0)
        .map((sec) => ({
            courseCode: sec.courseCode,
            groupLabel: sec.groupLabel,
            teacher: sec.teacher,
            cycle: courseCycle.get(sec.courseCode) ?? 0,
            sessions: sec.sessions.map((s) => ({ ...s })),
        }))

    const before = snapshot(blocks, availabilityByTeacher)

    // Primero los bloques con violación de disponibilidad (lo más urgente).
    const order = [...blocks.keys()].sort(
        (a, b) => blockViolations(blocks[b], availabilityByTeacher) - blockViolations(blocks[a], availabilityByTeacher),
    )

    const moves = []
    let improved = true
    let passes = 0
    while (improved && passes < 3) {
        improved = false
        passes++
        for (const bi of order) {
            const block = blocks[bi]
            const original = block.sessions
            const violBefore = blockViolations(block, availabilityByTeacher)
            let best = { delta: 0, score: scoreOf(blocks, availabilityByTeacher, w) }

            for (const delta of candidateDeltas(original, availabilityByTeacher.get(block.teacher) || [])) {
                block.sessions = shiftSessions(original, delta)
                const score = scoreOf(blocks, availabilityByTeacher, w) + w.move * Math.abs(delta / SLOT)
                if (score < best.score - 1e-9) best = { delta, score, sessions: block.sessions }
                block.sessions = original
            }

            if (best.delta !== 0) {
                block.sessions = best.sessions
                const reason = violBefore > blockViolations(block, availabilityByTeacher) ? 'disponibilidad_docente' : 'reduce_choques'
                moves.push({
                    course: block.courseCode,
                    group: block.groupLabel,
                    teacher: block.teacher,
                    deltaSlots: best.delta / SLOT,
                    reason,
                    sessions: block.sessions.map((s) => ({ day: s.day, from: hhmm(s.startMin), to: hhmm(s.endMin), startMin: s.startMin, endMin: s.endMin })),
                })
                improved = true
            }
        }
    }

    const after = snapshot(blocks, availabilityByTeacher)
    return {
        proposal: blocks,
        diff: moves,
        report: {
            teacherViolations: { before: before.teacherViolations, after: after.teacherViolations },
            crossCycleConflicts: { before: before.crossCycleConflicts, after: after.crossCycleConflicts },
            roomConflicts: { before: before.roomConflicts, after: after.roomConflicts },
            sameCycleConflicts: { before: before.sameCycleConflicts, after: after.sameCycleConflicts },
            moves: moves.length,
            note: 'hipótesis de reprogramación, sujeta a aprobación de la dirección',
        },
    }
}

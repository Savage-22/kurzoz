// #11 · Ranking de planes por objetivos. Puro. Puntúa cada horario candidato
// con tres métricas y los ordena por un puntaje ponderado configurable:
//   1. cantidad de cursos (avance),
//   2. desbloqueo (cuántos cursos futuros habilita cada curso incluido),
//   3. comodidad (penaliza huecos, madrugadas y días sobrecargados).
// Los pesos por defecto hacen dominante la cantidad de cursos; el desbloqueo y
// la comodidad desempatan. Cambiar los pesos reordena de forma coherente.

const DEFAULT_WEIGHTS = { courses: 1000, unlock: 10, comfort: 50 }

const EARLY_MIN = 420 // 07:00: empezar antes se penaliza
const LONG_DAY_MIN = 480 // 8 h de span en un día se considera sobrecarga

// Comodidad en (0,1]: 1 = sin huecos, sin madrugadas, días equilibrados.
const comfortScore = (sections) => {
    const byDay = new Map()
    for (const section of sections) {
        for (const s of section.sessions) {
            if (!byDay.has(s.day)) byDay.set(s.day, [])
            byDay.get(s.day).push(s)
        }
    }
    let penalty = 0
    for (const sessions of byDay.values()) {
        sessions.sort((a, b) => a.startMin - b.startMin)
        for (let i = 1; i < sessions.length; i++) penalty += Math.max(0, sessions[i].startMin - sessions[i - 1].endMin)
        penalty += sessions.filter((s) => s.startMin < EARLY_MIN).length * 30
        const span = sessions[sessions.length - 1].endMin - sessions[0].startMin
        penalty += Math.max(0, span - LONG_DAY_MIN)
    }
    return 1 / (1 + penalty / 120)
}

export const rankPlans = (plans, { weights = {}, unlockByCourse = new Map() } = {}) => {
    const w = { ...DEFAULT_WEIGHTS, ...weights }

    const scored = plans.map((plan) => {
        const courses = plan.courses.length
        const unlock = plan.courses.reduce((sum, c) => sum + (unlockByCourse.get(c.code) || 0), 0)
        const comfort = comfortScore(plan.sections)
        const score = w.courses * courses + w.unlock * unlock + w.comfort * comfort
        return {
            ...plan,
            score,
            breakdown: {
                courses,
                credits: plan.credits,
                unlock,
                comfort: Number(comfort.toFixed(3)),
                contributions: {
                    courses: w.courses * courses,
                    unlock: w.unlock * unlock,
                    comfort: Number((w.comfort * comfort).toFixed(2)),
                },
            },
        }
    })

    return scored.sort((a, b) => b.score - a.score)
}

// Desbloqueo por curso: cuántos cursos lo tienen como prerrequisito.
export const buildUnlockIndex = (prerequisites) => {
    const unlock = new Map()
    for (const p of prerequisites) unlock.set(p.requiresCode, (unlock.get(p.requiresCode) || 0) + 1)
    return unlock
}

// #11 · Ranking de planes por objetivos. Puro. Puntúa cada horario candidato
// con tres métricas y los ordena por un puntaje ponderado configurable:
//   1. cantidad de cursos (avance),
//   2. prioridad de grafo (obligatorios, cuellos de botella y correlativos que
//      abren cursos del próximo ciclo — ver coursePriority),
//   3. comodidad (penaliza huecos, madrugadas y días sobrecargados).
// Los pesos por defecto hacen dominante la cantidad, pero la prioridad pesa lo
// suficiente para que un curso que abre un obligatorio del siguiente ciclo
// compita con llevar un curso más. Cambiar los pesos reordena de forma coherente.

// Por defecto la cantidad de cursos domina (objetivo #1): entre planes de igual
// cantidad, la prioridad de grafo ordena y los estratégicos quedan etiquetados.
// Subir `priority` hace que un correlativo que abre un curso del próximo ciclo
// pueda valer más que llevar un curso extra.
const DEFAULT_WEIGHTS = { courses: 1000, priority: 6, comfort: 40 }

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

export const rankPlans = (plans, { weights = {}, priorityByCourse = new Map() } = {}) => {
    const w = { ...DEFAULT_WEIGHTS, ...weights }
    const priorityOf = (code) => priorityByCourse.get(code)?.score ?? 0

    const scored = plans.map((plan) => {
        const courses = plan.courses.length
        const priority = plan.courses.reduce((sum, c) => sum + priorityOf(c.code), 0)
        const comfort = comfortScore(plan.sections)
        const score = w.courses * courses + w.priority * priority + w.comfort * comfort

        // Cursos estratégicos incluidos (los que abren un curso del próximo ciclo).
        const strategic = plan.courses
            .filter((c) => (priorityByCourse.get(c.code)?.factors.opensNextTerm ?? 0) > 0)
            .map((c) => c.code)

        return {
            ...plan,
            score,
            breakdown: {
                courses,
                credits: plan.credits,
                priority,
                comfort: Number(comfort.toFixed(3)),
                strategic,
                contributions: {
                    courses: w.courses * courses,
                    priority: w.priority * priority,
                    comfort: Number((w.comfort * comfort).toFixed(2)),
                },
            },
        }
    })

    return scored.sort((a, b) => b.score - a.score)
}

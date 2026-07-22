// Hechos deterministas de un plan, listos para que la IA los narre. Puro. Toma
// el plan rankeado (con su breakdown), la alternativa (segundo mejor) y la
// prioridad de grafo, y produce: (1) los datos estructurados que se le pasan a
// la IA, (2) un texto de respaldo 100% determinista para cuando la IA no está.
// La IA solo reformula estos hechos; jamás decide qué es correcto.

const nameOf = (nameByCode, code) => nameByCode.get(code) || code
const pct = (x) => `${Math.round(x * 100)}%`

// Cómo se compara el plan elegido contra la alternativa, en una frase.
const describeTradeoff = (plan, runnerUp) => {
    const count = plan.courses.length
    const altCount = runnerUp.courses.length
    if (count > altCount) return `lleva ${count - altCount} curso(s) más`
    if (count === altCount) {
        const comfort = plan.breakdown?.comfort ?? 0
        const altComfort = runnerUp.breakdown?.comfort ?? 0
        if (comfort > altComfort) return 'con la misma cantidad de cursos resulta más cómodo (menos huecos/madrugadas)'
        if ((plan.breakdown?.strategic?.length ?? 0) > (runnerUp.breakdown?.strategic?.length ?? 0)) {
            return 'con la misma cantidad de cursos prioriza correlativos que abren cursos del próximo ciclo'
        }
    }
    return 'ofrece un mejor balance entre avance, prioridad y comodidad'
}

const buildFallbackText = (data) => {
    const parts = [`Este horario lleva ${data.courseCount} curso(s) (${data.credits} créditos)`]
    if (data.comfort != null) parts[0] += ` con una comodidad de ${pct(data.comfort)}`
    parts[0] += '.'
    if (data.strategic.length > 0) {
        const names = data.strategic.map((s) => `${s.name} (${s.code})`).join(', ')
        parts.push(`Incluye ${names}, que abre cursos del próximo ciclo y destraba correlativos.`)
    }
    if (data.alternative) parts.push(`Frente a la siguiente mejor opción, ${data.alternative.tradeoff}.`)
    return parts.join(' ')
}

export const buildExplanationFacts = ({ plan, runnerUp, priorityByCourse, nameByCode }) => {
    const courses = plan.courses.map((c) => ({ code: c.code, name: nameOf(nameByCode, c.code), group: c.group }))
    const strategic = (plan.breakdown?.strategic ?? []).map((code) => {
        const factors = priorityByCourse.get(code)?.factors ?? {}
        return {
            code,
            name: nameOf(nameByCode, code),
            abreProximoCiclo: factors.opensNextTerm ?? 0,
            destrabaCursos: factors.unlockCount ?? 0,
        }
    })
    const alternative = runnerUp
        ? {
              courseCount: runnerUp.courses.length,
              comfort: runnerUp.breakdown?.comfort ?? null,
              tradeoff: describeTradeoff(plan, runnerUp),
          }
        : null

    const data = {
        courseCount: courses.length,
        credits: plan.credits,
        comfort: plan.breakdown?.comfort ?? null,
        courses,
        strategic,
        leftOut: (plan.leftOut ?? []).map((code) => ({ code, name: nameOf(nameByCode, code) })),
        alternative,
    }

    return {
        data,
        fallbackText: buildFallbackText(data),
        summary: { courseCount: courses.length, credits: plan.credits, comfort: data.comfort, courses, strategic: strategic.map((s) => s.code) },
    }
}

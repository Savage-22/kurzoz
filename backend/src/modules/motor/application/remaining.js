// #7 · Cálculo de cursos faltantes. Puro: recibe malla + estado del alumno +
// equivalencias, devuelve lo que falta para egresar. Un curso está hecho si
// está APROBADO directamente o por equivalencia con un curso viejo aprobado.

// Créditos totales del plan 2026. Los electivos se eligen (no se llevan los 8),
// así que los créditos por aprobar son plan − aprobados, no la suma de todos
// los cursos pendientes. Coincide con el resumen del avance.
const PLAN_CREDITS_2026 = 228

export const computeRemaining = ({ courses, studentStatus, equivalences }, planCredits = PLAN_CREDITS_2026) => {
    const approved = new Set(studentStatus.filter((s) => s.status === 'APROBADO').map((s) => s.code))
    const currentCodes = new Set(courses.map((c) => c.code))

    // Equivalencia: si el alumno aprobó un curso de la malla VIEJA, el nuevo
    // cuenta como hecho. Se exige que el código viejo no sea también un curso
    // vigente, porque los espacios de códigos viejo/nuevo colisionan y el avance
    // ya trae las convalidaciones aplicadas con códigos nuevos.
    const done = new Set(approved)
    for (const { oldCode, newCode } of equivalences) {
        if (approved.has(oldCode) && !currentCodes.has(oldCode)) done.add(newCode)
    }

    const remaining = courses
        .filter((c) => !done.has(c.code))
        .map((c) => ({
            code: c.code,
            name: c.name,
            credits: c.credits,
            cycleNumber: c.cycleNumber,
            cycleParity: c.cycleParity,
            type: c.type,
        }))

    const creditsOf = (list) => list.reduce((sum, c) => sum + c.credits, 0)
    const obligatorios = remaining.filter((c) => c.type === 'OBL')
    const electivos = remaining.filter((c) => c.type === 'ELEC')

    const creditsApproved = courses.filter((c) => done.has(c.code)).reduce((s, c) => s + c.credits, 0)

    return {
        remaining,
        counts: { total: remaining.length, obligatorios: obligatorios.length, electivos: electivos.length },
        creditsApproved,
        // Créditos que aún faltan para el plan (electivos incluidos como cupo).
        creditsRemaining: Math.max(0, planCredits - creditsApproved),
        // Suma de créditos de TODOS los cursos pendientes disponibles (los
        // electivos suman de más porque no se llevan todos).
        creditsAvailablePending: creditsOf(remaining),
    }
}

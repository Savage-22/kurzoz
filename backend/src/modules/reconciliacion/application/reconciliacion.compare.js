// Compara el estado por-curso del avance (fuente de verdad) contra lo que dice
// el Excel "Por llevar". Puro: sin I/O. No decide nada sobre la base; solo
// señala discrepancias para revisión.

// Un curso está "completado" si el avance lo tiene APROBADO. EN_CURSO y
// PENDIENTE cuentan como no completado (aún no rinde). El Excel lo considera
// completado si está convalidado.
const isCompleted = (status) => status === 'APROBADO'

export const reconcile = ({ avanceByCode, porLlevar }) => {
    const discrepancies = []
    let compared = 0
    let agreements = 0

    for (const { code, convalidado } of porLlevar) {
        const status = avanceByCode.get(code)
        if (status === undefined) continue // el Excel lista un curso que el avance no tiene
        compared++

        const excelCompleted = convalidado
        const avanceCompleted = isCompleted(status)
        if (excelCompleted === avanceCompleted) {
            agreements++
            continue
        }

        discrepancies.push({
            code,
            excel: convalidado ? 'CONVALIDADO' : 'POR LLEVAR',
            avance: status,
            detail: avanceCompleted
                ? 'el Excel lo marca por llevar, pero el avance lo tiene aprobado'
                : 'el Excel lo marca convalidado, pero el avance lo tiene sin aprobar',
        })
    }

    return { compared, agreements, discrepancies }
}

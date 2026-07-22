// Interpreta las filas del avance (celdas {x, text}) como estado por-curso del
// alumno. Puro: sin I/O ni base de datos. La regla clave: si la fila trae nota,
// el curso está APROBADO; si no, PENDIENTE.

const CODE_CELL = /^(\d{4})\s+(.+)$/       // "1101 CIENCIAS MATEMÁTICAS"
const CREDITS = /^\d+\.\d{2}$/             // "6.00"
const GRADE = /^\d{1,2}$/                  // "15" (0..20)
const DATE = /^\d{2}\/\d{2}\/\d{4}$/       // "11/12/2023"
const STUDENT = /^(.+?)\s*\((\d{6,})\)$/   // "APELLIDOS NOMBRES (2023110208)"
const TYPE = { OBLIGATORIO: 'OBL', ELECTIVO: 'ELEC' }

// Extrae un curso de una fila, o null si la fila no es un curso (encabezado de
// año, resumen, etc.). Distingue índice (antes del código) de nota (después).
const parseCourseRow = (cells) => {
    const sorted = [...cells].sort((a, b) => a.x - b.x)
    const codeIndex = sorted.findIndex((c) => CODE_CELL.test(c.text))
    if (codeIndex === -1) return null

    const [, code, inlineName] = sorted[codeIndex].text.match(CODE_CELL)
    const after = sorted.slice(codeIndex + 1)

    const creditsCell = after.find((c) => CREDITS.test(c.text))
    const gradeCell = after.find((c) => GRADE.test(c.text) && Number(c.text) <= 20)
    const dateCell = after.find((c) => DATE.test(c.text))
    const typeCell = after.find((c) => TYPE[c.text.toUpperCase()])

    const grade = gradeCell ? Number(gradeCell.text) : null
    return {
        code,
        name: inlineName.trim(),
        credits: creditsCell ? Number(creditsCell.text) : null,
        grade,
        date: dateCell ? dateCell.text : null,
        type: typeCell ? TYPE[typeCell.text.toUpperCase()] : null,
        status: grade === null ? 'PENDIENTE' : 'APROBADO',
    }
}

export const parseAvance = (rows) => {
    let student = null
    let approvedCreditsReported = null
    let pendingCreditsReported = null
    const courses = []

    for (const cells of rows) {
        for (const { text } of cells) {
            if (!student) {
                const m = text.match(STUDENT)
                if (m) student = { id: m[2], name: m[1].trim() }
            }
            const approved = text.match(/CRÉDITOS APROBADOS:\s*(\d+)/i)
            if (approved) approvedCreditsReported = Number(approved[1])
            const pending = text.match(/CRÉDITOS POR APROBAR:\s*(\d+)/i)
            if (pending) pendingCreditsReported = Number(pending[1])
        }

        const course = parseCourseRow(cells)
        if (course && course.credits !== null) courses.push(course)
    }

    return { student, approvedCreditsReported, pendingCreditsReported, courses }
}

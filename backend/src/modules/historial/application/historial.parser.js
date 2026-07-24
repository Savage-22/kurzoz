// Interpreta las filas del historial de notas (celdas {x, text}) como
// desglose semestre a semestre del alumno. Puro: sin I/O ni base de datos.

const CODE_CELL = /^(\d{4})\s+(.+)$/       // "1101 CALCULO DIFERENCIAL"
const CREDITS = /^\d+\.\d{2}$/             // "4.00"
const GRADE = /^\d{1,2}$/                  // "11" (0..20)
const GRADE_TEXT = /^\d+\s+\w+$/           // "11 ONCE", "13 TRECE"
const DATE = /^\d{2}\/\d{2}\/\d{4}$/       // "31/07/2023"
const STUDENT = /^(.+?)\s*\((\d{6,})\)$/   // "APELLIDOS NOMBRES (2023110208)"
const SEMESTER = /^AÑO ACADÉMICO:\s*(\d{4})\s*-\s*(I{1,3}|IV|V)$/i  // "AÑO ACADÉMICO: 2023 - I"
const GROUP = /^\d{2}$/                     // "01", "02"

// Modalidades conocidas (pueden aparecer en múltiples líneas)
const MODALITY_KEYWORDS = {
    REGULAR: 'REGULAR',
    CONVALIDACION: 'CONVALIDACION',
    'DIRIGIDO': 'DIRIGIDO-MOVILIDAD',
    'MOVILIDAD': 'DIRIGIDO-MOVILIDAD',
    'CURSO DE VERANO': 'CURSO DE VERANO',
    'PASANTIA': 'CONVALIDACION POR PASANTIA',
}

// Extrae el número de nota de texto como "11 ONCE" → 11
const extractGrade = (text) => {
    if (!text) return null
    const m = text.match(/^(\d{1,2})\s/)
    if (!m) return null
    const n = Number(m[1])
    return n >= 0 && n <= 20 ? n : null
}

// Detecta modalidad de una o más celdas
const detectModality = (cells) => {
    const joined = cells.map((c) => c.text.toUpperCase()).join(' ')
    for (const [keyword, modality] of Object.entries(MODALITY_KEYWORDS)) {
        if (joined.includes(keyword)) return modality
    }
    return null
}

// Parsea una fila de curso, o null si no lo es.
const parseCourseRow = (cells) => {
    const sorted = [...cells].sort((a, b) => a.x - b.x)
    const codeIndex = sorted.findIndex((c) => CODE_CELL.test(c.text))
    if (codeIndex === -1) return null

    const [, code, inlineName] = sorted[codeIndex].text.match(CODE_CELL)
    const after = sorted.slice(codeIndex + 1)

    const groupCell = after.find((c) => GROUP.test(c.text))
    const creditsCell = after.find((c) => CREDITS.test(c.text))
    const gradeTextCell = after.find((c) => GRADE_TEXT.test(c.text))
    const gradeCell = after.find((c) => GRADE.test(c.text) && !GRADE_TEXT.test(c.text))
    const dateCell = after.find((c) => DATE.test(c.text))

    // Detectar modalidad de las celdas restantes
    const modalityCells = after.filter((c) => {
        const upper = c.text.toUpperCase()
        return Object.keys(MODALITY_KEYWORDS).some((k) => upper.includes(k))
    })

    const grade = gradeCell ? Number(gradeCell.text) : (gradeTextCell ? extractGrade(gradeTextCell.text) : null)

    return {
        code,
        name: inlineName.trim(),
        group: groupCell?.text ?? null,
        credits: creditsCell ? Number(creditsCell.text) : null,
        grade,
        gradeText: gradeTextCell?.text ?? (grade !== null ? `${grade}` : null),
        date: dateCell?.text ?? null,
        modality: detectModality(modalityCells),
    }
}

// Detecta si una fila es un docente (empieza después de la columna de modalidad)
const isTeacherRow = (cells) => {
    const sorted = [...cells].sort((a, b) => a.x - b.x)
    // Los docentes aparecen en x >= 470 aproximadamente
    return sorted.every((c) => c.x >= 460) && sorted.some((c) => c.text.length > 3)
}

export const parseHistorial = (rows) => {
    let student = null
    let currentSemester = null
    const enrollments = []
    let currentCourse = null

    for (const cells of rows) {
        const sorted = [...cells].sort((a, b) => a.x - b.x)

        // Buscar nombre del alumno
        for (const { text } of sorted) {
            if (!student) {
                const m = text.match(STUDENT)
                if (m) student = { id: m[2], name: m[1].trim() }
            }
        }

        // Detectar semestre
        for (const { text } of sorted) {
            const m = text.match(SEMESTER)
            if (m) {
                const year = m[1]
                const period = m[2].toUpperCase()
                currentSemester = `${year}-${period}`
                currentCourse = null
            }
        }

        // Detectar fila de docente (continuación de la fila anterior)
        if (isTeacherRow(sorted) && currentCourse) {
            const teacher = sorted.map((c) => c.text).join(' ')
            currentCourse.professor = teacher
            continue
        }

        // Intentar parsear como curso
        const course = parseCourseRow(sorted)
        if (course && course.credits !== null && currentSemester) {
            // Si había un curso pendiente, guardarlo
            if (currentCourse) {
                enrollments.push({ ...currentCourse, semester: currentSemester })
            }
            currentCourse = {
                ...course,
                professor: null,
            }
        }
    }

    // Guardar el último curso
    if (currentCourse && currentSemester) {
        enrollments.push({ ...currentCourse, semester: currentSemester })
    }

    return { student, enrollments }
}

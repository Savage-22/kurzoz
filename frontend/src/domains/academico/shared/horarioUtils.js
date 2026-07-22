// Utilidades puras compartidas por la grilla y el comparador.

export const DAYS = [
    { n: 1, label: 'Lun' },
    { n: 2, label: 'Mar' },
    { n: 3, label: 'Mié' },
    { n: 4, label: 'Jue' },
    { n: 5, label: 'Vie' },
]

export const SLOT = 45
export const DAY_START = 375 // 06:15

export const toHHMM = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`

// Clases de color por curso. Deben ser strings literales completos para que el
// scanner de Tailwind las genere (no admite nombres de clase construidos al vuelo).
const COURSE_BG = ['bg-course-1', 'bg-course-2', 'bg-course-3', 'bg-course-4', 'bg-course-5', 'bg-course-6']

// Asigna un color estable a cada curso por su código, para la grilla.
export const courseBg = (code) => COURSE_BG[Number(String(code).replace(/\D/g, '')) % COURSE_BG.length]

// "07:45-09:15" -> { startMin, endMin }
export const parseRange = (range) => {
    const [a, b] = range.split('-').map((t) => t.trim())
    const toMin = (t) => {
        const [h, m] = t.split(':').map(Number)
        return h * 60 + m
    }
    return { startMin: toMin(a), endMin: toMin(b) }
}

// Detecta, en cliente, qué cursos de un conjunto de secciones se solapan (para
// resaltar choques en la grilla). Solape estricto: tocarse en el borde no cuenta.
export const detectOverlaps = (sections) => {
    const conflicted = new Set()
    for (let i = 0; i < sections.length; i++) {
        for (let j = i + 1; j < sections.length; j++) {
            for (const a of sections[i].sessions ?? []) {
                for (const b of sections[j].sessions ?? []) {
                    if (a.day === b.day && a.startMin < b.endMin && b.startMin < a.endMin) {
                        conflicted.add(sections[i].courseCode)
                        conflicted.add(sections[j].courseCode)
                    }
                }
            }
        }
    }
    return conflicted
}

// Aplica una propuesta de ajuste (#12) a las secciones para previsualizar el
// resultado hipotético en la grilla. No muta las secciones originales.
export const applyProposal = (sections, proposal) => {
    if (!proposal) return sections
    if (proposal.type === 'NUEVO_GRUPO') {
        // El bloque nuevo puede tener varias sesiones (HT+HP); si vienen, se pintan
        // todas. Fallback a una sola sesión para compatibilidad con propuestas viejas.
        const sessions = proposal.sessions?.length
            ? proposal.sessions.map((s) => ({ day: s.day, startMin: s.startMin, endMin: s.endMin }))
            : [{ day: proposal.day, ...parseRange(proposal.to) }]
        return [...sections, { courseCode: proposal.course, groupLabel: proposal.group, sessions, nuevo: true }]
    }
    // MOVER: corre el bloque del curso en el día indicado, de `from` a `to`.
    const from = parseRange(proposal.from)
    const to = parseRange(proposal.to)
    return sections.map((section) => {
        if (section.courseCode !== proposal.course) return section
        return {
            ...section,
            sessions: (section.sessions ?? []).map((s) =>
                s.day === proposal.day && s.startMin === from.startMin ? { ...s, ...to } : s,
            ),
        }
    })
}

// Rango de minutos que cubre un conjunto de secciones (para dimensionar la grilla).
export const timeBounds = (sections) => {
    let min = 24 * 60
    let max = 0
    for (const s of sections) {
        for (const se of s.sessions ?? []) {
            min = Math.min(min, se.startMin)
            max = Math.max(max, se.endMin)
        }
    }
    if (max === 0) return { min: DAY_START, max: DAY_START + SLOT * 12 }
    // Redondea a slots completos, con un pequeño margen.
    return { min: Math.min(min, DAY_START), max }
}

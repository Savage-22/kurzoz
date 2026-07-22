// Interpreta las filas del horario y de la carga (celdas {x, y, text} + la
// calibración de columnas de cada página) como oferta 2026-II: offering (curso
// + docente + HT/HP), section (grupo) y session (día, horas en minutos, aula).
// Puro: sin I/O ni base de datos.

const CODE = /^\d{4}$/
const TIME = /(\d{1,2}):(\d{2})/g
const GROUP_TOKEN = /^(ÚNICO|\d{1,2})$/
const NAME_GROUP_TEACHER = /^(.+?)\s+(ÚNICO|\d{1,2})\s*(.*)$/
const PAVILION = /(SL\d+-PABELL[ÓO]N|FUERA DEL CAMPUS)/i

const toMinutes = (h, m) => Number(h) * 60 + Number(m)

const inferKind = (room) => {
    if (!room) return null
    return /LABORATORIO|TALLER|\bLAB\b/i.test(room) ? 'PRACTICA' : 'TEORIA'
}

// Une los fragmentos de una columna (celdas apiladas en varias líneas) en un
// solo texto, respetando el orden visual (arriba→abajo, izquierda→derecha).
const joinColumn = (cells) =>
    cells
        .sort((a, b) => b.y - a.y || a.x - b.x)
        .map((c) => c.text)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()

// HT/HP por código desde la carga docente, SOLO de filas cuya Escuela
// Profesional es Ingeniería de Sistemas (el mismo código significa cursos
// distintos en otras escuelas). Los tres últimos numéricos son HT, HP, TH.
export const parseCarga = (cargaRows) => {
    const byCode = new Map()
    for (const cells of cargaRows) {
        if (!cells.some((c) => c.text === 'INGENIERÍA DE SISTEMAS')) continue
        // "2026" es el plan de estudios (también 4 dígitos): no es el código del curso.
        const code = cells.find((c) => CODE.test(c.text) && c.text !== '2026')?.text
        if (!code || byCode.has(code)) continue
        const nums = cells.filter((c) => /^\d{1,2}$/.test(c.text) && c.x > 500).sort((a, b) => a.x - b.x)
        if (nums.length >= 2) byCode.set(code, { ht: Number(nums[0].text), hp: Number(nums[1].text) })
    }
    return byCode
}

const parseRoom = (cells, calib) => {
    const aulaStart = (calib.pabellonX + calib.aulaX) / 2
    const pavilionText = joinColumn(cells.filter((c) => c.x >= calib.pabellonX - 6 && c.x < aulaStart))
    const roomText = joinColumn(cells.filter((c) => c.x >= aulaStart))
    const pavilionMatch = pavilionText.match(PAVILION)
    const pavilion = pavilionMatch ? pavilionText : (pavilionText || null)
    return { pavilion: pavilion || null, room: roomText || null }
}

// Extrae las sesiones de una fila lógica del horario (o [] si no es curso).
const parseRow = (cells, calib) => {
    const code = cells.find((c) => CODE.test(c.text) && c.x < 75)?.text
    if (!code) return []

    // Grupo y docente. Dos formatos conviven en el PDF:
    //  - separados: grupo ("ÚNICO"/"01") y docente en la columna grupo/docente;
    //  - fusionados: "NOMBRE ÚNICO DOCENTE" todo en la celda del nombre.
    // El grupo es un token exacto; el docente puede venir partido en varias
    // líneas (el código va en la del medio), así que se une por columna.
    const nameCells = cells.filter((c) => c.x >= 75 && c.x < calib.grupoDocenteX - 6)
    const gdCells = cells.filter((c) => c.x >= calib.grupoDocenteX - 6 && c.x < calib.cicloX - 4)
    const groupCell = gdCells.find((c) => GROUP_TOKEN.test(c.text))

    let group = 'ÚNICO'
    let teacher = ''
    if (groupCell) {
        group = groupCell.text
        teacher = joinColumn(gdCells.filter((c) => c !== groupCell))
    } else {
        const combined = `${joinColumn(nameCells)} ${joinColumn(gdCells)}`.trim()
        const m = combined.match(NAME_GROUP_TEACHER)
        if (m) { group = m[2]; teacher = m[3].trim() }
    }

    const { pavilion, room } = parseRoom(cells, calib)
    const kind = inferKind(room)

    // Cada día: junta los fragmentos de hora de esa columna y arma el rango.
    const sessions = []
    for (const day of [1, 2, 3, 4, 5]) {
        const dayX = calib.dayRefs[day]
        const timeText = joinColumn(cells.filter((c) => Math.abs(c.x - dayX) <= 18 && /\d{1,2}:\d{2}/.test(c.text)))
        if (!timeText) continue
        const times = [...timeText.matchAll(TIME)]
        if (times.length < 2) continue
        const start = times[0]
        const end = times[times.length - 1]
        sessions.push({
            courseCode: code,
            teacher,
            groupLabel: group,
            day,
            startMin: toMinutes(start[1], start[2]),
            endMin: toMinutes(end[1], end[2]),
            kind,
            pavilion,
            room,
        })
    }
    return sessions
}

// Fusiona sesiones contiguas/solapadas de la misma sección, día, aula y tipo.
const mergeSessions = (sessions) => {
    const key = (s) => `${s.courseCode}|${s.teacher}|${s.groupLabel}|${s.day}|${s.room}|${s.kind}`
    const groups = new Map()
    for (const s of sessions) {
        if (!groups.has(key(s))) groups.set(key(s), [])
        groups.get(key(s)).push(s)
    }
    const merged = []
    for (const group of groups.values()) {
        group.sort((a, b) => a.startMin - b.startMin)
        let current = null
        for (const s of group) {
            if (current && s.startMin <= current.endMin) current.endMin = Math.max(current.endMin, s.endMin)
            else { current = { ...s }; merged.push(current) }
        }
    }
    return merged
}

export const parseHorario = ({ horarioPages, cargaRows }) => {
    const cargaByCode = parseCarga(cargaRows)
    const rawSessions = []
    for (const { calib, rows } of horarioPages) {
        for (const cells of rows) rawSessions.push(...parseRow(cells, calib))
    }
    // Reconcilia el docente por (curso, grupo): un mismo grupo tiene un solo
    // docente, pero según la fila puede salir partido o vacío. Se toma el más
    // completo y se aplica a todas sus sesiones, para no fragmentar offerings.
    const teacherByGroup = new Map()
    for (const s of rawSessions) {
        const key = `${s.courseCode}|${s.groupLabel}`
        const best = teacherByGroup.get(key) || ''
        if (s.teacher.length > best.length) teacherByGroup.set(key, s.teacher)
    }
    for (const s of rawSessions) s.teacher = teacherByGroup.get(`${s.courseCode}|${s.groupLabel}`) || ''

    const sessions = mergeSessions(rawSessions)

    const offerings = new Map()
    const sections = new Map()
    for (const s of sessions) {
        const offKey = `${s.courseCode}|${s.teacher}`
        if (!offerings.has(offKey)) {
            const carga = cargaByCode.get(s.courseCode) || { ht: null, hp: null }
            offerings.set(offKey, { courseCode: s.courseCode, teacher: s.teacher, ht: carga.ht, hp: carga.hp })
        }
        const secKey = `${offKey}|${s.groupLabel}`
        if (!sections.has(secKey)) sections.set(secKey, { courseCode: s.courseCode, teacher: s.teacher, groupLabel: s.groupLabel })
    }
    return { offerings: [...offerings.values()], sections: [...sections.values()], sessions }
}

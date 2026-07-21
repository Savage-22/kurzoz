// Transformaciones puras de los datos crudos del Excel al modelo de dominio.
// Sin I/O ni BD: se prueban en aislamiento.

const ROMAN_CYCLE = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10 }

// "III Ciclo" -> 3. Devuelve null si no reconoce el ciclo.
export const parseCycleNumber = (cycleText) => {
    const roman = String(cycleText ?? '').replace(/ciclo/i, '').trim().toUpperCase()
    return ROMAN_CYCLE[roman] ?? null
}

// "Obligatorio" -> 'OBL', "Electivo" -> 'ELEC'. null si no reconoce el tipo.
export const parseType = (typeText) => {
    const value = String(typeText ?? '').trim().toLowerCase()
    if (value.startsWith('oblig')) return 'OBL'
    if (value.startsWith('elect')) return 'ELEC'
    return null
}

// Código válido = 4 dígitos. Normaliza a string (Excel puede leerlo como número).
export const normalizeCode = (raw) => {
    const code = String(raw ?? '').trim()
    return /^\d{4}$/.test(code) ? code : null
}

// Parsea la columna de requisito de la malla nueva.
//   "Ninguno" / "" -> []
//   "1101"          -> [{ requiresCode: '1101', kind: 'Y', orGroup: null }]
//   "4102 y 4103"   -> dos filas Y
//   "A o B"          -> dos filas O compartiendo or_group (alternativas)
// La malla plana no anida "y"/"o", así que el conector dominante define el kind.
export const parsePrerequisites = (reqText) => {
    const text = String(reqText ?? '').trim()
    if (text === '' || /^ninguno$/i.test(text) || /no convalida/i.test(text)) return []

    const isOr = /\bo\b/i.test(text)
    const codes = text
        .split(/\s+(?:y|o)\s+/i)
        .map((token) => normalizeCode(token))
        .filter((code) => code !== null)

    return codes.map((requiresCode) => ({
        requiresCode,
        kind: isOr ? 'O' : 'Y',
        orGroup: isOr ? 1 : null,
    }))
}

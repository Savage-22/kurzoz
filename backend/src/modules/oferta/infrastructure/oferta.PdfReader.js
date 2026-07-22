// Lee la Resolución de carga lectiva (PDF) y devuelve, solo para INGENIERÍA DE
// SISTEMAS y término 2026 - II, las filas del HORARIO LECTIVO (agrupadas por
// curso) y las filas del REPORTE DE CARGA. No interpreta el significado de las
// columnas; eso es del parser puro. Sí resuelve dos cosas propias del PDF:
//   1. filtra la marca de agua (texto rotado);
//   2. las filas del horario son multilínea (el código va en la línea del
//      medio, con nombre/hora partidos arriba y abajo), así que las reconstruye
//      anclándose en el código y agrupando por cercanía vertical.
import { readFile } from 'node:fs/promises'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'

const ROW_TOLERANCE = 3
const CAREER = 'INGENIERÍA DE SISTEMAS'
const HORARIO_MARK = 'HORARIO LECTIVO (2026 - II)'
const CARGA_MARK = 'CARGA LECTIVA 2026 - II'
const CODE = /^\d{4}$/

const straightCells = (items) =>
    items
        .filter((it) => Math.abs(it.transform[1]) < 0.01 && Math.abs(it.transform[2]) < 0.01 && it.str.trim())
        .map((it) => ({ x: Math.round(it.transform[4]), y: Math.round(it.transform[5]), text: it.str.trim() }))

const groupByRow = (cells) => {
    const rows = []
    for (const cell of cells.sort((a, b) => b.y - a.y || a.x - b.x)) {
        const row = rows.find((r) => Math.abs(r.y - cell.y) <= ROW_TOLERANCE)
        if (row) row.cells.push(cell)
        else rows.push({ y: cell.y, cells: [cell] })
    }
    return rows.map((r) => r.cells)
}

// Calibra la geometría de columnas del horario desde su fila de encabezado.
const calibrate = (cells) => {
    const header = cells.find((row) => row.some((c) => /^Martes/i.test(c.text)) && row.some((c) => /^Viernes/i.test(c.text)))
    if (!header) return null
    const xOf = (re) => header.find((c) => re.test(c.text))?.x
    const mar = xOf(/^Martes/i), mie = xOf(/^Mi[ée]rcoles/i), jue = xOf(/^Jueves/i), vie = xOf(/^Viernes/i)
    const grupoDocenteX = xOf(/Grupo/i)
    const cicloX = xOf(/Ciclo/i)
    const pabellonX = xOf(/Pabellon/i)
    const aulaX = xOf(/^Aula/i)
    if ([mar, mie, jue, vie, grupoDocenteX, cicloX, pabellonX, aulaX].some((v) => v === undefined)) return null
    const step = mie - mar
    return {
        dayRefs: { 1: mar - step, 2: mar, 3: mie, 4: jue, 5: vie },
        grupoDocenteX,
        cicloX,
        pabellonX,
        aulaX,
    }
}

// Reconstruye las filas lógicas del horario: cada curso está anclado por su
// código; las líneas vecinas (± medio salto entre códigos) son parte de la
// misma fila. Devuelve, por fila, todas sus celdas.
const bandByCode = (allCells) => {
    const anchors = allCells
        .filter((c) => CODE.test(c.text) && c.x < 75)
        .sort((a, b) => b.y - a.y)
    if (anchors.length === 0) return []

    return anchors.map((anchor, i) => {
        const prevY = i > 0 ? anchors[i - 1].y : anchor.y + 16
        const nextY = i < anchors.length - 1 ? anchors[i + 1].y : anchor.y - 16
        const upper = Math.min((prevY + anchor.y) / 2, anchor.y + 8)
        const lower = Math.max((anchor.y + nextY) / 2, anchor.y - 8)
        return allCells.filter((c) => c.y > lower && c.y <= upper)
    })
}

export const readResolucion = async (filePath) => {
    const data = new Uint8Array(await readFile(filePath))
    const doc = await getDocument({ data, useSystemFonts: true }).promise

    const horarioPages = []
    const cargaRows = []
    for (let p = 1; p <= doc.numPages; p++) {
        const page = await doc.getPage(p)
        const content = await page.getTextContent()
        const cells = straightCells(content.items)
        const rows = groupByRow(cells)
        const pageText = rows.map((row) => row.map((c) => c.text).join(' ')).join('\n')

        if (pageText.includes(CAREER) && pageText.includes(HORARIO_MARK)) {
            const calib = calibrate(rows)
            if (calib) horarioPages.push({ calib, rows: bandByCode(cells) })
        } else if (pageText.includes(CAREER) && pageText.includes(CARGA_MARK)) {
            cargaRows.push(...rows)
        }
    }
    await doc.destroy()
    return { horarioPages, cargaRows }
}

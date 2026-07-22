// Lee el "Resumen de Avance Curricular" (PDF) y devuelve sus filas ya
// reconstruidas como celdas {x, text}. El PDF trae una marca de agua diagonal
// ("UNHEVAL...") que se filtra por rotación: el texto real de la tabla está
// alineado a los ejes (b y c del transform ≈ 0). No interpreta columnas; eso
// es trabajo del parser puro.
import { readFile } from 'node:fs/promises'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'

const ROW_TOLERANCE = 3 // pt: celdas con y casi igual son la misma fila

// Agrupa celdas de una página en filas por su coordenada y (de arriba a abajo).
const groupIntoRows = (cells) => {
    const rows = []
    for (const cell of cells.sort((a, b) => b.y - a.y || a.x - b.x)) {
        const row = rows.find((r) => Math.abs(r.y - cell.y) <= ROW_TOLERANCE)
        if (row) row.cells.push({ x: cell.x, text: cell.text })
        else rows.push({ y: cell.y, cells: [{ x: cell.x, text: cell.text }] })
    }
    return rows
}

export const readAvanceRows = async (filePath) => {
    const data = new Uint8Array(await readFile(filePath))
    const doc = await getDocument({ data, useSystemFonts: true }).promise

    const rows = []
    for (let p = 1; p <= doc.numPages; p++) {
        const page = await doc.getPage(p)
        const content = await page.getTextContent()
        const cells = content.items
            // Descarta el watermark (texto rotado) y las celdas vacías.
            .filter((it) => Math.abs(it.transform[1]) < 0.01 && Math.abs(it.transform[2]) < 0.01 && it.str.trim())
            .map((it) => ({ x: Math.round(it.transform[4]), y: Math.round(it.transform[5]), text: it.str.trim() }))
        rows.push(...groupIntoRows(cells).map((r) => r.cells))
    }
    await doc.destroy()
    return rows
}

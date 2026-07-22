// Lee del Excel de convalidaciones las hojas de apoyo para reconciliar contra
// el avance: "Por llevar" (códigos nuevos con bandera Convalidado SÍ/NO) y
// "No Convalidados" (cursos de la malla vieja que no convalidan). El Excel es
// opcional y puede estar desactualizado; solo sirve de contraste.
import ExcelJS from 'exceljs'

const CODE = /^\d{4}$/

// Por llevar: [3]Código Nuevo, [7]Convalidado. Dedup por código; un curso se
// considera convalidado si alguna fila lo marca SÍ.
export const readPorLlevar = async (filePath) => {
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.readFile(filePath)
    const ws = wb.getWorksheet('Por llevar')
    if (!ws) return []

    const byCode = new Map()
    for (let r = 3; r <= ws.rowCount; r++) {
        const code = String(ws.getRow(r).getCell(3).value ?? '').trim()
        if (!CODE.test(code)) continue
        const convalidado = String(ws.getRow(r).getCell(7).value ?? '').trim().toUpperCase() === 'SÍ'
        byCode.set(code, byCode.get(code) || convalidado)
    }
    return [...byCode.entries()].map(([code, convalidado]) => ({ code, convalidado }))
}

// No Convalidados: [2]Código Actual (malla vieja), [3]Curso Actual.
export const readNoConvalidados = async (filePath) => {
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.readFile(filePath)
    const ws = wb.getWorksheet('No Convalidados')
    if (!ws) return []

    const rows = []
    for (let r = 4; r <= ws.rowCount; r++) {
        const oldCode = String(ws.getRow(r).getCell(2).value ?? '').trim()
        if (!CODE.test(oldCode)) continue
        rows.push({ oldCode, name: String(ws.getRow(r).getCell(3).value ?? '').trim() })
    }
    return rows
}

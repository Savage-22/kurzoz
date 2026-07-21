// Lee la hoja "Tabla General" del Excel de convalidaciones y devuelve filas
// crudas. Aísla exceljs del resto del módulo; no interpreta ni valida datos.
import ExcelJS from 'exceljs'

const SHEET_NAME = 'Tabla General'
const FIRST_DATA_ROW = 3

// Columnas (1-based) de la hoja.
const COL = {
    cycleText: 2, // B  Ciclo (del curso NUEVO; la hoja agrupa por ciclo de la malla 2026)
    oldCode: 3, //   C  Código Actual
    oldName: 4, //   D  Curso Actual
    yuo: 5, //       E  ¿Y u O? (lógica de convalidación viejo->nuevo)
    newCode: 9, //   I  Código Nuevo
    newName: 10, //  J  Curso Nuevo
    newCredits: 11, //K  Créditos Nue.
    newType: 12, //  L  Tipo Nue.
    newReq: 13, //   M  Requisito
}

const cell = (row, index) => row.getCell(index).value

// Devuelve las filas con Código Nuevo presente (incluye placeholders "NO
// CONVALIDA"; filtrarlos es responsabilidad del servicio).
export const readMallaRows = async (filePath) => {
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.readFile(filePath)

    const sheet = workbook.getWorksheet(SHEET_NAME)
    if (!sheet) throw new Error(`No se encontró la hoja "${SHEET_NAME}" en ${filePath}`)

    const rows = []
    for (let r = FIRST_DATA_ROW; r <= sheet.rowCount; r++) {
        const row = sheet.getRow(r)
        const newCode = cell(row, COL.newCode)
        if (newCode == null || String(newCode).trim() === '') continue

        rows.push({
            rowNumber: r,
            cycleText: String(cell(row, COL.cycleText) ?? '').trim(),
            oldCode: String(cell(row, COL.oldCode) ?? '').trim(),
            oldName: String(cell(row, COL.oldName) ?? '').trim(),
            yuo: String(cell(row, COL.yuo) ?? '').trim(),
            newCode: String(newCode).trim(),
            newName: String(cell(row, COL.newName) ?? '').trim(),
            newCredits: cell(row, COL.newCredits),
            newType: String(cell(row, COL.newType) ?? '').trim(),
            newReq: String(cell(row, COL.newReq) ?? '').trim(),
        })
    }
    return rows
}

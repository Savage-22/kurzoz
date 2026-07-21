// Importa la malla 2026 (cursos, prerrequisitos y equivalencias) desde el
// Excel de convalidaciones. Idempotente: re-correr no duplica. No aborta ante
// filas no parseables; las acumula en el reporte.
import { readMallaRows } from '../infrastructure/malla.ExcelReader.js'
import MallaModel from '../infrastructure/malla.Model.js'
import { normalizeCode, parseCycleNumber, parsePrerequisites, parseType } from './malla.parser.js'

// Nota de equivalencia: nombre del curso viejo y, si aplica, su lógica Y/O de
// convalidación (Y = se requieren varios juntos; O = cualquiera alternativa).
const buildNote = (row) => {
    const flag = ['Y', 'O'].includes(row.yuo.toUpperCase()) ? ` [${row.yuo.toUpperCase()}]` : ''
    return row.oldName ? `${row.oldName}${flag}` : null
}

class MallaService {
    static async importFromExcel(filePath) {
        const rows = await readMallaRows(filePath)
        const report = { courses: 0, prerequisites: 0, equivalences: 0, skipped: [], warnings: [] }

        // 1. Cursos únicos de la malla nueva (dedup por código nuevo).
        const courseByCode = new Map()
        for (const row of rows) {
            const code = normalizeCode(row.newCode)
            if (!code) {
                report.skipped.push(`Fila ${row.rowNumber}: código nuevo inválido ("${row.newCode}")`)
                continue
            }
            if (courseByCode.has(code)) continue

            const credits = Number(row.newCredits)
            const type = parseType(row.newType)
            const cycleNumber = parseCycleNumber(row.cycleText)
            if (!Number.isInteger(credits) || !type) {
                report.skipped.push(`Fila ${row.rowNumber}: curso ${code} sin créditos/tipo válidos`)
                continue
            }
            if (cycleNumber === null) {
                report.warnings.push(`Curso ${code}: ciclo no reconocido ("${row.cycleText}")`)
            }
            courseByCode.set(code, { code, name: row.newName, credits, type, cycleNumber, reqText: row.newReq })
        }

        // 2. Prerrequisitos con chequeo de integridad (todo requires_code existe como curso).
        const prerequisites = []
        for (const course of courseByCode.values()) {
            for (const prereq of parsePrerequisites(course.reqText)) {
                if (!courseByCode.has(prereq.requiresCode)) {
                    report.warnings.push(`Prereq de ${course.code}: ${prereq.requiresCode} no existe como curso; se omite`)
                    continue
                }
                prerequisites.push({ courseCode: course.code, ...prereq })
            }
        }

        // 3. Equivalencias viejo -> nuevo (dedup por par).
        const equivalenceByPair = new Map()
        for (const row of rows) {
            const newCode = normalizeCode(row.newCode)
            const oldCode = normalizeCode(row.oldCode)
            if (!newCode || !oldCode || oldCode === newCode) continue
            const key = `${oldCode}|${newCode}`
            if (!equivalenceByPair.has(key)) {
                equivalenceByPair.set(key, { oldCode, newCode, note: buildNote(row) })
            }
        }
        const equivalences = [...equivalenceByPair.values()]

        // 4. Persistencia atómica.
        const courses = [...courseByCode.values()]
        await MallaModel.withTransaction(async (client) => {
            await MallaModel.upsertCourses(client, courses)
            await MallaModel.replacePrerequisites(client, prerequisites)
            await MallaModel.replaceEquivalences(client, equivalences)
        })

        report.courses = courses.length
        report.prerequisites = prerequisites.length
        report.equivalences = equivalences.length
        return report
    }
}

export default MallaService

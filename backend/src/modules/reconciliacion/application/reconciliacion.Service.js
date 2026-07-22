// Reconcilia el estado del alumno entre el avance (fuente de verdad, ya en
// student_course) y el Excel de convalidaciones. Solo REPORTA discrepancias;
// nunca sobrescribe el avance con el Excel. Es un diagnóstico opcional: quien
// no tenga el Excel simplemente no lo corre.
import pool from '../../../shared/db/pool.js'
import { readNoConvalidados, readPorLlevar } from '../infrastructure/reconciliacion.ExcelReader.js'
import { reconcile } from './reconciliacion.compare.js'

class ReconciliacionService {
    static async run(studentId, excelPath) {
        const { rows } = await pool.query(
            'SELECT course_code, status FROM student_course WHERE student_id = $1',
            [studentId],
        )
        if (rows.length === 0) {
            throw new Error(`El alumno ${studentId} no tiene avance importado; corre import:avance primero.`)
        }
        const avanceByCode = new Map(rows.map((r) => [r.course_code, r.status]))

        const porLlevar = await readPorLlevar(excelPath)
        const noConvalidados = await readNoConvalidados(excelPath)

        const { compared, agreements, discrepancies } = reconcile({ avanceByCode, porLlevar })

        return {
            studentId,
            avanceCount: avanceByCode.size,
            excelCount: porLlevar.length,
            compared,
            agreements,
            discrepancies,
            noConvalidados,
        }
    }
}

export default ReconciliacionService

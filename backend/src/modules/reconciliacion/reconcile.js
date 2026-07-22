// Reporta discrepancias entre el avance del alumno y el Excel de
// convalidaciones. Diagnóstico opcional; no modifica la base.
// Uso: node src/modules/reconciliacion/reconcile.js [studentId] [excel.xlsx]
import { resolve } from 'node:path'
import pool from '../../shared/db/pool.js'
import ReconciliacionService from './application/reconciliacion.Service.js'

const DEFAULT_STUDENT = '2023110208'
const DEFAULT_EXCEL = resolve(process.cwd(), '../Convalidaciones.xlsx')

const main = async () => {
    const studentId = process.argv[2] && !process.argv[2].endsWith('.xlsx') ? process.argv[2] : DEFAULT_STUDENT
    const excelArg = process.argv.find((a) => a.endsWith('.xlsx'))
    const excelPath = excelArg ? resolve(excelArg) : DEFAULT_EXCEL

    const r = await ReconciliacionService.run(studentId, excelPath)

    console.log(`Alumno ${r.studentId}: avance=${r.avanceCount} cursos · Excel "Por llevar"=${r.excelCount} cursos`)
    console.log(`Comparados: ${r.compared} · Coinciden: ${r.agreements} · Discrepancias: ${r.discrepancies.length}`)

    if (r.discrepancies.length) {
        console.log('\nDiscrepancias (gana el avance; el Excel solo se señala):')
        for (const d of r.discrepancies) {
            console.log(`  - ${d.code}: Excel=${d.excel} vs Avance=${d.avance} → ${d.detail}`)
        }
    }
    console.log(`\nCursos de malla vieja no convalidados (informativo): ${r.noConvalidados.length}`)
    console.log('\nEl estado consolidado queda según el avance; no se modificó student_course.')
}

main()
    .catch((error) => {
        console.error('Fallo la reconciliación:', error.message)
        process.exitCode = 1
    })
    .finally(() => pool.end())

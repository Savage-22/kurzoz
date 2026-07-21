// Ejecuta la importación de la malla desde el Excel de convalidaciones.
// Uso: node src/modules/malla/importMalla.js [ruta-al-excel]
import { resolve } from 'node:path'
import pool from '../../shared/db/pool.js'
import MallaService from './application/malla.Service.js'

const DEFAULT_FILE = resolve(process.cwd(), '../Convalidaciones.xlsx')

const main = async () => {
    const filePath = process.argv[2] ? resolve(process.argv[2]) : DEFAULT_FILE
    console.log(`Importando malla desde ${filePath}`)

    const report = await MallaService.importFromExcel(filePath)

    console.log(`\n✓ Cursos:        ${report.courses}`)
    console.log(`✓ Prerrequisitos: ${report.prerequisites}`)
    console.log(`✓ Equivalencias:  ${report.equivalences}`)

    if (report.warnings.length) {
        console.log(`\n⚠ Advertencias (${report.warnings.length}):`)
        report.warnings.forEach((w) => console.log(`  - ${w}`))
    }
    if (report.skipped.length) {
        console.log(`\n↷ Filas omitidas (${report.skipped.length}):`)
        report.skipped.forEach((s) => console.log(`  - ${s}`))
    }
}

main()
    .catch((error) => {
        console.error('Fallo la importación:', error.message)
        process.exitCode = 1
    })
    .finally(() => pool.end())

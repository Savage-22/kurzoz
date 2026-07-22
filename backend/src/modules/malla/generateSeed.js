// Genera el seed versionado de la malla a partir del Excel de convalidaciones.
// Herramienta de dev: solo se corre cuando cambia la malla oficial. El seed
// resultante (002_malla.sql) se commitea, así el resto del equipo levanta la
// base con `npm run seed` sin necesitar el Excel.
// Uso: node src/modules/malla/generateSeed.js [ruta-al-excel]
import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import MallaService from './application/malla.Service.js'
import { renderMallaSeed } from './infrastructure/malla.SeedRenderer.js'

const DEFAULT_FILE = resolve(process.cwd(), '../Convalidaciones.xlsx')
const SEED_FILE = resolve(process.cwd(), 'migrations/seeds/002_malla.sql')

const main = async () => {
    const filePath = process.argv[2] ? resolve(process.argv[2]) : DEFAULT_FILE
    console.log(`Leyendo malla desde ${filePath}`)

    const { courses, prerequisites, equivalences, report } = await MallaService.buildFromExcel(filePath)
    const sql = renderMallaSeed({ courses, prerequisites, equivalences })
    await writeFile(SEED_FILE, sql, 'utf8')

    console.log(`\n✓ Seed escrito en ${SEED_FILE}`)
    console.log(`  Cursos: ${report.courses} · Prerrequisitos: ${report.prerequisites} · Equivalencias: ${report.equivalences}`)

    if (report.warnings.length) {
        console.log(`\n⚠ Advertencias (${report.warnings.length}):`)
        report.warnings.forEach((w) => console.log(`  - ${w}`))
    }
    if (report.skipped.length) {
        console.log(`\n↷ Filas omitidas (${report.skipped.length}):`)
        report.skipped.forEach((s) => console.log(`  - ${s}`))
    }
}

main().catch((error) => {
    console.error('Fallo la generación del seed:', error.message)
    process.exitCode = 1
})

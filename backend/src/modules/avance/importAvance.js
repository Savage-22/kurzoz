// Importa el avance curricular de un alumno desde su PDF. Cada quien carga el
// suyo; el PDF es dato personal y no se versiona. Genera student_course.
// Uso: node src/modules/avance/importAvance.js <ruta.pdf> [--en-curso=3102,3103]
import { resolve } from 'node:path'
import pool from '../../shared/db/pool.js'
import AvanceService from './application/avance.Service.js'

const DEFAULT_FILE = resolve(process.cwd(), '../Avance curricular.pdf')

const parseList = (arg, prefix) => arg.slice(prefix.length).split(',').map((c) => c.trim()).filter(Boolean)

const parseArgs = (argv) => {
    let filePath = DEFAULT_FILE
    let inProgress = []
    let approved = []
    for (const arg of argv) {
        if (arg.startsWith('--en-curso=')) inProgress = parseList(arg, '--en-curso=')
        else if (arg.startsWith('--aprobado=')) approved = parseList(arg, '--aprobado=')
        else if (!arg.startsWith('--')) filePath = resolve(arg)
    }
    return { filePath, inProgress, approved }
}

const main = async () => {
    const { filePath, inProgress, approved } = parseArgs(process.argv.slice(2))
    console.log(`Importando avance desde ${filePath}`)

    const r = await AvanceService.importFromPdf(filePath, { inProgress, approved })

    console.log(`\nAlumno: ${r.student.name} (${r.student.id})`)
    console.log(`✓ Cursos:    ${r.total}`)
    console.log(`  Aprobados: ${r.approved} · En curso: ${r.inProgress} · Pendientes: ${r.pending}`)
    console.log(
        `✓ Créditos aprobados: calculado ${r.computedApprovedCredits}` +
        (r.reportedApprovedCredits !== null ? ` vs PDF ${r.reportedApprovedCredits} → ${r.creditsMatch ? 'OK' : 'DISCREPA'}` : ''),
    )

    if (r.warnings.length) {
        console.log(`\n⚠ Advertencias (${r.warnings.length}):`)
        r.warnings.forEach((w) => console.log(`  - ${w}`))
    }
    if (r.skipped.length) {
        console.log(`\n↷ Omitidos (${r.skipped.length}):`)
        r.skipped.forEach((s) => console.log(`  - ${s}`))
    }
}

main()
    .catch((error) => {
        console.error('Fallo la importación del avance:', error.message)
        process.exitCode = 1
    })
    .finally(() => pool.end())

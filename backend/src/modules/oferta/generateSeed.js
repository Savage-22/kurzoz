// Genera el seed versionado de la oferta 2026-II desde la Resolución de carga
// lectiva (PDF). Herramienta de dev: solo se corre cuando cambia el horario
// oficial. El seed resultante (003_oferta_2026_ii.sql) se commitea, así el
// equipo levanta la base con `npm run seed` sin necesitar el PDF.
// Uso: node src/modules/oferta/generateSeed.js [ruta.pdf]
import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import pool from '../../shared/db/pool.js'
import { readResolucion } from './infrastructure/oferta.PdfReader.js'
import { parseHorario } from './application/oferta.parser.js'
import { renderOfertaSeed } from './infrastructure/oferta.SeedRenderer.js'

const DEFAULT_FILE = resolve(
    process.cwd(),
    '../RESOLUCIÓN N° 0264-2025-UNHEVAL-FIISMEC-CF - Aprobación carga lectiva 2026 I - II.pdf',
)
const SEED_FILE = resolve(process.cwd(), 'migrations/seeds/003_oferta_2026_ii.sql')

const main = async () => {
    const filePath = process.argv[2] ? resolve(process.argv[2]) : DEFAULT_FILE
    console.log(`Leyendo oferta desde ${filePath}`)

    const raw = await readResolucion(filePath)
    let { offerings, sections, sessions } = parseHorario(raw)

    // Integridad: todo curso ofertado debe existir en la malla cargada.
    const known = new Set((await pool.query('SELECT code FROM course')).rows.map((r) => r.code))
    const unknown = [...new Set(offerings.filter((o) => !known.has(o.courseCode)).map((o) => o.courseCode))]
    if (unknown.length) {
        offerings = offerings.filter((o) => known.has(o.courseCode))
        sections = sections.filter((s) => known.has(s.courseCode))
        sessions = sessions.filter((s) => known.has(s.courseCode))
    }

    const seed = renderOfertaSeed({ offerings, sections, sessions })
    await writeFile(SEED_FILE, seed, 'utf8')

    console.log(`\n✓ Seed escrito en ${SEED_FILE}`)
    console.log(`  Cursos ofertados: ${new Set(offerings.map((o) => o.courseCode)).size}`)
    console.log(`  Offerings: ${offerings.length} · Secciones: ${sections.length} · Sesiones: ${sessions.length}`)
    const withHours = offerings.filter((o) => o.ht !== null).length
    console.log(`  Offerings con HT/HP: ${withHours}/${offerings.length}`)
    if (unknown.length) console.log(`\n⚠ Cursos no encontrados en la malla (omitidos): ${unknown.join(', ')}`)
}

main()
    .catch((error) => {
        console.error('Fallo la generación del seed de oferta:', error.message)
        process.exitCode = 1
    })
    .finally(() => pool.end())

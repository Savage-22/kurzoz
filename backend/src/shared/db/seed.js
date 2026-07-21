// Carga los seeds mínimos de prueba. Los archivos son idempotentes,
// así que correr esto varias veces no duplica datos.
// Uso: node src/shared/db/seed.js
import { readdir, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import pool from './pool.js'

const SEEDS_DIR = join(dirname(fileURLToPath(import.meta.url)), '../../../migrations/seeds')

const main = async () => {
    const files = (await readdir(SEEDS_DIR)).filter((file) => file.endsWith('.sql')).sort()

    if (files.length === 0) {
        console.log('No hay seeds que cargar.')
        return
    }

    for (const file of files) {
        const sql = await readFile(join(SEEDS_DIR, file), 'utf8')
        await pool.query(sql)
        console.log(`✓ seed ${file}`)
    }
}

main()
    .catch((error) => {
        console.error('Fallo al cargar seeds:', error.message)
        process.exitCode = 1
    })
    .finally(() => pool.end())

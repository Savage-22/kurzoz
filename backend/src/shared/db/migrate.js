// Runner de migraciones SQL sin dependencias externas.
// Uso: node src/shared/db/migrate.js <up|down|status> [n]
//   up        aplica todas las migraciones pendientes
//   down [n]  revierte las últimas n aplicadas (por defecto 1)
//   status    muestra aplicadas vs pendientes
import { readdir, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import pool from './pool.js'

const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), '../../../migrations')

const ensureMigrationsTable = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version     TEXT PRIMARY KEY,
            applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    `)
}

// Versiones disponibles en disco (derivadas de los archivos *.up.sql), ordenadas.
const availableVersions = async () => {
    const files = await readdir(MIGRATIONS_DIR)
    return files
        .filter((file) => file.endsWith('.up.sql'))
        .map((file) => file.replace(/\.up\.sql$/, ''))
        .sort()
}

const appliedVersions = async () => {
    const { rows } = await pool.query('SELECT version FROM schema_migrations ORDER BY version')
    return rows.map((row) => row.version)
}

const readSql = (version, direction) =>
    readFile(join(MIGRATIONS_DIR, `${version}.${direction}.sql`), 'utf8')

// Cada migración corre en su propia transacción: o entra completa o no entra.
const runInTransaction = async (steps) => {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')
        await steps(client)
        await client.query('COMMIT')
    } catch (error) {
        await client.query('ROLLBACK')
        throw error
    } finally {
        client.release()
    }
}

const up = async () => {
    const applied = new Set(await appliedVersions())
    const pending = (await availableVersions()).filter((version) => !applied.has(version))

    if (pending.length === 0) {
        console.log('Sin migraciones pendientes.')
        return
    }

    for (const version of pending) {
        const sql = await readSql(version, 'up')
        await runInTransaction(async (client) => {
            await client.query(sql)
            await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [version])
        })
        console.log(`↑ aplicada ${version}`)
    }
}

const down = async (count) => {
    const applied = await appliedVersions()
    const targets = applied.slice(-count).reverse()

    if (targets.length === 0) {
        console.log('No hay migraciones que revertir.')
        return
    }

    for (const version of targets) {
        const sql = await readSql(version, 'down')
        await runInTransaction(async (client) => {
            await client.query(sql)
            await client.query('DELETE FROM schema_migrations WHERE version = $1', [version])
        })
        console.log(`↓ revertida ${version}`)
    }
}

const status = async () => {
    const applied = new Set(await appliedVersions())
    const versions = await availableVersions()
    for (const version of versions) {
        console.log(`${applied.has(version) ? '[x]' : '[ ]'} ${version}`)
    }
    if (versions.length === 0) console.log('No hay migraciones en disco.')
}

const main = async () => {
    const command = process.argv[2] ?? 'status'
    await ensureMigrationsTable()

    switch (command) {
        case 'up':
            await up()
            break
        case 'down':
            await down(Number(process.argv[3]) || 1)
            break
        case 'status':
            await status()
            break
        default:
            console.error(`Comando desconocido: ${command}. Usa up | down | status.`)
            process.exitCode = 1
    }
}

main()
    .catch((error) => {
        console.error('Fallo en la migración:', error.message)
        process.exitCode = 1
    })
    .finally(() => pool.end())

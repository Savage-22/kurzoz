import pg from 'pg'
import { config } from '../config.js'

const { Pool } = pg

const pool = new Pool({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
})

// Un error en un cliente inactivo del pool no es recuperable: mejor caer fuerte
pool.on('error', (error) => {
    console.error('Error inesperado en el pool de PostgreSQL:', error)
    process.exit(1)
})

export default pool

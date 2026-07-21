import app from './app.js'
import { config } from './shared/config.js'
import pool from './shared/db/pool.js'

app.listen(config.port, () => {
    console.log(`Backend escuchando en http://localhost:${config.port}`)
})

// Verifica la conexión a la base de datos al arrancar
pool.query('SELECT 1')
    .then(() => console.log('Conexión a la base de datos establecida'))
    .catch((error) => console.error('No se pudo conectar a la base de datos:', error.message))

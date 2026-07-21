import pool from '../../../shared/db/pool.js'

class HealthModel {
    static async ping() {
        await pool.query('SELECT 1')
    }
}

export default HealthModel

import HealthModel from '../infrastructure/health.Model.js'

class HealthService {
    static async checkHealth() {
        await HealthModel.ping()
        return { status: 'ok', database: 'up' }
    }
}

export default HealthService

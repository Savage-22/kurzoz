import HealthService from '../application/health.Service.js'

class HealthController {
    static async check(req, res, next) {
        try {
            const data = await HealthService.checkHealth()
            res.status(200).json({ success: true, message: 'Servicio operativo', data })
        } catch (error) {
            next(error)
        }
    }
}

export default HealthController

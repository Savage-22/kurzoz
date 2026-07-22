// Controller del planificador institucional: arma el sobre y delega errores.
import PlanificadorService from '../application/planificador.Service.js'

const DEFAULT_TERM = '2026-II'

class PlanificadorController {
    // #55 · POST /planificador/institucional
    static async institucional(req, res, next) {
        try {
            const { term = DEFAULT_TERM, weights } = req.body ?? {}
            const data = await PlanificadorService.optimizarInstitucional(term, { weights })
            res.status(200).json({ success: true, message: 'Propuesta institucional generada', data })
        } catch (error) {
            next(error)
        }
    }
}

export default PlanificadorController

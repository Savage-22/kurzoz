// Controller del asistente: arma el sobre y delega errores. Sin lógica.
import AsistenteService from '../asistente.Service.js'

const DEFAULT_TERM = '2026-II'

class AsistenteController {
    // #42 · POST /students/:id/plans/explain
    static async explain(req, res, next) {
        try {
            const { term = DEFAULT_TERM, ...options } = req.body ?? {}
            const data = await AsistenteService.explainPlan(req.params.id, term, options)
            res.status(200).json({ success: true, message: 'Explicación del horario generada', data })
        } catch (error) {
            next(error)
        }
    }
}

export default AsistenteController

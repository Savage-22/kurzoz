// Expone el reporte de discrepancias (#6) para el aviso del frontend (#14). El
// Excel es opcional: si no está en el servidor, se responde available=false con
// lista vacía, sin error (el aviso simplemente no aparece).
import { resolve } from 'node:path'
import ReconciliacionService from '../application/reconciliacion.Service.js'

const DEFAULT_EXCEL = resolve(process.cwd(), '../Convalidaciones.xlsx')

class ReconciliacionController {
    static async discrepancies(req, res, next) {
        try {
            const report = await ReconciliacionService.run(req.params.id, DEFAULT_EXCEL)
            res.status(200).json({
                success: true,
                message: 'Discrepancias evaluadas',
                data: { available: true, discrepancies: report.discrepancies, compared: report.compared },
            })
        } catch (error) {
            // Sin Excel en el servidor: se degrada a "sin discrepancias que mostrar".
            if (error.code === 'ENOENT') {
                return res.status(200).json({
                    success: true,
                    message: 'Excel de convalidaciones no disponible en el servidor',
                    data: { available: false, discrepancies: [] },
                })
            }
            next(error)
        }
    }
}

export default ReconciliacionController

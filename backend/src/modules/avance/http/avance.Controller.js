// Controller para importar avance curricular vía HTTP. Recibe un PDF
// multipart, lo guarda temporalmente y delega al service existente.
import { writeFile, unlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import AvanceService from '../application/avance.Service.js'

class AvanceController {
    // POST /students/:id/avance — recibe multipart con campo 'pdf'
    static async upload(req, res, next) {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'No se proporcionó un archivo PDF' })
            }

            const tmpPath = join(tmpdir(), `avance-${Date.now()}-${req.file.originalname}`)
            await writeFile(tmpPath, req.file.buffer)

            try {
                const overrides = {}
                if (req.body.inProgress) overrides.inProgress = req.body.inProgress.split(',').map((s) => s.trim())
                if (req.body.approved) overrides.approved = req.body.approved.split(',').map((s) => s.trim())

                const result = await AvanceService.importFromPdf(tmpPath, overrides)
                res.status(200).json({ success: true, message: 'Avance curricular importado correctamente', data: result })
            } finally {
                await unlink(tmpPath).catch(() => {})
            }
        } catch (error) {
            next(error)
        }
    }

    // POST /students/:id/avance/preview — lee el PDF sin persistir
    static async preview(req, res, next) {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'No se proporcionó un archivo PDF' })
            }

            const tmpPath = join(tmpdir(), `avance-preview-${Date.now()}-${req.file.originalname}`)
            await writeFile(tmpPath, req.file.buffer)

            try {
                const parsed = await AvanceService.buildFromPdf(tmpPath)
                res.status(200).json({ success: true, message: 'PDF leído correctamente', data: parsed })
            } finally {
                await unlink(tmpPath).catch(() => {})
            }
        } catch (error) {
            next(error)
        }
    }
}

export default AvanceController

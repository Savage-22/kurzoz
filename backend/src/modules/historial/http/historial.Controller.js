// Controller para importar historial de notas vía HTTP. Recibe un PDF
// multipart, lo guarda temporalmente y delega al service.
import { writeFile, unlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import HistorialService from '../application/historial.Service.js'

class HistorialController {
    // POST /students/:id/historial — recibe multipart con campo 'pdf'
    static async upload(req, res, next) {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'No se proporcionó un archivo PDF' })
            }

            const tmpPath = join(tmpdir(), `historial-${Date.now()}-${req.file.originalname}`)
            await writeFile(tmpPath, req.file.buffer)

            try {
                const result = await HistorialService.importFromPdf(tmpPath)
                res.status(200).json({ success: true, message: 'Historial de notas importado correctamente', data: result })
            } finally {
                await unlink(tmpPath).catch(() => {})
            }
        } catch (error) {
            next(error)
        }
    }

    // POST /students/:id/historial/preview — lee el PDF sin persistir
    static async preview(req, res, next) {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'No se proporcionó un archivo PDF' })
            }

            const tmpPath = join(tmpdir(), `historial-preview-${Date.now()}-${req.file.originalname}`)
            await writeFile(tmpPath, req.file.buffer)

            try {
                const parsed = await HistorialService.buildFromPdf(tmpPath)
                res.status(200).json({ success: true, message: 'PDF leído correctamente', data: parsed })
            } finally {
                await unlink(tmpPath).catch(() => {})
            }
        } catch (error) {
            next(error)
        }
    }
}

export default HistorialController

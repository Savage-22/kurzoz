// Controller de la disponibilidad docente: arma el sobre y delega errores con
// next(). Sin lógica de negocio.
import DisponibilidadService from '../application/disponibilidad.Service.js'

class DisponibilidadController {
    // GET /disponibilidad/docentes
    static async listTeachers(req, res, next) {
        try {
            const data = await DisponibilidadService.listTeachers()
            res.status(200).json({ success: true, message: 'Docentes de la oferta', data })
        } catch (error) {
            next(error)
        }
    }

    // GET /disponibilidad?teacher=NOMBRE
    static async listByTeacher(req, res, next) {
        try {
            const data = await DisponibilidadService.listByTeacher(req.query.teacher)
            res.status(200).json({ success: true, message: 'Disponibilidad del docente', data })
        } catch (error) {
            next(error)
        }
    }

    // POST /disponibilidad
    static async create(req, res, next) {
        try {
            const data = await DisponibilidadService.createWindow(req.body)
            res.status(201).json({ success: true, message: 'Ventana de disponibilidad creada', data })
        } catch (error) {
            next(error)
        }
    }

    // PUT /disponibilidad/:id
    static async update(req, res, next) {
        try {
            const data = await DisponibilidadService.updateWindow(Number(req.params.id), req.body)
            res.status(200).json({ success: true, message: 'Ventana de disponibilidad actualizada', data })
        } catch (error) {
            next(error)
        }
    }

    // DELETE /disponibilidad/:id
    static async deactivate(req, res, next) {
        try {
            await DisponibilidadService.removeWindow(Number(req.params.id))
            res.status(200).json({ success: true, message: 'Ventana de disponibilidad eliminada' })
        } catch (error) {
            next(error)
        }
    }
}

export default DisponibilidadController

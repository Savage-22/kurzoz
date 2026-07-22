// Lógica de negocio de la disponibilidad docente. Valida precondiciones y lanza
// excepciones tipadas; no toca HTTP.
import { ConflictError, NotFoundError, ValidationError } from '../../../shared/errors.js'
import DisponibilidadModel from '../infrastructure/disponibilidad.Model.js'

class DisponibilidadService {
    static async listTeachers() {
        return DisponibilidadModel.listTeachers()
    }

    static async listByTeacher(teacher) {
        if (!teacher) throw new ValidationError('Falta el docente', ['teacher es requerido'])
        return DisponibilidadModel.listByTeacher(teacher)
    }

    static async createWindow({ teacher, day, startMin, endMin }) {
        const teachers = await DisponibilidadModel.listTeachers()
        if (!teachers.includes(teacher)) throw new NotFoundError(`El docente "${teacher}" no está en la oferta`)

        const overlap = await DisponibilidadModel.findOverlapping(teacher, day, startMin, endMin)
        if (overlap.length) throw new ConflictError('La ventana se solapa con otra existente del docente')

        return DisponibilidadModel.create({ teacher, day, startMin, endMin })
    }

    static async updateWindow(id, { day, startMin, endMin }) {
        const current = await DisponibilidadModel.findById(id)
        if (!current) throw new NotFoundError(`La ventana ${id} no existe`)

        const overlap = await DisponibilidadModel.findOverlapping(current.teacher, day, startMin, endMin, id)
        if (overlap.length) throw new ConflictError('La ventana se solapa con otra existente del docente')

        return DisponibilidadModel.update(id, { day, startMin, endMin })
    }

    static async removeWindow(id) {
        const removed = await DisponibilidadModel.deactivate(id)
        if (!removed) throw new NotFoundError(`La ventana ${id} no existe`)
    }
}

export default DisponibilidadService

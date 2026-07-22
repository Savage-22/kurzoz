// Validación de entrada de la disponibilidad docente. Lanza ValidationError
// (400); el controller no valida.
import { ValidationError } from '../../../shared/errors.js'

const isMinute = (v, max) => Number.isInteger(v) && v >= 0 && v <= max

// requireTeacher = true para crear (el body trae el docente); false para editar
// (el docente se deriva de la ventana existente).
const validateWindow = (requireTeacher) => (req, res, next) => {
    const { teacher, day, startMin, endMin } = req.body ?? {}
    const errors = []
    if (requireTeacher && (typeof teacher !== 'string' || !teacher.trim())) errors.push('teacher es requerido')
    if (!Number.isInteger(day) || day < 1 || day > 7) errors.push('day debe ser un entero entre 1 y 7')
    if (!isMinute(startMin, 1439)) errors.push('startMin debe estar entre 0 y 1439')
    if (!isMinute(endMin, 1440)) errors.push('endMin debe estar entre 1 y 1440')
    if (Number.isInteger(startMin) && Number.isInteger(endMin) && endMin <= startMin) errors.push('endMin debe ser mayor que startMin')
    if (errors.length) return next(new ValidationError('Datos de la solicitud inválidos', errors))
    return next()
}

export const validateCreate = validateWindow(true)
export const validateUpdate = validateWindow(false)

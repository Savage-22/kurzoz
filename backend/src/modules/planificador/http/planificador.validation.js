// Validación de entrada del planificador institucional.
import { ValidationError } from '../../../shared/errors.js'

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)

export const validateInstitucional = (req, res, next) => {
    const { weights } = req.body ?? {}
    const errors = []
    if (weights !== undefined && !isObject(weights)) errors.push('weights debe ser un objeto de pesos')
    if (errors.length) return next(new ValidationError('Datos de la solicitud inválidos', errors))
    return next()
}

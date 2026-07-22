// Validación de entrada del asistente. Lanza ValidationError (400); el
// controller no valida.
import { ValidationError } from '../../../shared/errors.js'

const isPositiveNumber = (v) => typeof v === 'number' && Number.isFinite(v) && v > 0
const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)

export const validateExplainBody = (req, res, next) => {
    const { planIndex, maxCredits, weights } = req.body ?? {}
    const errors = []
    if (planIndex !== undefined && (!Number.isInteger(planIndex) || planIndex < 0)) errors.push('planIndex debe ser un entero mayor o igual a 0')
    if (maxCredits !== undefined && !isPositiveNumber(maxCredits)) errors.push('maxCredits debe ser un número positivo')
    if (weights !== undefined && !isObject(weights)) errors.push('weights debe ser un objeto de pesos')
    if (errors.length) return next(new ValidationError('Datos de la solicitud inválidos', errors))
    return next()
}

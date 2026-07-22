// Middlewares de validación de entrada del motor. Acumulan errores y lanzan
// ValidationError (400) con la lista; los controllers no validan.
import { ValidationError } from '../../../shared/errors.js'

const isPositiveNumber = (v) => typeof v === 'number' && Number.isFinite(v) && v > 0
const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)

export const validateScheduleBody = (req, res, next) => {
    const { maxCredits, maxResults, weights, chainInProgress } = req.body ?? {}
    const errors = []
    if (maxCredits !== undefined && !isPositiveNumber(maxCredits)) errors.push('maxCredits debe ser un número positivo')
    if (maxResults !== undefined && (!Number.isInteger(maxResults) || maxResults <= 0)) errors.push('maxResults debe ser un entero positivo')
    if (weights !== undefined && !isObject(weights)) errors.push('weights debe ser un objeto de pesos')
    if (chainInProgress !== undefined && typeof chainInProgress !== 'boolean') errors.push('chainInProgress debe ser booleano')
    if (errors.length) return next(new ValidationError('Datos de la solicitud inválidos', errors))
    return next()
}

export const validateAdjustmentBody = (req, res, next) => {
    const { desiredCourses, maxCredits, maxShiftSlots } = req.body ?? {}
    const errors = []
    if (desiredCourses !== undefined) {
        if (!Array.isArray(desiredCourses)) errors.push('desiredCourses debe ser un arreglo de códigos')
        else if (!desiredCourses.every((c) => typeof c === 'string' && /^\d{4}$/.test(c))) errors.push('cada código de desiredCourses debe ser de 4 dígitos')
    }
    if (maxCredits !== undefined && !isPositiveNumber(maxCredits)) errors.push('maxCredits debe ser un número positivo')
    if (maxShiftSlots !== undefined && (!Number.isInteger(maxShiftSlots) || maxShiftSlots <= 0)) errors.push('maxShiftSlots debe ser un entero positivo')
    if (errors.length) return next(new ValidationError('Datos de la solicitud inválidos', errors))
    return next()
}

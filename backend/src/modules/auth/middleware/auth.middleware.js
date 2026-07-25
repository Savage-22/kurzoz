// Middlewares de autenticación y autorización.
import { UnauthorizedError, ForbiddenError } from '../../../shared/errors.js'
import AuthService from '../application/auth.Service.js'

// Verifica el token JWT del header Authorization: Bearer <token>.
// Si es válido, coloca req.user con { id, studentId, role, name }.
export const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new UnauthorizedError('Token de autenticación requerido'))
    }

    const token = authHeader.substring(7)
    try {
        const payload = AuthService.verifyToken(token)
        req.user = {
            id: payload.sub,
            studentId: payload.studentId,
            role: payload.role,
            name: payload.name,
        }
        next()
    } catch {
        next(new UnauthorizedError('Token inválido o expirado'))
    }
}

// Verifica que el usuario tenga uno de los roles especificados.
export const authorize = (...roles) => (req, res, next) => {
    if (!req.user) {
        return next(new UnauthorizedError('Usuario no autenticado'))
    }
    if (!roles.includes(req.user.role)) {
        return next(new ForbiddenError('Permisos insuficientes para esta operación'))
    }
    next()
}

// Para endpoints de motor: un STUDENT solo puede acceder a sus propios datos.
// Un ADMIN puede acceder a cualquier estudiante. Si el parámetro :id no coincide
// con el studentId del token, se rechaza con 403.
export const authorizeStudentAccess = (req, res, next) => {
    if (!req.user) {
        return next(new UnauthorizedError('Usuario no autenticado'))
    }
    if (req.user.role === 'ADMIN') {
        return next()
    }
    // STUDENT: el :id de la URL debe coincidir con su studentId.
    if (req.params.id !== req.user.studentId) {
        return next(new ForbiddenError('No tienes permiso para acceder a estos datos'))
    }
    next()
}

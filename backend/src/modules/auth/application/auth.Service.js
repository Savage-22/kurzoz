// Lógica de autenticación: login, registro, generación de JWT.
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { config } from '../../../shared/config.js'
import { UnauthorizedError, ConflictError } from '../../../shared/errors.js'
import AuthModel from '../infrastructure/auth.Model.js'

const JWT_SECRET = config.jwt.secret
const JWT_EXPIRES_IN = config.jwt.expiresIn

class AuthService {
    // Genera un token JWT para un usuario.
    static generateToken(user) {
        return jwt.sign(
            {
                sub: user.id,
                studentId: user.student_id,
                role: user.role,
                name: user.student_name,
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN },
        )
    }

    // Verifica un token JWT y devuelve el payload.
    static verifyToken(token) {
        try {
            return jwt.verify(token, JWT_SECRET)
        } catch {
            throw new UnauthorizedError('Token inválido o expirado')
        }
    }

    // Inicia sesión: verifica credenciales y devuelve token + usuario.
    static async login(studentId, password) {
        const user = await AuthModel.findByStudentId(studentId)
        if (!user) {
            throw new UnauthorizedError('Credenciales incorrectas')
        }
        if (!user.is_active) {
            throw new UnauthorizedError('Cuenta desactivada')
        }

        const passwordValid = await bcrypt.compare(password, user.password_hash)
        if (!passwordValid) {
            throw new UnauthorizedError('Credenciales incorrectas')
        }

        const token = AuthService.generateToken(user)
        return {
            token,
            user: {
                id: user.id,
                studentId: user.student_id,
                name: user.student_name,
                role: user.role,
            },
        }
    }

    // Registro de nuevo usuario (auto-registro limitado).
    static async register(studentId, password, role = 'STUDENT') {
        // Asegurar que el estudiante exista en la tabla student.
        await AuthModel.ensureStudentExists(studentId)

        // Verificar que no exista ya una cuenta.
        const existing = await AuthModel.findByStudentId(studentId)
        if (existing) {
            throw new ConflictError('Ya existe una cuenta para este estudiante')
        }

        const passwordHash = await bcrypt.hash(password, 10)
        const user = await AuthModel.create(studentId, passwordHash, role)
        return {
            user: {
                id: user.id,
                studentId: user.student_id,
                role: user.role,
            },
        }
    }

    // Cambiar contraseña.
    static async changePassword(userId, currentPassword, newPassword) {
        const user = await AuthModel.findById(userId)
        if (!user) {
            throw new UnauthorizedError('Usuario no encontrado')
        }

        const passwordValid = await bcrypt.compare(currentPassword, user.password_hash)
        if (!passwordValid) {
            throw new UnauthorizedError('Contraseña actual incorrecta')
        }

        const newHash = await bcrypt.hash(newPassword, 10)
        await AuthModel.updatePassword(userId, newHash)
    }
}

export default AuthService

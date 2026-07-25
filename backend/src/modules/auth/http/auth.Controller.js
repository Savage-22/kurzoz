// Controllers de autenticación: login, registro, verificación de sesión.
import AuthService from '../application/auth.Service.js'

class AuthController {
    // POST /auth/login
    static async login(req, res, next) {
        try {
            const { studentId, password } = req.body
            if (!studentId || !password) {
                return res.status(400).json({ success: false, message: 'Se requiere código de estudiante y contraseña' })
            }
            const result = await AuthService.login(studentId, password)
            res.status(200).json({ success: true, message: 'Sesión iniciada correctamente', data: result })
        } catch (error) {
            next(error)
        }
    }

    // POST /auth/register
    static async register(req, res, next) {
        try {
            const { studentId, password } = req.body
            if (!studentId || !password) {
                return res.status(400).json({ success: false, message: 'Se requiere código de estudiante y contraseña' })
            }
            const result = await AuthService.register(studentId, password)
            res.status(201).json({ success: true, message: 'Cuenta creada correctamente', data: result })
        } catch (error) {
            next(error)
        }
    }

    // GET /auth/me — verifica el token y devuelve el usuario
    static async me(req, res, next) {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, message: 'No autenticado' })
            }
            res.status(200).json({
                success: true,
                data: {
                    user: {
                        id: req.user.id,
                        studentId: req.user.studentId,
                        name: req.user.name,
                        role: req.user.role,
                    },
                },
            })
        } catch (error) {
            next(error)
        }
    }
}

export default AuthController

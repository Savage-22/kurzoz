import { Router } from 'express'
import AuthController from './auth.Controller.js'
import { authenticate } from '../middleware/auth.middleware.js'

const router = Router()

router.post('/login', AuthController.login)
router.post('/register', AuthController.register)
router.get('/me', authenticate, AuthController.me)

export default router

import { Router } from 'express'
import HealthController from './health.Controller.js'

const router = Router()

router.get('/', HealthController.check)

export default router

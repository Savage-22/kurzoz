import healthRoutes from './health/http/health.routes.js'
import motorRoutes from './motor/http/motor.routes.js'

export const registerModules = (app) => {
    app.use('/health', healthRoutes)
    app.use('/students', motorRoutes)
}

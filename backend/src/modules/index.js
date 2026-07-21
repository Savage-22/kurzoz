import healthRoutes from './health/http/health.routes.js'

export const registerModules = (app) => {
    app.use('/health', healthRoutes)
}

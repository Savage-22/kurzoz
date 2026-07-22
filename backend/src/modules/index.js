import healthRoutes from './health/http/health.routes.js'
import motorRoutes from './motor/http/motor.routes.js'
import reconciliacionRoutes from './reconciliacion/http/reconciliacion.routes.js'
import asistenteRoutes from './asistente/http/asistente.routes.js'
import disponibilidadRoutes from './disponibilidad/http/disponibilidad.routes.js'

export const registerModules = (app) => {
    app.use('/health', healthRoutes)
    app.use('/students', motorRoutes)
    app.use('/students', reconciliacionRoutes)
    app.use('/students', asistenteRoutes)
    app.use('/disponibilidad', disponibilidadRoutes)
}

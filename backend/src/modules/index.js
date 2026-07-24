import healthRoutes from './health/http/health.routes.js'
import motorRoutes from './motor/http/motor.routes.js'
import reconciliacionRoutes from './reconciliacion/http/reconciliacion.routes.js'
import asistenteRoutes from './asistente/http/asistente.routes.js'
import disponibilidadRoutes from './disponibilidad/http/disponibilidad.routes.js'
import planificadorRoutes from './planificador/http/planificador.routes.js'
import avanceRoutes from './avance/http/avance.routes.js'
import historialRoutes from './historial/http/historial.routes.js'

export const registerModules = (app) => {
    app.use('/health', healthRoutes)
    app.use('/students', motorRoutes)
    app.use('/students', reconciliacionRoutes)
    app.use('/students', asistenteRoutes)
    app.use('/students', avanceRoutes)
    app.use('/students', historialRoutes)
    app.use('/disponibilidad', disponibilidadRoutes)
    app.use('/planificador', planificadorRoutes)
}

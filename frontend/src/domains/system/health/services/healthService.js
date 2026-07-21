import { fetchHealth } from '../api/healthApi.js'

// Normaliza el estado del backend a un shape simple para la UI
export const getBackendStatus = async () => {
    try {
        const { data } = await fetchHealth()
        return { online: true, database: data.data?.database ?? 'desconocido' }
    } catch (error) {
        const message = error.response?.data?.message ?? 'Sin conexión con el backend'
        return { online: false, database: 'down', message }
    }
}

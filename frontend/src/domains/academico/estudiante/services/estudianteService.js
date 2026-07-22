import { fetchDiscrepancies, fetchRemaining } from '../api/estudianteApi.js'

// Normaliza el estado del alumno para la UI. Los componentes consumen esto,
// nunca la API directa.
export const getRemaining = async (studentId) => {
    const { data } = await fetchRemaining(studentId)
    return data.data
}

// Discrepancias del reporte de reconciliación (#6). Si el Excel no está en el
// servidor o algo falla, se devuelve vacío para que el aviso simplemente no salga.
export const getDiscrepancies = async (studentId) => {
    try {
        const { data } = await fetchDiscrepancies(studentId)
        return data.data
    } catch {
        return { available: false, discrepancies: [] }
    }
}

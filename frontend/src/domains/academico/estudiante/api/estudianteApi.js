import httpClient from '../../../../infrastructure/httpClient.js'

// Llamadas crudas al backend del estado del alumno. Sin lógica: solo transporte.
export const fetchRemaining = (studentId) => httpClient.get(`/students/${studentId}/remaining`)

export const fetchEligible = (studentId, term, chain) =>
    httpClient.get(`/students/${studentId}/eligible`, { params: { term, chain } })

export const fetchDiscrepancies = (studentId) => httpClient.get(`/students/${studentId}/discrepancies`)

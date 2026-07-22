import httpClient from '../../../../infrastructure/httpClient.js'

// Grafo de prerrequisitos del alumno (#36).
export const getGraph = (studentId, term) => httpClient.get(`/students/${studentId}/graph`, { params: { term } })

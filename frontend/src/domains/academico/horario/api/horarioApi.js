import httpClient from '../../../../infrastructure/httpClient.js'

// Llamadas crudas al motor de planificación.
export const postSchedules = (studentId, body) => httpClient.post(`/students/${studentId}/schedules`, body)

export const postAdjustments = (studentId, body) => httpClient.post(`/students/${studentId}/adjustments`, body)

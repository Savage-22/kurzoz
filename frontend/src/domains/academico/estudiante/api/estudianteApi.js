import httpClient from '../../../../infrastructure/httpClient.js'

// Llamadas crudas al backend del estado del alumno. Sin lógica: solo transporte.
export const fetchRemaining = (studentId) => httpClient.get(`/students/${studentId}/remaining`)

export const fetchEligible = (studentId, term, chain) =>
    httpClient.get(`/students/${studentId}/eligible`, { params: { term, chain } })

export const fetchDiscrepancies = (studentId) => httpClient.get(`/students/${studentId}/discrepancies`)

// Upload de avance curricular (PDF)
export const uploadAvance = (studentId, file, overrides = {}) => {
    const formData = new FormData()
    formData.append('pdf', file)
    if (overrides.inProgress) formData.append('inProgress', overrides.inProgress)
    if (overrides.approved) formData.append('approved', overrides.approved)
    return httpClient.post(`/students/${studentId}/avance`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    })
}

// Preview del avance curricular (sin persistir)
export const previewAvance = (studentId, file) => {
    const formData = new FormData()
    formData.append('pdf', file)
    return httpClient.post(`/students/${studentId}/avance/preview`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    })
}

// Upload de historial de notas (PDF)
export const uploadHistorial = (studentId, file) => {
    const formData = new FormData()
    formData.append('pdf', file)
    return httpClient.post(`/students/${studentId}/historial`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    })
}

// Preview del historial de notas (sin persistir)
export const previewHistorial = (studentId, file) => {
    const formData = new FormData()
    formData.append('pdf', file)
    return httpClient.post(`/students/${studentId}/historial/preview`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    })
}

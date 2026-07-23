import httpClient from '../../../../infrastructure/httpClient.js'

export const fetchTeachers = () => httpClient.get('/disponibilidad/docentes')

export const fetchWindows = (teacher) => httpClient.get('/disponibilidad', { params: { teacher } })

export const createWindow = (data) => httpClient.post('/disponibilidad', data)

export const updateWindow = (id, data) => httpClient.put(`/disponibilidad/${id}`, data)

export const deleteWindow = (id) => httpClient.delete(`/disponibilidad/${id}`)

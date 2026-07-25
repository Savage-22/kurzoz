import httpClient from '../../../infrastructure/httpClient.js'

export const login = (studentId, password) =>
    httpClient.post('/auth/login', { studentId, password })

export const register = (studentId, password) =>
    httpClient.post('/auth/register', { studentId, password })

export const fetchMe = () => httpClient.get('/auth/me')

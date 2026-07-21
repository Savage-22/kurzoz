import axios from 'axios'
import { getToken, clearSession } from './session.js'

const httpClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
})

// Inyecta el token en cada request
httpClient.interceptors.request.use((request) => {
    const token = getToken()
    if (token) request.headers.Authorization = `Bearer ${token}`
    return request
})

// Ante un 401, cierra la sesión automáticamente
httpClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) clearSession()
        return Promise.reject(error)
    },
)

export default httpClient

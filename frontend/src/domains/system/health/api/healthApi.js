import httpClient from '../../../../infrastructure/httpClient.js'

export const fetchHealth = () => httpClient.get('/health')

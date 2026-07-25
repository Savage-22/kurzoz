import httpClient from '../../../../infrastructure/httpClient.js'

export const generateProposal = (term, weights) =>
  httpClient.post('/planificador/institucional', { term, weights })

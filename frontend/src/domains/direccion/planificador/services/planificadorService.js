import { generateProposal } from '../api/planificadorApi.js'

export const getProposal = async (term, weights) => {
  const { data } = await generateProposal(term, weights)
  return data.data
}

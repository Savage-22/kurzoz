// Cliente HTTP de DeepSeek (API compatible con OpenAI). Único punto que habla
// con el servicio externo; lee la config y traduce cualquier fallo a una
// excepción tipada para que el Service pueda degradar con elegancia.
import { config } from '../../../shared/config.js'
import { ExternalServiceError } from '../../../shared/errors.js'

export const chatCompletion = async ({ messages, temperature = 0.4, maxTokens = 600 }) => {
    const { apiKey, model, baseUrl } = config.deepseek
    if (!apiKey) throw new ExternalServiceError('DEEPSEEK_API_KEY no configurada')

    let response
    try {
        response = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens, stream: false }),
        })
    } catch (error) {
        throw new ExternalServiceError(`No se pudo contactar a DeepSeek: ${error.message}`)
    }

    if (!response.ok) {
        const detail = await response.text().catch(() => '')
        throw new ExternalServiceError(`DeepSeek respondió ${response.status}: ${detail.slice(0, 200)}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim()
    if (!content) throw new ExternalServiceError('DeepSeek no devolvió contenido')
    return content
}

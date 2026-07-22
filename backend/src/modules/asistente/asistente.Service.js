// Orquesta la explicación de un horario: pide al motor los planes rankeados,
// arma los hechos deterministas y los pasa a la IA para que los narre. La IA es
// una capa asesora: si falla, se responde con la explicación determinista.
import { NotFoundError } from '../../shared/errors.js'
import MotorService from '../motor/motor.Service.js'
import MotorRepository from '../motor/infrastructure/motor.Repository.js'
import { rankPlans } from '../motor/application/ranking.js'
import { buildExplanationFacts } from './application/explanationFacts.js'
import { buildExplanationMessages } from './application/explanationPrompt.js'
import { chatCompletion } from './infrastructure/deepseek.Client.js'

class AsistenteService {
    // Explica por qué el plan `planIndex` (0 = el mejor) es una buena elección.
    static async explainPlan(studentId, termCode, { planIndex = 0, ...options } = {}) {
        const { schedules, priorityByCourse } = await MotorService.generateSchedules(studentId, termCode, options)
        const plans = rankPlans(schedules, { weights: options.weights, priorityByCourse })
        if (plans.length === 0) throw new NotFoundError('No hay horarios para explicar con estos parámetros')

        const index = Math.min(Math.max(0, planIndex), plans.length - 1)
        const plan = plans[index]
        const runnerUp = plans[index === 0 ? 1 : 0] ?? null

        const courses = await MotorRepository.getCourses()
        const nameByCode = new Map(courses.map((c) => [c.code, c.name]))
        const facts = buildExplanationFacts({ plan, runnerUp, priorityByCourse, nameByCode })

        let explanation = facts.fallbackText
        let aiAvailable = false
        try {
            explanation = await chatCompletion({ messages: buildExplanationMessages(facts) })
            aiAvailable = true
        } catch (error) {
            console.error('Explicación IA no disponible, se usa la determinista:', error.message)
        }

        return { plan: facts.summary, explanation, aiAvailable, facts: facts.data }
    }
}

export default AsistenteService

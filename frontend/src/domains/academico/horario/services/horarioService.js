import { postAdjustments, postSchedules } from '../api/horarioApi.js'

// Genera y rankea horarios (#10/#11). objetivos = { term, maxCredits, chainInProgress, weights }.
export const generatePlans = async (studentId, objetivos) => {
    const { data } = await postSchedules(studentId, objetivos)
    return data.data
}

// Recomendaciones de ajuste (#12) para un conjunto de cursos deseados.
export const getAdjustments = async (studentId, { term, desiredCourses, maxCredits }) => {
    const { data } = await postAdjustments(studentId, { term, desiredCourses, maxCredits })
    return data.data
}

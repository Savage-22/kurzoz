import { createWindow, deleteWindow, fetchTeachers, fetchWindows, updateWindow } from '../api/disponibilidadApi.js'

export const getTeachers = async () => {
  const { data } = await fetchTeachers()
  return data.data
}

export const getWindows = async (teacher) => {
  const { data } = await fetchWindows(teacher)
  return data.data
}

export const addWindow = async (body) => {
  const { data } = await createWindow(body)
  return data.data
}

export const editWindow = async (id, body) => {
  const { data } = await updateWindow(id, body)
  return data.data
}

export const removeWindow = async (id) => {
  await deleteWindow(id)
}

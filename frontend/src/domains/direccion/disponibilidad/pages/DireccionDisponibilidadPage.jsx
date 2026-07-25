import { useCallback, useEffect, useState } from 'react'
import { addWindow, editWindow, getTeachers, getWindows, removeWindow } from '../services/disponibilidadService.js'
import DisponibilidadForm from '../components/DisponibilidadForm.jsx'
import DisponibilidadList from '../components/DisponibilidadList.jsx'

function DireccionDisponibilidadPage() {
  const [teachers, setTeachers] = useState([])
  const [selected, setSelected] = useState('')
  const [windows, setWindows] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    getTeachers()
      .then((list) => mounted && setTeachers(list))
      .catch((e) => mounted && setError(e.response?.data?.message ?? 'No se pudieron cargar los docentes'))
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (!selected) return
    let mounted = true
    getWindows(selected)
      .then((list) => mounted && setWindows(list))
      .catch((e) => mounted && setError(e.response?.data?.message ?? 'Error al cargar ventanas'))
    return () => { mounted = false }
  }, [selected])

  const handleTeacherChange = (value) => {
    setSelected(value)
    setWindows(null)
    setError(null)
    closeForm()
  }

  const refreshWindows = useCallback(() => {
    if (!selected) return
    getWindows(selected)
      .then(setWindows)
      .catch((e) => setError(e.response?.data?.message ?? 'Error al recargar ventanas'))
  }, [selected])

  const handleCreate = async (data) => {
    setSubmitting(true)
    setError(null)
    try {
      await addWindow({ teacher: selected, ...data })
      setFormOpen(false)
      refreshWindows()
    } catch (e) {
      const msgs = e.response?.data?.errors
      setError(msgs?.join(', ') ?? e.response?.data?.message ?? 'Error al crear ventana')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async (data) => {
    setSubmitting(true)
    setError(null)
    try {
      await editWindow(editing.id, data)
      setEditing(null)
      setFormOpen(false)
      refreshWindows()
    } catch (e) {
      const msgs = e.response?.data?.errors
      setError(msgs?.join(', ') ?? e.response?.data?.message ?? 'Error al actualizar ventana')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta ventana de disponibilidad?')) return
    setError(null)
    try {
      await removeWindow(id)
      refreshWindows()
    } catch (e) {
      setError(e.response?.data?.message ?? 'Error al eliminar ventana')
    }
  }

  const openEdit = (window) => {
    setEditing(window)
    setFormOpen(true)
  }

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditing(null)
    setError(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-800">Disponibilidad docente</h2>
        <select
          value={selected}
          onChange={(e) => handleTeacherChange(e.target.value)}
          className="rounded border border-border bg-background px-3 py-1.5 text-sm"
        >
          <option value="">Seleccionar docente…</option>
          {teachers.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {error && (
        <p className="rounded bg-error/10 px-3 py-2 text-sm text-error">{error}</p>
      )}

      {selected && (
        <>
          {windows === null ? (
            <p className="text-sm text-gray-400">Cargando ventanas…</p>
          ) : windows.length === 0 ? (
            <p className="text-sm text-gray-500">Este docente no tiene ventanas registradas.</p>
          ) : (
            <DisponibilidadList
              windows={windows}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          )}

          {formOpen ? (
            <div className="rounded-lg border border-border bg-background p-4">
              <h3 className="mb-3 text-xs font-semibold text-gray-700">
                {editing ? 'Editar ventana' : 'Nueva ventana'}
              </h3>
              <DisponibilidadForm
                initial={editing}
                onSubmit={editing ? handleUpdate : handleCreate}
                onCancel={closeForm}
                loading={submitting}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={openCreate}
              className="self-start rounded-lg bg-accent px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary"
            >
              + Nueva ventana
            </button>
          )}
        </>
      )}
    </div>
  )
}

export default DireccionDisponibilidadPage

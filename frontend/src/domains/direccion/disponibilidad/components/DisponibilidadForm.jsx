import { useState } from 'react'
import { DIAS, minutesToTime, timeToMinutes } from '../shared/disponibilidadUtils.js'

const INITIAL = { day: 1, startTime: '08:00', endTime: '10:00' }

function DisponibilidadForm({ initial, onSubmit, onCancel, loading }) {
  const editing = !!initial
  const [day, setDay] = useState(initial?.day ?? INITIAL.day)
  const [startTime, setStartTime] = useState(
    initial ? minutesToTime(initial.startMin) : INITIAL.startTime,
  )
  const [endTime, setEndTime] = useState(
    initial ? minutesToTime(initial.endMin) : INITIAL.endTime,
  )
  const [error, setError] = useState(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    const startMin = timeToMinutes(startTime)
    const endMin = timeToMinutes(endTime)
    if (endMin <= startMin) {
      setError('La hora de fin debe ser posterior a la de inicio')
      return
    }
    setError(null)
    onSubmit({ day, startMin, endMin })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
        Día
        <select
          value={day}
          onChange={(e) => setDay(Number(e.target.value))}
          className="rounded border border-border bg-background px-2 py-1.5 text-sm"
        >
          {DIAS.map((name, i) => (
            <option key={i + 1} value={i + 1}>{name}</option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
        Inicio
        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="rounded border border-border bg-background px-2 py-1.5 text-sm"
        />
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
        Fin
        <input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className="rounded border border-border bg-background px-2 py-1.5 text-sm"
        />
      </label>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary disabled:opacity-50"
        >
          {loading ? 'Guardando…' : editing ? 'Actualizar' : 'Agregar'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-surface"
        >
          Cancelar
        </button>
      </div>

      {error && <p className="w-full text-xs text-error">{error}</p>}
    </form>
  )
}

export default DisponibilidadForm

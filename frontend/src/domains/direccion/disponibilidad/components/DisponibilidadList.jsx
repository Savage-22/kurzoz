import { dayNumberToName, minutesToTime } from '../shared/disponibilidadUtils.js'

function DisponibilidadList({ windows, onEdit, onDelete, loading }) {
  if (loading) return <p className="text-sm text-gray-400">Cargando ventanas…</p>

  if (!windows || windows.length === 0) {
    return <p className="text-sm text-gray-500">Este docente no tiene ventanas registradas.</p>
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface text-left text-xs font-semibold text-gray-600">
            <th className="px-3 py-2">Día</th>
            <th className="px-3 py-2">Inicio</th>
            <th className="px-3 py-2">Fin</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {windows.map((w) => (
            <tr key={w.id} className="border-t border-border">
              <td className="px-3 py-2 font-medium text-gray-800">{dayNumberToName(w.day)}</td>
              <td className="px-3 py-2 text-gray-600">{minutesToTime(w.startMin)}</td>
              <td className="px-3 py-2 text-gray-600">{minutesToTime(w.endMin)}</td>
              <td className="px-3 py-2 text-right">
                <button
                  type="button"
                  onClick={() => onEdit(w)}
                  className="mr-2 text-xs font-medium text-primary hover:underline"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(w.id)}
                  className="text-xs font-medium text-error hover:underline"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default DisponibilidadList

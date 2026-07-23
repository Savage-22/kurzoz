import { dayNumberToName } from '../../disponibilidad/shared/disponibilidadUtils.js'

const REASON_LABEL = {
  disponibilidad_docente: 'Ajustado por disponibilidad docente',
  reduce_choques: 'Movido para reducir choques',
}

function DiffList({ diff }) {
  if (!diff || diff.length === 0) {
    return <p className="text-sm text-gray-500">No se movió ningún bloque — la oferta ya está optimizada.</p>
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface text-left text-xs font-semibold text-gray-600">
            <th className="px-3 py-2">Curso</th>
            <th className="px-3 py-2">Grupo</th>
            <th className="px-3 py-2">Docente</th>
            <th className="px-3 py-2">Desplazamiento</th>
            <th className="px-3 py-2">Motivo</th>
            <th className="px-3 py-2">Nuevo horario</th>
          </tr>
        </thead>
        <tbody>
          {diff.map((m, i) => (
            <tr key={i} className="border-t border-border">
              <td className="px-3 py-2 font-medium text-gray-800">{m.course}</td>
              <td className="px-3 py-2 text-gray-600">{m.group}</td>
              <td className="px-3 py-2 text-gray-600">{m.teacher}</td>
              <td className="px-3 py-2">
                <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${m.deltaSlots > 0 ? 'bg-warning-soft text-warning' : 'bg-primary-soft text-primary'}`}>
                  {m.deltaSlots > 0 ? '+' : ''}{m.deltaSlots} slots
                </span>
              </td>
              <td className="px-3 py-2 text-xs text-gray-500">{REASON_LABEL[m.reason] ?? m.reason}</td>
              <td className="px-3 py-2 text-xs text-gray-600">
                {m.sessions.map((s, j) => (
                  <div key={j}>
                    {dayNumberToName(s.day)} {s.from}–{s.to}
                  </div>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default DiffList

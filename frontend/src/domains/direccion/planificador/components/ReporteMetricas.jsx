function MetricCard({ label, before, after, invert }) {
  const improved = invert ? after < before : after < before
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <p className="text-xs font-medium text-gray-600">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-lg font-semibold text-gray-800">{after}</span>
        <span className="text-xs text-gray-400">antes {before}</span>
        {improved && <span className="text-xs font-medium text-success">✓</span>}
      </div>
    </div>
  )
}

function ReporteMetricas({ report }) {
  if (!report) return null

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <MetricCard label="Violaciones de disponibilidad" before={report.teacherViolations.before} after={report.teacherViolations.after} />
      <MetricCard label="Choques entre ciclos" before={report.crossCycleConflicts.before} after={report.crossCycleConflicts.after} />
      <MetricCard label="Conflictos de aulas" before={report.roomConflicts.before} after={report.roomConflicts.after} />
      <MetricCard label="Choques mismo ciclo" before={report.sameCycleConflicts.before} after={report.sameCycleConflicts.after} />
    </div>
  )
}

export default ReporteMetricas

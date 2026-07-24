// #12/#15 · Panel de recomendaciones de ajuste. Muestra cada propuesta (mover
// bloque / abrir grupo) con su ganancia y disrupción; al aplicar una, el padre
// re-pinta la grilla con el resultado hipotético.
function RecomendacionesPanel({ result, appliedId, onApply, onReset }) {
    if (!result) return null

    const { baselineCourses, proposals } = result
    if (proposals.length === 0) {
        return (
            <div className="rounded-xl border border-border bg-surface p-4">
                <p className="text-sm text-text-secondary">
                    Con los cursos deseados se pueden llevar {baselineCourses}; no hace falta
                    ajuste (o ninguno mejora el resultado).
                </p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-3">
            <p className="text-xs font-medium text-text-muted">
                Base cursable: {baselineCourses}. Ajustes propuestos (hipótesis, sujetos a
                aprobación):
            </p>
            {proposals.map((p, i) => {
                const applied = appliedId === i
                const isMove = p.type === 'MOVER'
                const isComfort = p.motive === 'CONFORT'
                return (
                    <div
                        key={i}
                        className={`rounded-xl border p-4 transition-all duration-200 ${
                            applied
                                ? 'border-primary bg-primary-soft shadow-md'
                                : 'border-border bg-surface shadow-sm'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-bold text-white ${
                                    isMove ? 'bg-accent' : 'bg-primary'
                                }`}
                            >
                                {isMove ? 'MOVER' : 'GRUPO NUEVO'}
                            </span>
                            {isComfort ? (
                                <span className="text-xs font-semibold text-accent">
                                    ↑ comodidad (sin cambiar cursos)
                                </span>
                            ) : (
                                <span className="text-xs font-semibold text-success">
                                    +{p.gain} curso{p.gain > 1 ? 's' : ''} →{' '}
                                    {baselineCourses + p.gain}
                                </span>
                            )}
                        </div>
                        <p className="mt-2 text-sm text-text-primary">
                            <span className="font-semibold">{p.course}</span>
                            {isMove
                                ? ` · mover bloque del día ${p.day} de ${p.from} a ${p.to} (${Math.abs(p.shiftSlots)}×45 min)`
                                : ` · abrir grupo ${p.group} el día ${p.day} en ${p.to}`}
                        </p>
                        <div className="mt-3 flex items-center justify-between">
                            <span className="text-[11px] text-text-muted">
                                disrupción: {p.disruption} bloque
                            </span>
                            <button
                                type="button"
                                onClick={() => (applied ? onReset() : onApply(i, p))}
                                className="rounded-lg border border-primary bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
                            >
                                {applied ? 'Quitar previsualización' : 'Previsualizar'}
                            </button>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export default RecomendacionesPanel

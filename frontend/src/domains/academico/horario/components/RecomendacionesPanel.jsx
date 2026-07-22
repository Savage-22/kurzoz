// #12/#15 · Panel de recomendaciones de ajuste. Muestra cada propuesta (mover
// bloque / abrir grupo) con su ganancia y disrupción; al aplicar una, el padre
// re-pinta la grilla con el resultado hipotético.
function RecomendacionesPanel({ result, appliedId, onApply, onReset }) {
    if (!result) return null

    const { baselineCourses, proposals } = result
    if (proposals.length === 0) {
        return (
            <p className="rounded-lg border border-border bg-surface p-3 text-sm text-gray-500">
                Con los cursos deseados se pueden llevar {baselineCourses}; no hace falta ajuste (o ninguno mejora el resultado).
            </p>
        )
    }

    return (
        <div className="flex flex-col gap-2">
            <p className="text-xs text-gray-500">Base cursable: {baselineCourses}. Ajustes propuestos (hipótesis, sujetos a aprobación):</p>
            {proposals.map((p, i) => {
                const applied = appliedId === i
                const isMove = p.type === 'MOVER'
                return (
                    <div key={i} className={`rounded-lg border p-3 ${applied ? 'border-primary bg-primary-soft' : 'border-border bg-surface'}`}>
                        <div className="flex items-center justify-between">
                            <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold text-white ${isMove ? 'bg-accent' : 'bg-primary'}`}>
                                {isMove ? 'MOVER' : 'GRUPO NUEVO'}
                            </span>
                            <span className="text-xs font-semibold text-success">+{p.gain} curso{p.gain > 1 ? 's' : ''} → {baselineCourses + p.gain}</span>
                        </div>
                        <p className="mt-1.5 text-sm text-gray-700">
                            <span className="font-semibold">{p.course}</span>
                            {isMove
                                ? ` · mover bloque del día ${p.day} de ${p.from} a ${p.to} (${Math.abs(p.shiftSlots)}×45 min)`
                                : ` · abrir grupo ${p.group} el día ${p.day} en ${p.to}`}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                            <span className="text-[11px] text-gray-400">disrupción: {p.disruption} bloque</span>
                            <button
                                type="button"
                                onClick={() => (applied ? onReset() : onApply(i, p))}
                                className="rounded border border-primary px-2 py-1 text-xs font-medium text-primary hover:bg-primary hover:text-white"
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

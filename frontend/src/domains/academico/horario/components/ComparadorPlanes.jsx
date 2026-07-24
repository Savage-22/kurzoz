import { courseBg } from '../../shared/horarioUtils.js'

// #16 · Lista los planes candidatos rankeados con su puntaje y desglose, y
// permite elegir cuál se pinta en la grilla.
function ComparadorPlanes({ plans, selectedIndex, onSelect }) {
    if (!plans || plans.length === 0) {
        return (
            <div className="rounded-xl border border-border bg-surface p-6 text-center">
                <p className="text-sm text-text-muted">Aún no hay planes generados.</p>
            </div>
        )
    }

    return (
        <ul className="flex flex-col gap-3">
            {plans.map((plan, i) => {
                const selected = i === selectedIndex
                return (
                    <li key={i}>
                        <button
                            type="button"
                            onClick={() => onSelect(i)}
                            className={`w-full rounded-xl border p-4 text-left transition-all duration-200 ${
                                selected
                                    ? 'border-primary bg-primary-soft shadow-md'
                                    : 'border-border bg-surface shadow-sm hover:border-border-hover hover:shadow-md'
                            }`}
                        >
                            <div className="flex items-baseline justify-between">
                                <span className="text-sm font-semibold text-text-primary">
                                    Plan {i + 1}
                                    {i === 0 && (
                                        <span className="ml-2 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold text-white">
                                            mejor
                                        </span>
                                    )}
                                </span>
                                <span className="text-xs text-text-muted">
                                    {plan.breakdown.courses} cursos · {plan.breakdown.credits} cr
                                </span>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-1.5">
                                {plan.courses.map((c) => (
                                    <span
                                        key={c.code}
                                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium text-white ${courseBg(c.code)}`}
                                    >
                                        {c.code}/{c.group}
                                    </span>
                                ))}
                            </div>

                            {/* Desglose por métrica: hace inspeccionable el ranking */}
                            <dl className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                                <Metric label="Cursos" value={plan.breakdown.courses} />
                                <Metric label="Prioridad" value={plan.breakdown.priority} />
                                <Metric label="Comodidad" value={plan.breakdown.comfort} />
                            </dl>

                            {plan.breakdown.strategic?.length > 0 && (
                                <div className="mt-3 rounded-lg bg-primary-soft px-3 py-2">
                                    <p className="text-[11px] font-medium text-primary">
                                        ★ Abre curso del próximo ciclo:{' '}
                                        {plan.breakdown.strategic.join(', ')}
                                    </p>
                                </div>
                            )}
                            {plan.leftOut?.length > 0 && (
                                <p className="mt-2 text-[11px] text-text-muted">
                                    Fuera por choque/cupo: {plan.leftOut.join(', ')}
                                </p>
                            )}
                        </button>
                    </li>
                )
            })}
        </ul>
    )
}

function Metric({ label, value }) {
    return (
        <div className="rounded-lg bg-background py-2">
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                {label}
            </dt>
            <dd className="mt-0.5 font-bold text-text-primary">{value}</dd>
        </div>
    )
}

export default ComparadorPlanes

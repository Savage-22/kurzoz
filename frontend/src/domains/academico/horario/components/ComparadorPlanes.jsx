import { courseBg } from '../../shared/horarioUtils.js'

// #16 · Lista los planes candidatos rankeados con su puntaje y desglose, y
// permite elegir cuál se pinta en la grilla.
function ComparadorPlanes({ plans, selectedIndex, onSelect }) {
    if (!plans || plans.length === 0) {
        return <p className="text-sm text-gray-400">Aún no hay planes generados.</p>
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
                            className={`w-full rounded-lg border p-4 text-left transition ${
                                selected ? 'border-primary bg-primary-soft' : 'border-border bg-surface hover:border-primary'
                            }`}
                        >
                            <div className="flex items-baseline justify-between">
                                <span className="text-sm font-semibold text-gray-800">
                                    Plan {i + 1}
                                    {i === 0 && <span className="ml-2 rounded bg-primary px-1.5 py-0.5 text-[10px] text-white">mejor</span>}
                                </span>
                                <span className="text-xs text-gray-500">{plan.breakdown.courses} cursos · {plan.breakdown.credits} cr</span>
                            </div>

                            <div className="mt-2 flex flex-wrap gap-1">
                                {plan.courses.map((c) => (
                                    <span key={c.code} className={`rounded px-1.5 py-0.5 text-[10px] text-white ${courseBg(c.code)}`}>
                                        {c.code}/{c.group}
                                    </span>
                                ))}
                            </div>

                            {/* Desglose por métrica: hace inspeccionable el ranking */}
                            <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                                <Metric label="Cursos" value={plan.breakdown.courses} />
                                <Metric label="Desbloqueo" value={plan.breakdown.unlock} />
                                <Metric label="Comodidad" value={plan.breakdown.comfort} />
                            </dl>

                            {plan.leftOut?.length > 0 && (
                                <p className="mt-2 text-[11px] text-gray-500">Fuera por choque/cupo: {plan.leftOut.join(', ')}</p>
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
        <div className="rounded bg-background py-1">
            <dt className="text-[10px] uppercase tracking-wide text-gray-400">{label}</dt>
            <dd className="font-semibold text-gray-700">{value}</dd>
        </div>
    )
}

export default ComparadorPlanes

// Lista los cursos faltantes agrupados por ciclo, con su paridad y tipo.
function FaltantesList({ data }) {
    if (!data) return <p className="text-sm text-gray-400">Cargando estado…</p>

    const byCycle = new Map()
    for (const c of data.remaining) {
        if (!byCycle.has(c.cycleNumber)) byCycle.set(c.cycleNumber, [])
        byCycle.get(c.cycleNumber).push(c)
    }
    const cycles = [...byCycle.keys()].sort((a, b) => a - b)

    return (
        <div>
            <div className="mb-4 flex flex-wrap gap-3 text-sm">
                <Stat label="Faltantes" value={data.counts.total} />
                <Stat label="Obligatorios" value={data.counts.obligatorios} />
                <Stat label="Electivos" value={data.counts.electivos} />
                <Stat label="Créditos por aprobar" value={data.creditsRemaining} />
                <Stat label="Créditos aprobados" value={data.creditsApproved} />
            </div>

            <div className="flex flex-col gap-4">
                {cycles.map((cycle) => (
                    <section key={cycle}>
                        <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Ciclo {cycle} · {byCycle.get(cycle)[0].cycleParity}
                        </h3>
                        <ul className="flex flex-col gap-1">
                            {byCycle.get(cycle).map((c) => (
                                <li key={c.code} className="flex items-center justify-between rounded border border-border bg-surface px-3 py-1.5 text-sm">
                                    <span>
                                        <span className="font-mono text-xs text-gray-500">{c.code}</span> {c.name}
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <span className="text-xs text-gray-400">{c.credits} cr</span>
                                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${c.type === 'OBL' ? 'bg-primary-soft text-primary' : 'bg-warning-soft text-warning'}`}>
                                            {c.type === 'OBL' ? 'Obligatorio' : 'Electivo'}
                                        </span>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </section>
                ))}
            </div>
        </div>
    )
}

function Stat({ label, value }) {
    return (
        <div className="rounded-lg border border-border bg-surface px-3 py-2">
            <div className="text-lg font-semibold text-primary">{value}</div>
            <div className="text-[11px] text-gray-500">{label}</div>
        </div>
    )
}

export default FaltantesList

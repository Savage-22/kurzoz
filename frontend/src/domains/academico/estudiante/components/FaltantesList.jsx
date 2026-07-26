// Lista los cursos faltantes agrupados por ciclo, con su paridad y tipo.
function FaltantesList({ data, studentId, onCourseApproved }) {
    if (!data) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    <p className="text-sm text-text-muted">Cargando estado académico…</p>
                </div>
            </div>
        )
    }

    const byCycle = new Map()
    for (const c of data.remaining) {
        if (!byCycle.has(c.cycleNumber)) byCycle.set(c.cycleNumber, [])
        byCycle.get(c.cycleNumber).push(c)
    }
    const cycles = [...byCycle.keys()].sort((a, b) => a - b)

    return (
        <div>
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                <Stat label="Faltantes" value={data.counts.total} color="primary" />
                <Stat label="Obligatorios" value={data.counts.obligatorios} color="accent" />
                <Stat label="Electivos" value={data.counts.electivos} color="warning" />
                <Stat label="Créditos por aprobar" value={data.creditsRemaining} color="error" />
                <Stat label="Créditos aprobados" value={data.creditsApproved} color="success" />
            </div>

            <div className="flex flex-col gap-5">
                {cycles.map((cycle) => (
                    <section key={cycle}>
                        <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary-soft text-[10px] font-bold text-primary">
                                {cycle}
                            </span>
                            Ciclo {cycle} · {byCycle.get(cycle)[0].cycleParity}
                        </h3>
                        <ul className="flex flex-col gap-2">
                            {byCycle.get(cycle).map((c) => (
                                <li
                                    key={c.code}
                                    className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3 shadow-sm transition-all hover:border-border-hover hover:shadow-md"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="font-mono text-xs font-medium text-text-muted">
                                            {c.code}
                                        </span>
                                        <span className="text-sm font-medium text-text-primary">
                                            {c.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-text-muted">
                                            {c.credits} cr
                                        </span>
                                        <span
                                            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                                                c.type === 'OBL'
                                                    ? 'bg-primary-soft text-primary'
                                                    : 'bg-warning-soft text-warning'
                                            }`}
                                        >
                                            {c.type === 'OBL' ? 'Obligatorio' : 'Electivo'}
                                        </span>
                                        {studentId && (
                                            <button
                                                type="button"
                                                onClick={() => onCourseApproved?.(c.code)}
                                                className="rounded-md border border-success bg-success-soft px-2 py-1 text-[10px] font-semibold text-success transition-colors hover:bg-success hover:text-white"
                                                title="Marcar como curso ya llevado"
                                            >
                                                Lo llevé
                                            </button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </section>
                ))}
            </div>
        </div>
    )
}

function Stat({ label, value, color = 'primary' }) {
    const colorClasses = {
        primary: 'text-primary',
        accent: 'text-accent',
        success: 'text-success',
        warning: 'text-warning',
        error: 'text-error',
    }

    return (
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
            <div className={`text-2xl font-bold ${colorClasses[color]}`}>{value}</div>
            <div className="mt-1 text-xs font-medium text-text-muted">{label}</div>
        </div>
    )
}

export default FaltantesList

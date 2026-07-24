// Aviso de discrepancias entre el avance y el Excel (reporte #6). Solo aparece
// si hay discrepancias; el avance manda, esto solo señala.
function DiscrepanciasAviso({ data }) {
    if (!data?.available || data.discrepancies.length === 0) return null

    return (
        <div className="rounded-xl border border-warning bg-warning-soft p-4">
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-warning" viewBox="0 0 20 20" fill="currentColor">
                        <path
                            fillRule="evenodd"
                            d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                            clipRule="evenodd"
                        />
                    </svg>
                </div>
                <div className="flex-1">
                    <p className="text-sm font-semibold text-warning">
                        {data.discrepancies.length} discrepancia(s) entre el avance y el Excel
                    </p>
                    <ul className="mt-2 flex flex-col gap-1.5 text-xs text-text-secondary">
                        {data.discrepancies.map((d) => (
                            <li key={d.code} className="flex items-start gap-1">
                                <span className="font-mono font-medium text-text-primary">{d.code}</span>:
                                <span>
                                    Excel dice <b>{d.excel}</b>, el avance dice <b>{d.avance}</b> — {d.detail}
                                </span>
                            </li>
                        ))}
                    </ul>
                    <p className="mt-2 text-[11px] text-text-muted">
                        El estado se consolida según el avance (fuente de verdad).
                    </p>
                </div>
            </div>
        </div>
    )
}

export default DiscrepanciasAviso

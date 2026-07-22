// Aviso de discrepancias entre el avance y el Excel (reporte #6). Solo aparece
// si hay discrepancias; el avance manda, esto solo señala.
function DiscrepanciasAviso({ data }) {
    if (!data?.available || data.discrepancies.length === 0) return null

    return (
        <div className="rounded-lg border border-warning bg-warning-soft p-3">
            <p className="text-sm font-semibold text-warning">
                {data.discrepancies.length} discrepancia(s) entre el avance y el Excel
            </p>
            <ul className="mt-1.5 flex flex-col gap-1 text-xs text-gray-700">
                {data.discrepancies.map((d) => (
                    <li key={d.code}>
                        <span className="font-mono">{d.code}</span>: Excel dice <b>{d.excel}</b>, el avance dice <b>{d.avance}</b> — {d.detail}
                    </li>
                ))}
            </ul>
            <p className="mt-1.5 text-[11px] text-gray-500">El estado se consolida según el avance (fuente de verdad).</p>
        </div>
    )
}

export default DiscrepanciasAviso

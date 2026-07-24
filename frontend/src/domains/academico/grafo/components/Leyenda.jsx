// Leyenda de colores del grafo de prerrequisitos.
const ITEMS = [
    ['Aprobado', 'border-success bg-success-soft text-success'],
    ['En curso', 'border-warning bg-warning-soft text-warning'],
    ['Elegible este ciclo', 'border-primary bg-primary-soft text-primary'],
    ['Bloqueado', 'border-border bg-surface text-text-muted'],
]

function Leyenda() {
    return (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-sm">
            {ITEMS.map(([label, cls]) => (
                <span
                    key={label}
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${cls}`}
                >
                    {label}
                </span>
            ))}
            <span className="text-xs text-text-muted">
                ★ abre un curso del próximo ciclo · líneas punteadas = prerrequisito alternativo (O)
            </span>
        </div>
    )
}

export default Leyenda

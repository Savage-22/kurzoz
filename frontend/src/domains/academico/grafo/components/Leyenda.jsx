// Leyenda de colores del grafo de prerrequisitos.
const ITEMS = [
    ['Aprobado', 'border-success bg-success-soft text-success'],
    ['En curso', 'border-warning bg-warning-soft text-warning'],
    ['Elegible este ciclo', 'border-primary bg-primary-soft text-primary'],
    ['Bloqueado', 'border-border bg-surface text-gray-500'],
]

function Leyenda() {
    return (
        <div className="flex flex-wrap items-center gap-2 text-xs">
            {ITEMS.map(([label, cls]) => (
                <span key={label} className={`rounded border px-2 py-0.5 ${cls}`}>
                    {label}
                </span>
            ))}
            <span className="text-gray-500">★ abre un curso del próximo ciclo · líneas punteadas = prerrequisito alternativo (O)</span>
        </div>
    )
}

export default Leyenda

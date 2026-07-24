import { Handle, Position } from '@xyflow/react'

// Nodo de curso del grafo. El color codifica el estado; ★ marca los cursos
// estratégicos (abren un curso del próximo ciclo). Clases literales para que
// Tailwind v4 no las purgue.
const STATUS_CLASS = {
    aprobado: 'border-success bg-success-soft text-success',
    en_curso: 'border-warning bg-warning-soft text-warning',
    elegible: 'border-primary bg-primary-soft text-primary',
    bloqueado: 'border-border bg-surface text-text-muted',
}

function CursoNode({ data }) {
    return (
        <div
            className={`w-56 rounded-xl border-2 px-3 py-2 shadow-sm transition-all hover:shadow-md ${STATUS_CLASS[data.status] ?? STATUS_CLASS.bloqueado}`}
        >
            <Handle type="target" position={Position.Left} />
            <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-bold">{data.code}</span>
                {data.strategic && (
                    <span
                        className="text-sm"
                        title="Abre un curso del próximo ciclo"
                    >
                        ★
                    </span>
                )}
            </div>
            <p className="mt-1 text-[11px] leading-tight text-text-secondary">
                {data.name}
            </p>
            <Handle type="source" position={Position.Right} />
        </div>
    )
}

export default CursoNode

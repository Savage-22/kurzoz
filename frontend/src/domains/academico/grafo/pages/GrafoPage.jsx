import { useEffect, useState } from 'react'
import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { fetchGraphView } from '../services/grafoService.js'
import CursoNode from '../components/CursoNode.jsx'
import Leyenda from '../components/Leyenda.jsx'

// #37 · Visualizador del grafo de prerrequisitos: "cómo está tu situación".
// Cursos por columnas de ciclo, color por estado, flechas = prerrequisitos.
const nodeTypes = { curso: CursoNode }

function GrafoPage({ studentId, term }) {
    const [state, setState] = useState({ loading: true })

    useEffect(() => {
        let mounted = true
        fetchGraphView(studentId, term)
            .then((view) => mounted && setState({ loading: false, view }))
            .catch((e) => mounted && setState({ loading: false, error: e.response?.data?.message ?? 'No se pudo cargar el grafo' }))
        return () => {
            mounted = false
        }
    }, [studentId, term])

    if (state.loading) return <p className="text-gray-400">Cargando grafo…</p>
    if (state.error) return <p className="text-error">{state.error}</p>

    return (
        <div className="flex flex-col gap-3">
            <Leyenda />
            <div className="h-[72vh] rounded-lg border border-border bg-surface">
                <ReactFlow nodes={state.view.nodes} edges={state.view.edges} nodeTypes={nodeTypes} fitView minZoom={0.2}>
                    <Background />
                    <Controls />
                    <MiniMap pannable zoomable />
                </ReactFlow>
            </div>
        </div>
    )
}

export default GrafoPage

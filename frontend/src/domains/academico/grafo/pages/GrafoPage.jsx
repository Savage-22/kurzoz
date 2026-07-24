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
            .catch(
                (e) =>
                    mounted &&
                    setState({
                        loading: false,
                        error: e.response?.data?.message ?? 'No se pudo cargar el grafo',
                    }),
            )
        return () => {
            mounted = false
        }
    }, [studentId, term])

    if (state.loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    <p className="text-sm font-medium text-text-secondary">Cargando grafo…</p>
                </div>
            </div>
        )
    }

    if (state.error) {
        return (
            <div className="rounded-xl border border-error-soft bg-error-soft p-6 text-center">
                <p className="text-sm font-medium text-error">{state.error}</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4">
            <Leyenda />
            <div className="h-[75vh] rounded-xl border border-border bg-surface shadow-sm">
                <ReactFlow
                    nodes={state.view.nodes}
                    edges={state.view.edges}
                    nodeTypes={nodeTypes}
                    fitView
                    minZoom={0.2}
                >
                    <Background />
                    <Controls />
                    <MiniMap pannable zoomable />
                </ReactFlow>
            </div>
        </div>
    )
}

export default GrafoPage

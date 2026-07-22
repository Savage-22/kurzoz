import { getGraph } from '../api/grafoApi.js'

// Ubica cada curso en la columna de su ciclo (x) y lo apila por fila (y).
const COLUMN_WIDTH = 240
const ROW_HEIGHT = 96

// Trae el grafo del backend y lo transforma a la forma de React Flow, con un
// layout por ciclos (columnas). El estilo de cada nodo lo resuelve CursoNode
// según su estado; las aristas O (prereq alternativo) van punteadas.
export const fetchGraphView = async (studentId, term) => {
    const { data } = await getGraph(studentId, term)
    const { nodes, edges } = data.data

    const byCycle = new Map()
    for (const node of nodes) {
        const cycle = node.cycle ?? 0
        if (!byCycle.has(cycle)) byCycle.set(cycle, [])
        byCycle.get(cycle).push(node)
    }

    const rfNodes = []
    for (const [cycle, list] of [...byCycle.entries()].sort((a, b) => a[0] - b[0])) {
        list.forEach((node, row) => {
            rfNodes.push({
                id: node.code,
                type: 'curso',
                position: { x: Math.max(0, cycle - 1) * COLUMN_WIDTH, y: row * ROW_HEIGHT },
                data: node,
            })
        })
    }

    const rfEdges = edges.map((edge, i) => ({
        id: `e${i}`,
        source: edge.source,
        target: edge.target,
        style: { stroke: edge.kind === 'O' ? '#a78bfa' : '#cbd5e1', strokeDasharray: edge.kind === 'O' ? '4 3' : undefined },
    }))

    return { nodes: rfNodes, edges: rfEdges }
}

import { useState } from 'react'
import EstadoPage from './domains/academico/estudiante/pages/EstadoPage.jsx'
import HorarioPage from './domains/academico/horario/pages/HorarioPage.jsx'
import GrafoPage from './domains/academico/grafo/pages/GrafoPage.jsx'
import DireccionDisponibilidadPage from './domains/direccion/disponibilidad/pages/DireccionDisponibilidadPage.jsx'
import DireccionPlanificadorPage from './domains/direccion/planificador/pages/DireccionPlanificadorPage.jsx'

const DEFAULT_STUDENT = '2023110208'
const DEFAULT_OBJETIVOS = {
    term: '2026-II',
    maxCredits: 24,
    chainInProgress: false,
    weights: { courses: 1000, priority: 6, comfort: 40 },
}

function App() {
    const [view, setView] = useState('estado')
    const [studentId] = useState(DEFAULT_STUDENT)
    const [objetivos, setObjetivos] = useState(DEFAULT_OBJETIVOS)

    return (
        <div className="mx-auto flex min-h-svh max-w-6xl flex-col gap-6 px-6 py-8">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-primary">Kurzoz</h1>
                    <p className="text-sm text-gray-500">Planificador de horarios · Ingeniería de Sistemas UNHEVAL · {studentId}</p>
                </div>
                <nav className="flex gap-1 rounded-lg border border-border bg-surface p-1">
                    <Tab active={view === 'estado'} onClick={() => setView('estado')}>Estado y objetivos</Tab>
                    <Tab active={view === 'horario'} onClick={() => setView('horario')}>Horario ideal</Tab>
                    <Tab active={view === 'grafo'} onClick={() => setView('grafo')}>Mi situación</Tab>
                    <Tab active={view === 'disponibilidad'} onClick={() => setView('disponibilidad')}>Disponibilidad</Tab>
                    <Tab active={view === 'planificador'} onClick={() => setView('planificador')}>Planificador</Tab>
                </nav>
            </header>

            <main>
                {view === 'estado' && (
                    <EstadoPage
                        key={studentId}
                        studentId={studentId}
                        objetivos={objetivos}
                        onObjetivosChange={setObjetivos}
                        onGenerate={() => setView('horario')}
                    />
                )}
                {view === 'horario' && (
                    <HorarioPage key={`${studentId}:${JSON.stringify(objetivos)}`} studentId={studentId} objetivos={objetivos} />
                )}
                {view === 'grafo' && <GrafoPage key={studentId} studentId={studentId} term={objetivos.term} />}
                {view === 'disponibilidad' && <DireccionDisponibilidadPage />}
                {view === 'planificador' && <DireccionPlanificadorPage />}
            </main>
        </div>
    )
}

function Tab({ active, onClick, children }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                active ? 'bg-primary text-white' : 'text-gray-600 hover:text-primary'
            }`}
        >
            {children}
        </button>
    )
}

export default App

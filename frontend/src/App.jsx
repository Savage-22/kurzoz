import { useState } from 'react'
import EstadoPage from './domains/academico/estudiante/pages/EstadoPage.jsx'
import HorarioPage from './domains/academico/horario/pages/HorarioPage.jsx'
import GrafoPage from './domains/academico/grafo/pages/GrafoPage.jsx'

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
        <div className="mx-auto flex min-h-svh max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
                        Kurzoz
                    </h1>
                    <p className="mt-1 text-sm text-text-secondary">
                        Planificador de horarios · Ingeniería de Sistemas UNHEVAL · {studentId}
                    </p>
                </div>
                <nav className="flex gap-1 rounded-xl border border-border bg-surface p-1 shadow-sm">
                    <Tab active={view === 'estado'} onClick={() => setView('estado')}>
                        Estado y objetivos
                    </Tab>
                    <Tab active={view === 'horario'} onClick={() => setView('horario')}>
                        Horario ideal
                    </Tab>
                    <Tab active={view === 'grafo'} onClick={() => setView('grafo')}>
                        Mi situación
                    </Tab>
                </nav>
            </header>

            <main className="flex-1">
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
                    <HorarioPage
                        key={`${studentId}:${JSON.stringify(objetivos)}`}
                        studentId={studentId}
                        objetivos={objetivos}
                    />
                )}
                {view === 'grafo' && (
                    <GrafoPage key={studentId} studentId={studentId} term={objetivos.term} />
                )}
            </main>

            <footer className="border-t border-border py-4 text-center text-xs text-text-muted">
                Kurzoz © 2026 · Planificador académico para UNHEVAL
            </footer>
        </div>
    )
}

function Tab({ active, onClick, children }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                active
                    ? 'bg-primary text-white shadow-md'
                    : 'text-text-secondary hover:bg-surface-hover hover:text-primary'
            }`}
        >
            {children}
        </button>
    )
}

export default App

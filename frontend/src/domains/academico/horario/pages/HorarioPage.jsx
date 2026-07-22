import { useEffect, useState } from 'react'
import { generatePlans, getAdjustments } from '../services/horarioService.js'
import { applyProposal, detectOverlaps } from '../../shared/horarioUtils.js'
import GrillaSemanal from '../components/GrillaSemanal.jsx'
import ComparadorPlanes from '../components/ComparadorPlanes.jsx'
import RecomendacionesPanel from '../components/RecomendacionesPanel.jsx'

// #15 + #16 · Comparador de planes, grilla del plan elegido y recomendaciones
// de ajuste con previsualización sobre la grilla.
function HorarioPage({ studentId, objetivos }) {
    const [state, setState] = useState({ loading: true })
    const [selected, setSelected] = useState(0)
    const [adjust, setAdjust] = useState(null)
    const [applied, setApplied] = useState(null) // { id, proposal }

    // El padre remonta esta página (key por alumno+objetivos), así que el estado
    // arranca en loading y el efecto solo dispara la generación.
    useEffect(() => {
        let mounted = true
        generatePlans(studentId, objetivos)
            .then((data) => mounted && setState({ loading: false, data }))
            .catch((e) => mounted && setState({ loading: false, error: e.response?.data?.message ?? 'No se pudieron generar horarios' }))
        return () => {
            mounted = false
        }
    }, [studentId, objetivos])

    if (state.loading) return <p className="text-gray-400">Generando horarios…</p>
    if (state.error) return <p className="text-error">{state.error}</p>

    const plans = state.data.plans
    if (plans.length === 0) return <p className="text-gray-500">No hay horarios posibles con estos objetivos.</p>

    const plan = plans[selected]
    const displayedSections = applyProposal(plan.sections, applied?.proposal)
    const conflicted = detectOverlaps(displayedSections)

    const buscarAjustes = async () => {
        const desiredCourses = [...plan.courses.map((c) => c.code), ...plan.leftOut].filter((c) => /^\d{4}$/.test(c))
        const result = await getAdjustments(studentId, { term: objetivos.term, desiredCourses, maxCredits: objetivos.maxCredits })
        setAdjust(result)
        setApplied(null)
    }

    return (
        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
            <section>
                <h2 className="mb-3 text-sm font-semibold text-gray-800">Planes candidatos ({plans.length})</h2>
                <ComparadorPlanes
                    plans={plans}
                    selectedIndex={selected}
                    onSelect={(i) => {
                        setSelected(i)
                        setApplied(null)
                        setAdjust(null)
                    }}
                />
            </section>

            <section className="flex flex-col gap-4">
                <div className="rounded-lg border border-border bg-background p-4">
                    <div className="mb-2 flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-gray-800">
                            Grilla · Plan {selected + 1}
                            {applied && <span className="ml-2 text-xs font-normal text-accent">(previsualización de ajuste)</span>}
                        </h2>
                        {conflicted.size > 0 && <span className="text-xs font-medium text-error">choques resaltados</span>}
                    </div>
                    <GrillaSemanal sections={displayedSections} conflictedCodes={conflicted} />
                </div>

                <div className="rounded-lg border border-border bg-background p-4">
                    <div className="mb-2 flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-gray-800">¿Llevar más cursos? Ajustes de horario</h2>
                        <button
                            type="button"
                            onClick={buscarAjustes}
                            className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary"
                        >
                            Buscar ajustes
                        </button>
                    </div>
                    <RecomendacionesPanel
                        result={adjust}
                        appliedId={applied?.id ?? null}
                        onApply={(id, proposal) => setApplied({ id, proposal })}
                        onReset={() => setApplied(null)}
                    />
                </div>
            </section>
        </div>
    )
}

export default HorarioPage

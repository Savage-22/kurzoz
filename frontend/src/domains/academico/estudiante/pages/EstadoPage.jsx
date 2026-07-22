import { useEffect, useState } from 'react'
import { getDiscrepancies, getRemaining } from '../services/estudianteService.js'
import FaltantesList from '../components/FaltantesList.jsx'
import ObjetivosForm from '../components/ObjetivosForm.jsx'
import DiscrepanciasAviso from '../components/DiscrepanciasAviso.jsx'

// #14 · Estado curricular del alumno + configuración de objetivos.
function EstadoPage({ studentId, objetivos, onObjetivosChange, onGenerate }) {
    const [remaining, setRemaining] = useState(null)
    const [discrepancias, setDiscrepancias] = useState(null)
    const [error, setError] = useState(null)

    // El padre remonta por alumno (key), así que el estado arranca vacío y el
    // efecto solo carga; no hace falta resetear de forma síncrona.
    useEffect(() => {
        let mounted = true
        getRemaining(studentId)
            .then((data) => mounted && setRemaining(data))
            .catch((e) => mounted && setError(e.response?.data?.message ?? 'No se pudo cargar el estado'))
        getDiscrepancies(studentId).then((data) => mounted && setDiscrepancias(data))
        return () => {
            mounted = false
        }
    }, [studentId])

    return (
        <div className="grid gap-6 md:grid-cols-[1fr_320px]">
            <section className="flex flex-col gap-4">
                {discrepancias && <DiscrepanciasAviso data={discrepancias} />}
                {error ? <p className="text-sm text-error">{error}</p> : <FaltantesList data={remaining} />}
            </section>

            <aside className="h-fit rounded-lg border border-border bg-background p-4">
                <h2 className="mb-3 text-sm font-semibold text-gray-800">Objetivos del horario</h2>
                <ObjetivosForm objetivos={objetivos} onChange={onObjetivosChange} onGenerate={onGenerate} />
            </aside>
        </div>
    )
}

export default EstadoPage

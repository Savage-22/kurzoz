import { useEffect, useState } from 'react'
import { getDiscrepancies, getRemaining } from '../services/estudianteService.js'
import FaltantesList from '../components/FaltantesList.jsx'
import ObjetivosForm from '../components/ObjetivosForm.jsx'
import DiscrepanciasAviso from '../components/DiscrepanciasAviso.jsx'
import AvanceUpload from '../components/AvanceUpload.jsx'
import HistorialUpload from '../components/HistorialUpload.jsx'

// #14 · Estado curricular del alumno + configuración de objetivos.
function EstadoPage({ studentId, objetivos, onObjetivosChange, onGenerate }) {
    const [remaining, setRemaining] = useState(null)
    const [discrepancias, setDiscrepancias] = useState(null)
    const [error, setError] = useState(null)
    const [uploadMode, setUploadMode] = useState(null) // null | 'avance' | 'historial'

    const loadData = () => {
        getRemaining(studentId)
            .then((data) => {
                setRemaining(data)
                setError(null)
            })
            .catch((e) => setError(e.response?.data?.message ?? 'No se pudo cargar el estado'))
        getDiscrepancies(studentId).then((data) => setDiscrepancias(data))
    }

    useEffect(() => {
        loadData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [studentId])

    return (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <section className="flex flex-col gap-4">
                {discrepancias && <DiscrepanciasAviso data={discrepancias} />}

                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-text-primary">
                        Estado académico
                    </h2>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setUploadMode(uploadMode === 'avance' ? null : 'avance')}
                            className={`rounded-lg border px-4 py-2 text-xs font-semibold transition-colors ${
                                uploadMode === 'avance'
                                    ? 'border-primary bg-primary text-white'
                                    : 'border-primary bg-primary-soft text-primary hover:bg-primary hover:text-white'
                            }`}
                        >
                            Importar avance
                        </button>
                        <button
                            type="button"
                            onClick={() => setUploadMode(uploadMode === 'historial' ? null : 'historial')}
                            className={`rounded-lg border px-4 py-2 text-xs font-semibold transition-colors ${
                                uploadMode === 'historial'
                                    ? 'border-accent bg-accent text-white'
                                    : 'border-accent bg-primary-soft text-accent hover:bg-accent hover:text-white'
                            }`}
                        >
                            Importar historial
                        </button>
                    </div>
                </div>

                {uploadMode === 'avance' && (
                    <AvanceUpload
                        studentId={studentId}
                        onImported={() => {
                            loadData()
                            setUploadMode(null)
                        }}
                    />
                )}

                {uploadMode === 'historial' && (
                    <HistorialUpload
                        studentId={studentId}
                        onImported={() => {
                            loadData()
                            setUploadMode(null)
                        }}
                    />
                )}

                {error ? (
                    <div className="rounded-xl border border-error-soft bg-error-soft p-4">
                        <p className="text-sm font-medium text-error">{error}</p>
                        <p className="mt-2 text-xs text-text-secondary">
                            Si eres un alumno nuevo, importa tu avance curricular o historial de notas para comenzar.
                        </p>
                    </div>
                ) : (
                    <FaltantesList data={remaining} />
                )}
            </section>

            <aside className="h-fit rounded-xl border border-border bg-surface p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-text-primary">
                    Objetivos del horario
                </h2>
                <ObjetivosForm
                    objetivos={objetivos}
                    onChange={onObjetivosChange}
                    onGenerate={onGenerate}
                />
            </aside>
        </div>
    )
}

export default EstadoPage

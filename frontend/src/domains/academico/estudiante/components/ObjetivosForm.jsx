// Formulario de objetivos: tope de créditos, encadenar cursos en curso y los
// pesos de los criterios. El estado vive en el padre (se usa al generar).
function ObjetivosForm({ objetivos, onChange, onGenerate }) {
    const setWeight = (key, value) =>
        onChange({ ...objetivos, weights: { ...objetivos.weights, [key]: Number(value) } })

    return (
        <form
            className="flex flex-col gap-5"
            onSubmit={(e) => {
                e.preventDefault()
                onGenerate()
            }}
        >
            <div className="space-y-4">
                <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-text-primary">
                        Tope de créditos
                    </span>
                    <input
                        type="number"
                        min="1"
                        max="40"
                        value={objetivos.maxCredits}
                        onChange={(e) =>
                            onChange({ ...objetivos, maxCredits: Number(e.target.value) })
                        }
                        className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-text-primary transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                </label>

                <label className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
                    <span className="text-sm font-medium text-text-primary">
                        Encadenar cursos en curso
                    </span>
                    <input
                        type="checkbox"
                        checked={objetivos.chainInProgress}
                        onChange={(e) =>
                            onChange({ ...objetivos, chainInProgress: e.target.checked })
                        }
                        className="h-5 w-5 rounded border-border text-primary focus:ring-primary/20"
                    />
                </label>
            </div>

            <fieldset className="space-y-4">
                <legend className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Pesos de los objetivos
                </legend>
                {[
                    { key: 'courses', label: 'Cantidad de cursos', description: 'Priorizar llevar más materias' },
                    { key: 'priority', label: 'Prioridad de correlativos', description: 'Cursos que abren otros' },
                    { key: 'comfort', label: 'Comodidad de horario', description: 'Menos huecos, mejor distribución' },
                ].map(({ key, label, description }) => (
                    <div key={key} className="rounded-lg border border-border bg-background p-3">
                        <div className="mb-2 flex items-center justify-between">
                            <div>
                                <span className="text-sm font-medium text-text-primary">{label}</span>
                                <p className="text-xs text-text-muted">{description}</p>
                            </div>
                            <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary">
                                {objetivos.weights[key]}
                            </span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="1000"
                            step="10"
                            value={objetivos.weights[key]}
                            onChange={(e) => setWeight(key, e.target.value)}
                            className="w-full accent-primary"
                        />
                    </div>
                ))}
            </fieldset>

            <button
                type="submit"
                className="w-full rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-primary-hover hover:shadow-lg active:scale-[0.98]"
            >
                Generar horarios →
            </button>
        </form>
    )
}

export default ObjetivosForm

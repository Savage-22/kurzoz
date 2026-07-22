// Formulario de objetivos: tope de créditos, encadenar cursos en curso y los
// pesos de los criterios. El estado vive en el padre (se usa al generar).
function ObjetivosForm({ objetivos, onChange, onGenerate }) {
    const setWeight = (key, value) => onChange({ ...objetivos, weights: { ...objetivos.weights, [key]: Number(value) } })

    return (
        <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
                e.preventDefault()
                onGenerate()
            }}
        >
            <label className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Tope de créditos</span>
                <input
                    type="number"
                    min="1"
                    max="40"
                    value={objetivos.maxCredits}
                    onChange={(e) => onChange({ ...objetivos, maxCredits: Number(e.target.value) })}
                    className="w-20 rounded border border-border bg-background px-2 py-1 text-right"
                />
            </label>

            <label className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Encadenar cursos en curso</span>
                <input
                    type="checkbox"
                    checked={objetivos.chainInProgress}
                    onChange={(e) => onChange({ ...objetivos, chainInProgress: e.target.checked })}
                    className="size-4 accent-primary"
                />
            </label>

            <fieldset className="flex flex-col gap-3">
                <legend className="text-xs font-semibold uppercase tracking-wide text-gray-500">Pesos de los objetivos</legend>
                {[
                    { key: 'courses', label: 'Cantidad de cursos' },
                    { key: 'priority', label: 'Prioridad (correlativos / cuellos de botella)' },
                    { key: 'comfort', label: 'Comodidad de horario' },
                ].map(({ key, label }) => (
                    <label key={key} className="text-sm">
                        <div className="flex justify-between text-gray-700">
                            <span>{label}</span>
                            <span className="text-gray-400">{objetivos.weights[key]}</span>
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
                    </label>
                ))}
            </fieldset>

            <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-accent">
                Generar horarios →
            </button>
        </form>
    )
}

export default ObjetivosForm

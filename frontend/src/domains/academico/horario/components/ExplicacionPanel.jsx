// #42 · Panel "¿Por qué este horario?". Pide al asistente una explicación en
// lenguaje claro del plan elegido. La IA solo narra los datos del motor; si no
// está disponible, el backend devuelve una explicación determinista.
function ExplicacionPanel({ state, onExplain }) {
    return (
        <div className="rounded-lg border border-border bg-background p-4">
            <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-800">¿Por qué este horario?</h2>
                <button
                    type="button"
                    onClick={onExplain}
                    disabled={state?.loading}
                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent disabled:opacity-50"
                >
                    {state?.loading ? 'Analizando…' : 'Explicar'}
                </button>
            </div>

            {!state && (
                <p className="text-sm text-gray-400">
                    Genera una explicación de por qué este plan es una buena elección (avance, cursos estratégicos y comodidad).
                </p>
            )}
            {state?.error && <p className="text-sm text-error">{state.error}</p>}
            {state?.data && (
                <div>
                    <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700">{state.data.explanation}</p>
                    <p className="mt-2 text-[11px] text-gray-400">
                        {state.data.aiAvailable
                            ? 'Explicación asistida por IA (DeepSeek) a partir de los datos del motor.'
                            : 'Explicación determinista del motor (IA no disponible en este momento).'}
                    </p>
                </div>
            )}
        </div>
    )
}

export default ExplicacionPanel

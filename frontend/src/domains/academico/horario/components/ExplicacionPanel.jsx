// #42 · Panel "¿Por qué este horario?". Pide al asistente una explicación en
// lenguaje claro del plan elegido. La IA solo narra los datos del motor; si no
// está disponible, el backend devuelve una explicación determinista.
function ExplicacionPanel({ state, onExplain }) {
    return (
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-text-primary">
                    ¿Por qué este horario?
                </h2>
                <button
                    type="button"
                    onClick={onExplain}
                    disabled={state?.loading}
                    className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-primary-hover hover:shadow-md disabled:opacity-50"
                >
                    {state?.loading ? 'Analizando…' : 'Explicar'}
                </button>
            </div>

            {!state && (
                <p className="text-sm text-text-muted">
                    Genera una explicación de por qué este plan es una buena elección (avance,
                    cursos estratégicos y comodidad).
                </p>
            )}
            {state?.error && (
                <div className="rounded-lg border border-error-soft bg-error-soft p-3">
                    <p className="text-sm font-medium text-error">{state.error}</p>
                </div>
            )}
            {state?.data && (
                <div className="rounded-lg border border-border bg-background p-4">
                    <p className="whitespace-pre-line text-sm leading-relaxed text-text-primary">
                        {state.data.explanation}
                    </p>
                    <p className="mt-3 text-[11px] text-text-muted">
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

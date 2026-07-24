import { DAYS, SLOT, courseBg, timeBounds, toHHMM } from '../../shared/horarioUtils.js'

// Grilla semanal (día × hora) que pinta las sesiones de un conjunto de
// secciones. Render inmutable: recibe secciones y el set de cursos en choque.
// Cada sesión se ubica por grid-row según sus minutos.
function GrillaSemanal({ sections, conflictedCodes = new Set() }) {
    if (!sections || sections.length === 0) {
        return (
            <div className="flex items-center justify-center py-8">
                <p className="text-sm text-text-muted">Sin sesiones para mostrar.</p>
            </div>
        )
    }

    const { min, max } = timeBounds(sections)
    const rows = Math.ceil((max - min) / SLOT)
    const rowOf = (m) => Math.round((m - min) / SLOT)

    // Etiquetas de hora cada 2 slots (90 min) para no saturar.
    const hourLabels = []
    for (let r = 0; r <= rows; r += 2) hourLabels.push({ r, label: toHHMM(min + r * SLOT) })

    return (
        <div className="overflow-x-auto">
            <div
                className="grid min-w-[640px] gap-px rounded-xl border border-border bg-border"
                style={{
                    gridTemplateColumns: `60px repeat(${DAYS.length}, 1fr)`,
                    gridTemplateRows: `32px repeat(${rows}, 24px)`,
                }}
            >
                {/* Esquina + cabecera de días */}
                <div
                    className="flex items-center justify-center bg-surface text-xs font-bold uppercase tracking-wider text-text-muted"
                    style={{ gridColumn: 1, gridRow: 1 }}
                >
                    Hora
                </div>
                {DAYS.map((d, i) => (
                    <div
                        key={d.n}
                        className="flex items-center justify-center bg-surface text-xs font-bold uppercase tracking-wider text-text-muted"
                        style={{ gridColumn: i + 2, gridRow: 1 }}
                    >
                        {d.label}
                    </div>
                ))}

                {/* Columna de horas y fondo de celdas */}
                {hourLabels.map(({ r, label }) => (
                    <div
                        key={`h${r}`}
                        className="flex items-start justify-end bg-background pr-2 pt-1 text-[10px] font-medium text-text-muted"
                        style={{ gridColumn: 1, gridRow: `${r + 2} / span 2` }}
                    >
                        {label}
                    </div>
                ))}
                {DAYS.map((d, i) =>
                    Array.from({ length: rows }, (_, r) => (
                        <div
                            key={`c${d.n}-${r}`}
                            className="bg-background"
                            style={{ gridColumn: i + 2, gridRow: r + 2 }}
                        />
                    )),
                )}

                {/* Bloques de clase */}
                {sections.flatMap((section) =>
                    (section.sessions ?? []).map((se, k) => {
                        const dayIndex = DAYS.findIndex((d) => d.n === se.day)
                        if (dayIndex === -1) return null
                        const inConflict = conflictedCodes.has(section.courseCode)
                        return (
                            <div
                                key={`${section.courseCode}-${section.groupLabel}-${k}`}
                                className={`m-px flex flex-col justify-center rounded-lg px-1.5 py-1 text-[10px] leading-tight text-white shadow-sm ${courseBg(section.courseCode)} ${
                                    inConflict
                                        ? 'ring-2 ring-error ring-offset-1 shadow-md'
                                        : ''
                                }`}
                                style={{
                                    gridColumn: dayIndex + 2,
                                    gridRow: `${rowOf(se.startMin) + 2} / ${rowOf(se.endMin) + 2}`,
                                }}
                                title={`${section.courseCode} · ${toHHMM(se.startMin)}-${toHHMM(se.endMin)}${se.room ? ` · ${se.room}` : ''}`}
                            >
                                <span className="font-bold">{section.courseCode}</span>
                                <span className="opacity-90">{toHHMM(se.startMin)}</span>
                            </div>
                        )
                    }),
                )}
            </div>
        </div>
    )
}

export default GrillaSemanal

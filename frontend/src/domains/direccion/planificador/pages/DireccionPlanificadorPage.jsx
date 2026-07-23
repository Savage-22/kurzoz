import { useRef, useState } from 'react'
import { getProposal } from '../services/planificadorService.js'
import ReporteMetricas from '../components/ReporteMetricas.jsx'
import DiffList from '../components/DiffList.jsx'
import GrillaSemanal from '../../../academico/horario/components/GrillaSemanal.jsx'

function DireccionPlanificadorPage() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [exporting, setExporting] = useState(false)
  const gridRef = useRef(null)

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getProposal()
      setResult(data)
    } catch (e) {
      setError(e.response?.data?.message ?? 'No se pudo generar la propuesta')
    } finally {
      setLoading(false)
    }
  }

  const exportarPdf = async () => {
    if (!gridRef.current) return
    setExporting(true)
    try {
      const { exportarPdf } = await import('../../../academico/horario/services/exportHorario.js')
      await exportarPdf(gridRef.current, { filename: 'propuesta-institucional.pdf', titulo: 'Kurzoz · Propuesta institucional' })
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-800">Planificador institucional</h2>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="rounded-lg bg-accent px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary disabled:opacity-50"
        >
          {loading ? 'Generando…' : 'Generar propuesta'}
        </button>
      </div>

      {error && (
        <p className="rounded bg-error/10 px-3 py-2 text-sm text-error">{error}</p>
      )}

      {result && (
        <>
          <div className="rounded-lg border border-border bg-background p-3 text-center text-xs text-gray-500">
            {result.report.note}
          </div>

          <ReporteMetricas report={result.report} />

          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-700">Bloques movidos ({result.diff.length})</h3>
            <DiffList diff={result.diff} />
          </div>

          <div className="rounded-lg border border-border bg-background p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Propuesta de horario</h3>
              <button
                type="button"
                onClick={exportarPdf}
                disabled={exporting}
                className="rounded border border-primary px-2 py-1 text-xs font-medium text-primary hover:bg-primary hover:text-white disabled:opacity-50"
              >
                {exporting ? 'Exportando…' : 'Exportar PDF'}
              </button>
            </div>
            <div ref={gridRef} className="bg-background">
              <p className="mb-2 text-[11px] text-gray-500">Kurzoz · Propuesta institucional</p>
              <GrillaSemanal sections={result.proposal} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default DireccionPlanificadorPage

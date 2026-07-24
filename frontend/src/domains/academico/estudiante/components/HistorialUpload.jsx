import { useState, useRef } from 'react'
import { uploadHistorial } from '../api/estudianteApi.js'

// Componente para subir el PDF de historial de notas desde el navegador.
function HistorialUpload({ studentId, onImported }) {
    const [file, setFile] = useState(null)
    const [uploading, setUploading] = useState(false)
    const [result, setResult] = useState(null)
    const [error, setError] = useState(null)
    const [dragOver, setDragOver] = useState(false)
    const fileInputRef = useRef(null)

    const handleFile = (f) => {
        if (f && f.type === 'application/pdf') {
            setFile(f)
            setResult(null)
            setError(null)
        }
    }

    const handleDrop = (e) => {
        e.preventDefault()
        setDragOver(false)
        const f = e.dataTransfer.files[0]
        handleFile(f)
    }

    const handleUpload = async () => {
        if (!file) return
        setUploading(true)
        setError(null)
        try {
            const response = await uploadHistorial(studentId, file)
            setResult(response.data.data)
            if (onImported) onImported()
        } catch (e) {
            setError(e.response?.data?.message ?? 'Error al importar el historial')
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <h3 className="mb-3 text-lg font-semibold text-text-primary">
                Importar Historial de Notas
            </h3>
            <p className="mb-4 text-sm text-text-secondary">
                Sube tu PDF de historial de notas desde el intranet de UNHEVAL para
                cargar tu desglose semestre a semestre.
            </p>

            <div
                className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
                    dragOver
                        ? 'border-primary bg-primary-soft'
                        : 'border-border hover:border-border-hover'
                }`}
                onDragOver={(e) => {
                    e.preventDefault()
                    setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files[0])}
                />
                <svg
                    className="mb-2 h-8 w-8 text-text-muted"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                </svg>
                <p className="text-sm text-text-secondary">
                    {file ? (
                        <span className="font-medium text-primary">{file.name}</span>
                    ) : (
                        <>
                            Arrastra tu PDF aquí o{' '}
                            <span className="font-medium text-primary">selecciona un archivo</span>
                        </>
                    )}
                </p>
                <p className="mt-1 text-xs text-text-muted">Solo archivos PDF (máx. 10MB)</p>
            </div>

            {file && !result && (
                <button
                    type="button"
                    onClick={handleUpload}
                    disabled={uploading}
                    className="mt-4 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-accent-hover hover:shadow-md disabled:opacity-50"
                >
                    {uploading ? 'Importando…' : 'Importar historial'}
                </button>
            )}

            {error && (
                <div className="mt-4 rounded-lg border border-error-soft bg-error-soft p-3">
                    <p className="text-sm font-medium text-error">{error}</p>
                </div>
            )}

            {result && (
                <div className="mt-4 rounded-lg border border-success-soft bg-success-soft p-4">
                    <p className="text-sm font-semibold text-success">
                        ✓ Historial importado correctamente
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-text-secondary">
                        <div>
                            <span className="font-medium">Alumno:</span> {result.student.name} (
                            {result.student.id})
                        </div>
                        <div>
                            <span className="font-medium">Total cursos:</span> {result.total}
                        </div>
                        <div>
                            <span className="font-medium">Créditos:</span> {result.totalCredits}
                        </div>
                        <div>
                            <span className="font-medium">Promedio:</span> {result.avgGrade}
                        </div>
                        <div className="col-span-2">
                            <span className="font-medium">Semestres:</span> {result.semesters.join(', ')}
                        </div>
                    </div>
                    {result.warnings?.length > 0 && (
                        <div className="mt-3">
                            <p className="text-xs font-medium text-warning">Advertencias:</p>
                            <ul className="mt-1 list-disc pl-4 text-xs text-text-secondary">
                                {result.warnings.map((w, i) => (
                                    <li key={i}>{w}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {result.skipped?.length > 0 && (
                        <div className="mt-2">
                            <p className="text-xs font-medium text-text-muted">Omitidos:</p>
                            <ul className="mt-1 list-disc pl-4 text-xs text-text-muted">
                                {result.skipped.map((s, i) => (
                                    <li key={i}>{s}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={() => {
                            setFile(null)
                            setResult(null)
                        }}
                        className="mt-3 text-xs font-medium text-primary hover:underline"
                    >
                        Importar otro archivo
                    </button>
                </div>
            )}
        </div>
    )
}

export default HistorialUpload

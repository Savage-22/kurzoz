import { useState, useRef } from 'react'
import { uploadAvance } from '../api/estudianteApi.js'

// Componente para subir el PDF de avance curricular desde el navegador.
function AvanceUpload({ studentId, onImported }) {
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
            const response = await uploadAvance(studentId, file)
            setResult(response.data.data)
            if (onImported) onImported()
        } catch (e) {
            setError(e.response?.data?.message ?? 'Error al importar el avance')
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <h3 className="mb-3 text-lg font-semibold text-text-primary">
                Importar Avance Curricular
            </h3>
            <p className="mb-4 text-sm text-text-secondary">
                Sube tu PDF de avance curricular desde el intranet de UNHEVAL para
                cargar tu estado académico.
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
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
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
                    className="mt-4 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-hover hover:shadow-md disabled:opacity-50"
                >
                    {uploading ? 'Importando…' : 'Importar avance'}
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
                        ✓ Importación exitosa
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-text-secondary">
                        <div>
                            <span className="font-medium">Alumno:</span> {result.student.name} (
                            {result.student.id})
                        </div>
                        <div>
                            <span className="font-medium">Total:</span> {result.total} cursos
                        </div>
                        <div>
                            <span className="font-medium">Aprobados:</span> {result.approved}
                        </div>
                        <div>
                            <span className="font-medium">En curso:</span> {result.inProgress}
                        </div>
                        <div>
                            <span className="font-medium">Pendientes:</span> {result.pending}
                        </div>
                        <div>
                            <span className="font-medium">Créditos aprobados:</span>{' '}
                            {result.computedApprovedCredits}
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

export default AvanceUpload

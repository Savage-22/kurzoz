import { useState } from 'react'
import { login, register } from '../api/authApi.js'
import { setToken } from '../../../infrastructure/session.js'

export default function LoginPage({ onAuth }) {
    const [mode, setMode] = useState('login')
    const [studentId, setStudentId] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const fn = mode === 'login' ? login : register
            const { data } = await fn(studentId, password)
            if (data.success) {
                setToken(data.data.token)
                onAuth(data.data.user)
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Error al conectar con el servidor')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-svh items-center justify-center bg-background px-4">
            <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8 shadow-lg">
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-bold tracking-tight text-primary">Kurzoz</h1>
                    <p className="mt-1 text-sm text-text-secondary">
                        Planificador de horarios · UNHEVAL
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-text-primary">
                            Código de estudiante
                        </label>
                        <input
                            type="text"
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value)}
                            placeholder="Ej: 2023110208"
                            required
                            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm transition-colors placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-text-primary">
                            Contraseña
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm transition-colors placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>

                    {error && (
                        <div className="rounded-lg bg-error-soft px-3 py-2 text-sm text-error">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-primary-hover disabled:opacity-50"
                    >
                        {loading ? 'Procesando...' : mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
                    </button>
                </form>

                <p className="mt-4 text-center text-xs text-text-muted">
                    {mode === 'login' ? (
                        <>
                            ¿No tienes cuenta?{' '}
                            <button
                                type="button"
                                onClick={() => { setMode('register'); setError('') }}
                                className="font-medium text-primary hover:underline"
                            >
                                Regístrate
                            </button>
                        </>
                    ) : (
                        <>
                            ¿Ya tienes cuenta?{' '}
                            <button
                                type="button"
                                onClick={() => { setMode('login'); setError('') }}
                                className="font-medium text-primary hover:underline"
                            >
                                Inicia sesión
                            </button>
                        </>
                    )}
                </p>
            </div>
        </div>
    )
}

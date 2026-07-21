import { useEffect, useState } from 'react'
import { getBackendStatus } from './domains/system/health/services/healthService.js'

function App() {
  const [status, setStatus] = useState({ loading: true })

  useEffect(() => {
    let isMounted = true
    getBackendStatus().then((result) => {
      if (isMounted) setStatus({ loading: false, ...result })
    })
    return () => {
      isMounted = false
    }
  }, [])

  return (
    <main className="mx-auto flex min-h-svh max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center">
      <div>
        <h1 className="text-5xl font-semibold tracking-tight text-primary">Kurzoz</h1>
        <p className="mt-3 text-gray-500">
          Planificador de cursos y horarios · Ingeniería de Sistemas UNHEVAL
        </p>
      </div>

      <BackendStatus status={status} />
    </main>
  )
}

function BackendStatus({ status }) {
  if (status.loading) {
    return <p className="text-gray-400">Comprobando backend…</p>
  }

  const isOnline = status.online && status.database === 'up'
  const label = isOnline ? 'Backend y base de datos operativos' : 'Backend sin base de datos'

  return (
    <div className="rounded-lg border border-border bg-surface px-5 py-3">
      <span
        className={`inline-flex items-center gap-2 text-sm font-medium ${
          isOnline ? 'text-success' : 'text-error'
        }`}
      >
        <span
          className={`size-2 rounded-full ${isOnline ? 'bg-success' : 'bg-error'}`}
          aria-hidden="true"
        />
        {label}
      </span>
    </div>
  )
}

export default App

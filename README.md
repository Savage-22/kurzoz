# Kurzoz

Planificador de cursos y horarios para la carrera de Ingeniería de Sistemas (UNHEVAL), pensado
para la malla 2026: calcula qué cursos faltan, detecta choques de horario, genera el horario
ideal y recomienda ajustes (mover un bloque o abrir un grupo nuevo) para poder llevar más cursos
y no atrasarse un ciclo.

## Stack

- **Backend:** Node/Express por capas (Model / Service / Controller), PostgreSQL.
- **Frontend:** React (Vite), screaming-architecture por dominios, Tailwind.
- Monorepo con **npm workspaces**.

## Estructura

```
kurzoz/
├── backend/        # API Express (src/modules, src/shared)
└── frontend/       # React (src/domains, src/infrastructure, src/shared)
```

## Puesta en marcha

Requisitos: Node 20+, PostgreSQL.

```bash
# 1. Instalar dependencias (raíz del monorepo)
npm install

# 2. Configurar entorno
cp backend/.env.example backend/.env      # ajusta credenciales de Postgres
cp frontend/.env.example frontend/.env

# 3. Crear la base de datos
createdb kurzoz

# 4. Levantar backend + frontend
npm run dev
```

- Backend: http://localhost:4000 · healthcheck en `GET /health`.
- Frontend: http://localhost:5173

## Scripts (raíz)

| Script | Acción |
|--------|--------|
| `npm run dev` | Levanta backend y frontend en paralelo |
| `npm run build` | Build de producción del frontend |
| `npm run lint` | Lint de ambos paquetes |

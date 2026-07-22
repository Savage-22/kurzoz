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

# 4. Migrar el esquema y cargar datos (malla, prerrequisitos, equivalencias, términos)
npm run migrate --workspace backend
npm run seed --workspace backend

# 5. Levantar backend + frontend
npm run dev
```

- Backend: http://localhost:4000 · healthcheck en `GET /health`.
- Frontend: http://localhost:5173

> La malla 2026 y el horario oficial 2026-II vienen **versionados como seed**
> (`backend/migrations/seeds/`), así que `npm run seed` deja los 65 cursos y la oferta en la
> base **sin necesitar ningún archivo fuente**. El Excel de convalidaciones y el PDF de la
> Resolución solo los usa quien los tenga para regenerar los seeds (`npm run malla:seed`,
> `npm run oferta:seed`). El avance curricular es dato personal: cada alumno carga el suyo
> con `npm run import:avance -- <pdf>`.

## Scripts (raíz)

| Script | Acción |
|--------|--------|
| `npm run dev` | Levanta backend y frontend en paralelo |
| `npm run build` | Build de producción del frontend |
| `npm run lint` | Lint de ambos paquetes |

-- Migración 001 · Esquema base del dominio académico
-- Convenciones: snake_case, is_active para soft delete, horas como
-- minutos-desde-medianoche para comparar rangos sin ambigüedad de zona horaria.

-- Cursos de la malla. cycle_number es el ciclo sugerido (1..10); la paridad
-- se deriva sola para no quedar inconsistente con el número de ciclo.
CREATE TABLE course (
    code          TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    credits       INTEGER NOT NULL CHECK (credits >= 0),
    type          TEXT NOT NULL CHECK (type IN ('OBL', 'ELEC')),
    cycle_number  INTEGER CHECK (cycle_number BETWEEN 1 AND 12),
    cycle_parity  TEXT GENERATED ALWAYS AS (
        CASE
            WHEN cycle_number IS NULL THEN NULL
            WHEN cycle_number % 2 = 0 THEN 'PAR'
            ELSE 'IMPAR'
        END
    ) STORED,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE
);

-- Prerrequisitos. kind = 'Y' → obligatorio (se suman todos los 'Y').
-- kind = 'O' → alternativa; las filas con el mismo (course_code, or_group)
-- se satisfacen aprobando CUALQUIERA. Así se modela "A y (B o C)".
CREATE TABLE prerequisite (
    id             SERIAL PRIMARY KEY,
    course_code    TEXT NOT NULL REFERENCES course(code) ON DELETE CASCADE,
    requires_code  TEXT NOT NULL REFERENCES course(code) ON DELETE CASCADE,
    kind           TEXT NOT NULL CHECK (kind IN ('Y', 'O')),
    or_group       SMALLINT,
    CHECK (course_code <> requires_code),
    CHECK ((kind = 'O') = (or_group IS NOT NULL)),
    UNIQUE (course_code, requires_code)
);

-- Equivalencias malla vieja ↔ nueva. old_code puede no existir en course
-- (pertenece a la malla anterior), por eso no lleva FK.
CREATE TABLE equivalence (
    id        SERIAL PRIMARY KEY,
    old_code  TEXT NOT NULL,
    new_code  TEXT NOT NULL REFERENCES course(code) ON DELETE CASCADE,
    note      TEXT,
    UNIQUE (old_code, new_code)
);

-- Estudiantes.
CREATE TABLE student (
    id         TEXT PRIMARY KEY,
    name       TEXT,
    is_active  BOOLEAN NOT NULL DEFAULT TRUE
);

-- Avance del estudiante por curso (fuente: avance curricular).
CREATE TABLE student_course (
    id           SERIAL PRIMARY KEY,
    student_id   TEXT NOT NULL REFERENCES student(id) ON DELETE CASCADE,
    course_code  TEXT NOT NULL REFERENCES course(code) ON DELETE CASCADE,
    status       TEXT NOT NULL CHECK (status IN ('APROBADO', 'EN_CURSO', 'PENDIENTE')),
    grade        NUMERIC(4, 2) CHECK (grade >= 0 AND grade <= 20),
    modality     TEXT CHECK (modality IN ('REGULAR', 'VACACIONAL', 'CONVALIDADO')),
    UNIQUE (student_id, course_code)
);

-- Términos académicos (ciclos calendario). parity define qué ciclos ofrece:
-- 2026-II solo dicta ciclos PARES.
CREATE TABLE term (
    id         SERIAL PRIMARY KEY,
    code       TEXT NOT NULL UNIQUE,
    parity     TEXT CHECK (parity IN ('PAR', 'IMPAR')),
    is_active  BOOLEAN NOT NULL DEFAULT TRUE
);

-- Oferta de un curso en un término (con su docente y horas teoría/práctica).
CREATE TABLE offering (
    id           SERIAL PRIMARY KEY,
    term_id      INTEGER NOT NULL REFERENCES term(id) ON DELETE CASCADE,
    course_code  TEXT NOT NULL REFERENCES course(code) ON DELETE CASCADE,
    teacher      TEXT NOT NULL DEFAULT '',
    ht           INTEGER CHECK (ht >= 0),
    hp           INTEGER CHECK (hp >= 0),
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (term_id, course_code, teacher)
);

-- Grupos/secciones de una oferta.
CREATE TABLE section (
    id           SERIAL PRIMARY KEY,
    offering_id  INTEGER NOT NULL REFERENCES offering(id) ON DELETE CASCADE,
    group_label  TEXT NOT NULL,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (offering_id, group_label)
);

-- Bloques horarios de una sección. Varias filas por sección permiten separar
-- teoría y práctica, o días distintos, sin ambigüedad.
CREATE TABLE session (
    id          SERIAL PRIMARY KEY,
    section_id  INTEGER NOT NULL REFERENCES section(id) ON DELETE CASCADE,
    day         SMALLINT NOT NULL CHECK (day BETWEEN 1 AND 7),
    start_min   INTEGER NOT NULL CHECK (start_min >= 0 AND start_min < 1440),
    end_min     INTEGER NOT NULL CHECK (end_min > start_min AND end_min <= 1440),
    kind        TEXT CHECK (kind IN ('TEORIA', 'PRACTICA')),
    pavilion    TEXT,
    room        TEXT
);

-- Índices para las consultas frecuentes del motor.
CREATE INDEX idx_prerequisite_course ON prerequisite (course_code);
CREATE INDEX idx_student_course_student ON student_course (student_id);
CREATE INDEX idx_offering_term ON offering (term_id);
CREATE INDEX idx_offering_course ON offering (course_code);
CREATE INDEX idx_section_offering ON section (offering_id);
CREATE INDEX idx_session_section ON session (section_id);
CREATE INDEX idx_session_day ON session (day);

-- Migración 003 · Historial de notas del estudiante
-- Almacena el desglose semestre a semestre de cada curso cursado, con nota,
-- fecha, modalidad, docente y grupo. Más granular que student_course.

CREATE TABLE student_enrollment (
    id            SERIAL PRIMARY KEY,
    student_id    TEXT NOT NULL REFERENCES student(id) ON DELETE CASCADE,
    course_code   TEXT NOT NULL REFERENCES course(code) ON DELETE CASCADE,
    semester      TEXT NOT NULL,             -- e.g. '2023-I', '2024-II'
    grade         NUMERIC(4, 2) CHECK (grade >= 0 AND grade <= 20),
    grade_text    TEXT,                      -- '11 ONCE', '13 TRECE', etc.
    date          TEXT,                      -- '31/07/2023'
    modality      TEXT,                      -- 'REGULAR', 'CONVALIDACION', 'DIRIGIDO-MOVILIDAD', 'CURSO DE VERANO', 'CONVALIDACION POR PASANTIA'
    professor     TEXT,
    group_label   TEXT,                      -- '01', '02', etc.
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, course_code, semester)
);

CREATE INDEX idx_enrollment_student ON student_enrollment (student_id);
CREATE INDEX idx_enrollment_course ON student_enrollment (course_code);
CREATE INDEX idx_enrollment_semester ON student_enrollment (semester);

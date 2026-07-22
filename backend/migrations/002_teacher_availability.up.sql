-- Ventanas de disponibilidad horaria por docente. Restricción dura del
-- planificador institucional: un bloque no puede caer fuera de la ventana de su
-- docente. El docente se identifica por su nombre tal como aparece en
-- offering.teacher. Tiempos en minutos desde medianoche, igual que session.
CREATE TABLE teacher_availability (
    id          SERIAL PRIMARY KEY,
    teacher     TEXT NOT NULL,
    day         SMALLINT NOT NULL CHECK (day BETWEEN 1 AND 7),
    start_min   INTEGER NOT NULL CHECK (start_min >= 0 AND start_min < 1440),
    end_min     INTEGER NOT NULL CHECK (end_min > start_min AND end_min <= 1440),
    is_active   BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_teacher_availability_teacher ON teacher_availability (teacher);

-- Migración 005 · Ampliar CHECK de modality en student_course
-- El CHECK original solo aceptaba 'REGULAR', 'VACACIONAL', 'CONVALIDADO'.
-- El historial de notas puede traer 'CONVALIDACION', 'CURSO DE VERANO',
-- 'DIRIGIDO-MOVILIDAD', 'CONVALIDACION POR PASANTIA', etc.

ALTER TABLE student_course DROP CONSTRAINT IF EXISTS student_course_modality_check;

ALTER TABLE student_course
    ADD CONSTRAINT student_course_modality_check
    CHECK (modality IN (
        'REGULAR',
        'VACACIONAL',
        'CONVALIDADO',
        'CONVALIDACION',
        'CURSO DE VERANO',
        'DIRIGIDO-MOVILIDAD',
        'CONVALIDACION POR PASANTIA'
    ));

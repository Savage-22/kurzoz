ALTER TABLE student_course DROP CONSTRAINT IF EXISTS student_course_modality_check;

ALTER TABLE student_course
    ADD CONSTRAINT student_course_modality_check
    CHECK (modality IN ('REGULAR', 'VACACIONAL', 'CONVALIDADO'));

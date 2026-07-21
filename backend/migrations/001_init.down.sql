-- Reversa de la migración 001. Orden inverso por dependencias de FK.
DROP TABLE IF EXISTS session;
DROP TABLE IF EXISTS section;
DROP TABLE IF EXISTS offering;
DROP TABLE IF EXISTS term;
DROP TABLE IF EXISTS student_course;
DROP TABLE IF EXISTS student;
DROP TABLE IF EXISTS equivalence;
DROP TABLE IF EXISTS prerequisite;
DROP TABLE IF EXISTS course;

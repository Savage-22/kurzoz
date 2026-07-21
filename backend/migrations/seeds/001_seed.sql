-- Seeds mínimos de prueba. Idempotentes (ON CONFLICT DO NOTHING).
-- No son la carga real de la malla; sirven para probar el esquema y consultas.

-- Cursos (subconjunto representativo con obligatorios y una electiva).
INSERT INTO course (code, name, credits, type, cycle_number) VALUES
    ('3102', 'Estructura de Datos',            4, 'OBL', 3),
    ('3103', 'Bases de Datos I',               4, 'OBL', 3),
    ('3104', 'Programación Orientada a Objetos',4, 'OBL', 3),
    ('4102', 'Bases de Datos II',              4, 'OBL', 4),
    ('4103', 'Sistemas Operativos',            4, 'OBL', 4),
    ('5102', 'Ingeniería de Software I',       4, 'OBL', 5),
    ('6102', 'Ingeniería de Software II',      4, 'OBL', 6),
    ('6199', 'Electivo de Especialidad',       3, 'ELEC', 6)
ON CONFLICT (code) DO NOTHING;

-- Prerrequisitos: modela "Y" (obligatorio) y "O" (alternativas por or_group).
INSERT INTO prerequisite (course_code, requires_code, kind, or_group) VALUES
    ('4102', '3103', 'Y', NULL),   -- BD II requiere BD I
    ('4103', '3102', 'Y', NULL),   -- SO requiere Estructura de Datos
    ('6102', '5102', 'Y', NULL),   -- IS II requiere IS I
    ('6199', '4102', 'O', 1),      -- electivo: BD II o SO habilitan
    ('6199', '4103', 'O', 1)
ON CONFLICT (course_code, requires_code) DO NOTHING;

-- Equivalencia malla vieja ↔ nueva.
INSERT INTO equivalence (old_code, new_code, note) VALUES
    ('205', '3103', 'Base de Datos (malla anterior) equivale a Bases de Datos I')
ON CONFLICT (old_code, new_code) DO NOTHING;

-- Estudiante real de referencia.
INSERT INTO student (id, name) VALUES
    ('2023110208', 'Jeik Pasquel')
ON CONFLICT (id) DO NOTHING;

-- Avance: aprobados del ciclo 3, en curso (2026-I) y pendientes.
INSERT INTO student_course (student_id, course_code, status, grade, modality) VALUES
    ('2023110208', '3102', 'APROBADO', 15, 'REGULAR'),
    ('2023110208', '3103', 'APROBADO', 14, 'REGULAR'),
    ('2023110208', '3104', 'EN_CURSO', NULL, 'REGULAR'),
    ('2023110208', '4102', 'PENDIENTE', NULL, NULL),
    ('2023110208', '6199', 'PENDIENTE', NULL, NULL)
ON CONFLICT (student_id, course_code) DO NOTHING;

-- Término 2026-II: solo dicta ciclos pares.
INSERT INTO term (code, parity) VALUES
    ('2026-II', 'PAR')
ON CONFLICT (code) DO NOTHING;

-- Oferta + sección + bloques horarios (minutos desde medianoche).
-- 4102 lunes 07:00-09:00 (teoría) y miércoles 09:00-11:00 (práctica).
INSERT INTO offering (term_id, course_code, teacher, ht, hp)
SELECT id, '4102', 'García, Luis', 2, 2 FROM term WHERE code = '2026-II'
ON CONFLICT (term_id, course_code, teacher) DO NOTHING;

INSERT INTO section (offering_id, group_label)
SELECT o.id, 'A'
FROM offering o
JOIN term t ON t.id = o.term_id
WHERE t.code = '2026-II' AND o.course_code = '4102' AND o.teacher = 'García, Luis'
ON CONFLICT (offering_id, group_label) DO NOTHING;

INSERT INTO session (section_id, day, start_min, end_min, kind, pavilion, room)
SELECT sec.id, v.day, v.start_min, v.end_min, v.kind, v.pavilion, v.room
FROM section sec
JOIN offering o ON o.id = sec.offering_id
JOIN term t ON t.id = o.term_id
CROSS JOIN (VALUES
    (1, 420, 540, 'TEORIA',   'A', '101'),
    (3, 540, 660, 'PRACTICA', 'A', 'Lab 2')
) AS v(day, start_min, end_min, kind, pavilion, room)
WHERE t.code = '2026-II' AND o.course_code = '4102' AND sec.group_label = 'A'
  AND NOT EXISTS (SELECT 1 FROM session ex WHERE ex.section_id = sec.id);

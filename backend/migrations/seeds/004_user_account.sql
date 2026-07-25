-- Seed: crear cuenta de usuario de prueba (estudiante 2023110208, contraseña 2023110208).
-- Idempotent: ON CONFLICT DO NOTHING.

INSERT INTO student (id, name)
VALUES ('2023110208', 'Estudiante de Prueba')
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_account (student_id, password_hash, role)
VALUES ('2023110208', '$2b$10$aj2YToz1ubCdg.wMFtke3u6Dv13uZISKg/0EXy2ZK3AJDmJ3lVPPu', 'STUDENT')
ON CONFLICT (student_id) DO NOTHING;

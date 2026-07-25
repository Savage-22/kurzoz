-- Migración 004 · Tabla de cuentas de usuario para autenticación
CREATE TABLE user_account (
    id            SERIAL PRIMARY KEY,
    student_id    TEXT NOT NULL REFERENCES student(id) ON DELETE CASCADE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL CHECK (role IN ('STUDENT', 'ADMIN')),
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (student_id)
);

CREATE INDEX idx_user_account_student ON user_account (student_id);
CREATE INDEX idx_user_account_role ON user_account (role);

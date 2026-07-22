-- Seed 001 · Términos académicos (dato global, no personal).
-- 2026-I dicta ciclos impares; 2026-II dicta ciclos pares (restricción dura
-- de paridad). Los seeds posteriores (oferta) referencian estos términos.
INSERT INTO term (code, parity) VALUES
    ('2026-I',  'IMPAR'),
    ('2026-II', 'PAR')
ON CONFLICT (code) DO NOTHING;

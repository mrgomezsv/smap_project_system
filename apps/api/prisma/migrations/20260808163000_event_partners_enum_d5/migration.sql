-- D5: Convertir Event.partners String → enum con CHECK constraint
-- Validación pre: 0 filas en t_app_event, sin datos que afecten.
-- Aplicamos CHECK constraint para forzar valores del set permitido.

ALTER TABLE t_app_event
  ADD CONSTRAINT chk_event_partners_enum
  CHECK (partners IN ('partner1', 'partner2', 'partner3'));

-- Índice para queries por partner (ya estaba en Fase A)
-- idx_event_partners ya existe en la BD.
-- Eliminar constraint chk_event_partners_enum para permitir organizadores dinámicos
ALTER TABLE t_app_event DROP CONSTRAINT IF EXISTS chk_event_partners_enum;

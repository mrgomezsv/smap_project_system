-- D2 (VERSIÓN SEGURA): Agregar user_id_int INT NULL FK a User, sin tocar user_id VARCHAR.
-- Razón: los userId VARCHAR existentes NO se mapean a auth_user.id (Firebase UIDs arbitrarios).
--   Cambiar el tipo directamente causaría pérdida de datos. En su lugar, agregamos una
--   columna nueva para los nuevos inserts con FK, y mantenemos la vieja VARCHAR intacta.

-- Paso 1: Agregar columna user_id_int NULL a las 3 tablas
ALTER TABLE t_app_product_comment
  ADD COLUMN user_id_int INT NULL AFTER user_id;
ALTER TABLE t_app_product_comment_reply
  ADD COLUMN user_id_int INT NULL AFTER user_id;
ALTER TABLE waiver_v2_waiverqr
  ADD COLUMN user_id_int INT NULL AFTER user_id;

-- Paso 2: Intentar backfill desde t_app_firebase_user (mapeo Firebase UID → User.id)
-- Solo aplica a filas con user_id VARCHAR que tengan mapeo. Las demás quedan NULL.
UPDATE t_app_product_comment c
JOIN t_app_firebase_user f ON f.firebase_uid = c.user_id
SET c.user_id_int = f.user_id;

UPDATE t_app_product_comment_reply c
JOIN t_app_firebase_user f ON f.firebase_uid = c.user_id
SET c.user_id_int = f.user_id;

UPDATE waiver_v2_waiverqr c
JOIN t_app_firebase_user f ON f.firebase_uid = c.user_id
SET c.user_id_int = f.user_id;

-- Paso 3: Índices sobre la nueva columna
CREATE INDEX idx_comment_user_id_int ON t_app_product_comment(user_id_int);
CREATE INDEX idx_reply_user_id_int ON t_app_product_comment_reply(user_id_int);
CREATE INDEX idx_waiver_user_id_int ON waiver_v2_waiverqr(user_id_int);

-- NOTA: NO se agregan FK constraints aún. Solo cuando se decida
-- qué hacer con las filas huérfanas. Las filas nuevas deberían
-- poblar tanto user_id (Firebase UID) como user_id_int (FK).

-- Rollback (manual, si se necesita):
-- ALTER TABLE t_app_product_comment DROP COLUMN user_id_int;
-- ALTER TABLE t_app_product_comment_reply DROP COLUMN user_id_int;
-- ALTER TABLE waiver_v2_waiverqr DROP COLUMN user_id_int;
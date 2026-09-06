-- F1: FULLTEXT indexes para acelerar búsquedas admin con LIKE '%X%'
-- Impacto: queries de búsqueda admin pasan de sequential scan a FULLTEXT MATCH AGAINST
-- Tablas pequeñas (51 productos, 86 contacts, etc.) → lock breve aceptable.
-- Nota: en MariaDB 10.6 InnoDB, FULLTEXT ADD requiere LOCK=SHARED como mínimo.
--       Con 51 filas en products, el lock dura <100ms.
-- Usamos IF NOT EXISTS para idempotencia (soportado por MariaDB 10.6).
-- Las columnas usan snake_case en BD (mapping de Prisma).

-- Products: admin busca por title
ALTER TABLE t_app_product_product
  ADD FULLTEXT INDEX IF NOT EXISTS ft_product_title (title);

-- Products: búsqueda por title + description
ALTER TABLE t_app_product_product
  ADD FULLTEXT INDEX IF NOT EXISTS ft_product_title_desc (title, description);

-- Contracts: admin busca por client_name + client_email + equipment
ALTER TABLE t_app_rental_contract
  ADD FULLTEXT INDEX IF NOT EXISTS ft_contract_search (client_name, client_email, equipment);

-- Events: admin busca por title + description
ALTER TABLE t_app_event
  ADD FULLTEXT INDEX IF NOT EXISTS ft_event_search (title, description);

-- Waivers QR: admin busca por user_name + user_email
ALTER TABLE waiver_v2_waiverqr
  ADD FULLTEXT INDEX IF NOT EXISTS ft_waiver_search (user_name, user_email);

-- Comments: admin modera buscando por texto
ALTER TABLE t_app_product_comment
  ADD FULLTEXT INDEX IF NOT EXISTS ft_comment_text (comment);

-- Comment replies: búsqueda admin (columna real es `reply_LONGTEXT` por bug legacy)
ALTER TABLE t_app_product_comment_reply
  ADD FULLTEXT INDEX IF NOT EXISTS ft_reply_text (`reply_LONGTEXT`);

-- Contact messages: admin busca por nombre/email/motivo
ALTER TABLE t_app_contact_message
  ADD FULLTEXT INDEX IF NOT EXISTS ft_contact_search (first_name, last_name, email, reason);

-- Rollback:
-- ALTER TABLE t_app_product_product DROP INDEX ft_product_title;
-- ALTER TABLE t_app_product_product DROP INDEX ft_product_title_desc;
-- ALTER TABLE t_app_rental_contract DROP INDEX ft_contract_search;
-- ALTER TABLE t_app_event DROP INDEX ft_event_search;
-- ALTER TABLE waiver_v2_waiverqr DROP INDEX ft_waiver_search;
-- ALTER TABLE t_app_product_comment DROP INDEX ft_comment_text;
-- ALTER TABLE t_app_product_comment_reply DROP INDEX ft_reply_text;
-- (Nota: la columna real es `reply_LONGTEXT` por bug legacy del schema Django)
-- ALTER TABLE t_app_contact_message DROP INDEX ft_contact_search;



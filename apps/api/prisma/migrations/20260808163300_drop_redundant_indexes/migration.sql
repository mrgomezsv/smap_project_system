-- F (Fase Final): Eliminar índices redundantes identificados en revisión
-- Cada DROP INDEX es N0: no afecta datos, solo reduce overhead en writes
-- y ahorra espacio en disco.

-- === ChatMessage ===
-- t_app_chat_message_chat_room_id_abf01d69: single col, cubierto por idx_msg_room_time
-- t_app_chat_message_chat_room_id_fk: single col, cubierto por idx_msg_room_time
-- t_app_chat_message_sender_id_5bb648c5: single col, cubierto por idx_msg_sender_time
-- t_app_chat_message_sender_id_fk: single col, cubierto por idx_msg_sender_time
ALTER TABLE t_app_chat_message DROP INDEX t_app_chat_message_chat_room_id_abf01d69;
ALTER TABLE t_app_chat_message DROP INDEX t_app_chat_message_chat_room_id_fk;
ALTER TABLE t_app_chat_message DROP INDEX t_app_chat_message_sender_id_5bb648c5;
ALTER TABLE t_app_chat_message DROP INDEX t_app_chat_message_sender_id_fk;

-- === WaiverQRV2 ===
-- waiver_v2_waiverqr_qr_code_fce02e73_like: redundante con UNIQUE qr_code_key
ALTER TABLE waiver_v2_waiverqr DROP INDEX waiver_v2_waiverqr_qr_code_fce02e73_like;

-- === Product ===
-- idx_product_category: cubierto por idx_product_cat_pub_created (prefijo)
-- idx_product_publicated: cubierto por idx_product_pub_created (prefijo)
-- PERO: NO los eliminamos aún porque el schema.prisma los declara y
-- se recrearían en prisma migrate. Documentamos como TODO.
-- (Workaround: eliminar manualmente + ajustar schema en commit aparte)
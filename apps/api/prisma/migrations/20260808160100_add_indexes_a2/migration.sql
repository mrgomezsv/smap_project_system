-- A2: Agregar índices optimizados (online en MariaDB 10.6)
-- Todos son CREATE INDEX IF NOT EXISTS para idempotencia
-- Total: 38 índices

CREATE INDEX IF NOT EXISTS `idx_chatroom_lastmsg` ON `t_app_chat_room`(`last_message_at` DESC);
CREATE INDEX IF NOT EXISTS `idx_comment_created` ON `t_app_product_comment`(`created_at` DESC);
CREATE INDEX IF NOT EXISTS `idx_comment_is_approved` ON `t_app_product_comment`(`is_approved`);
CREATE INDEX IF NOT EXISTS `idx_comment_product_appr_created` ON `t_app_product_comment`(`product_id`, `is_approved`, `created_at` DESC);
CREATE INDEX IF NOT EXISTS `idx_commentreply_comment` ON `t_app_product_comment_reply`(`comment_id`);
CREATE INDEX IF NOT EXISTS `idx_contact_created` ON `t_app_contact_message`(`created_at` DESC);
CREATE INDEX IF NOT EXISTS `idx_contact_unread_created` ON `t_app_contact_message`(`is_read`, `created_at` DESC);
CREATE INDEX IF NOT EXISTS `idx_contract_eventdate` ON `t_app_rental_contract`(`event_date`);
CREATE INDEX IF NOT EXISTS `idx_contract_status_created` ON `t_app_rental_contract`(`status`, `created_at` DESC);
CREATE INDEX IF NOT EXISTS `idx_event_partners` ON `t_app_event`(`partners`);
CREATE INDEX IF NOT EXISTS `idx_event_pub_start` ON `t_app_event`(`published`, `start_datetime`);
CREATE INDEX IF NOT EXISTS `idx_event_start` ON `t_app_event`(`start_datetime`);
CREATE INDEX IF NOT EXISTS `idx_msg_room_time` ON `t_app_chat_message`(`chat_room_id`, `timestamp` DESC);
CREATE INDEX IF NOT EXISTS `idx_msg_sender_time` ON `t_app_chat_message`(`sender_id`, `timestamp` DESC);
CREATE INDEX IF NOT EXISTS `idx_msg_unread_room` ON `t_app_chat_message`(`is_read`, `chat_room_id`);
CREATE INDEX IF NOT EXISTS `idx_product_cat_pub_created` ON `t_app_product_product`(`category`, `publicated`, `created` DESC);
CREATE INDEX IF NOT EXISTS `idx_product_pub_created` ON `t_app_product_product`(`publicated`, `created` DESC);
CREATE INDEX IF NOT EXISTS `idx_productcomment_product` ON `t_app_product_comment`(`product_id`);
CREATE INDEX IF NOT EXISTS `idx_productlike_created` ON `t_app_product_like`(`created_at`);
CREATE INDEX IF NOT EXISTS `idx_productlike_product` ON `t_app_product_like`(`product_id`);
CREATE INDEX IF NOT EXISTS `idx_productlike_product_fav` ON `t_app_product_like`(`product_id`, `is_favorite`);
CREATE INDEX IF NOT EXISTS `idx_reply_comment_created` ON `t_app_product_comment_reply`(`comment_id`, `created_at`);
CREATE INDEX IF NOT EXISTS `idx_scan_by_when` ON `waiver_v2_waiverscan`(`scanned_by`, `scanned_at` DESC);
CREATE INDEX IF NOT EXISTS `idx_scan_when` ON `waiver_v2_waiverscan`(`scanned_at` DESC);
CREATE INDEX IF NOT EXISTS `idx_user_active` ON `auth_user`(`is_active`);
CREATE INDEX IF NOT EXISTS `idx_user_datejoined` ON `auth_user`(`date_joined`);
CREATE INDEX IF NOT EXISTS `idx_waiver_created` ON `waiver_v2_waiverqr`(`created_at` DESC);
CREATE INDEX IF NOT EXISTS `idx_waiver_expires` ON `waiver_v2_waiverqr`(`expires_at`);
CREATE INDEX IF NOT EXISTS `idx_waiver_status_created` ON `waiver_v2_waiverqr`(`status`, `created_at` DESC);
CREATE INDEX IF NOT EXISTS `idx_waiver_user` ON `waiver_v2_waiverqr`(`user_id`);
CREATE INDEX IF NOT EXISTS `idx_waiverdata_timestamp` ON `waiver_v2_waiverdata`(`timestamp` DESC);
CREATE INDEX IF NOT EXISTS `t_app_chat_administrator_user_id_fk` ON `t_app_chat_administrator`(`user_id`);
CREATE INDEX IF NOT EXISTS `t_app_chat_message_chat_room_id_fk` ON `t_app_chat_message`(`chat_room_id`);
CREATE INDEX IF NOT EXISTS `t_app_chat_message_sender_id_fk` ON `t_app_chat_message`(`sender_id`);
CREATE INDEX IF NOT EXISTS `t_app_chat_room_user_id_fk` ON `t_app_chat_room`(`user_id`);
CREATE INDEX IF NOT EXISTS `t_app_product_waivervalidator_user_id_fk` ON `t_app_product_waivervalidator`(`user_id`);
CREATE INDEX IF NOT EXISTS `waiver_v2_waiverdata_waiver_qr_id_fk` ON `waiver_v2_waiverdata`(`waiver_qr_id`);
CREATE INDEX IF NOT EXISTS `waiver_v2_waiverscan_waiver_qr_id_fk` ON `waiver_v2_waiverscan`(`waiver_qr_id`);

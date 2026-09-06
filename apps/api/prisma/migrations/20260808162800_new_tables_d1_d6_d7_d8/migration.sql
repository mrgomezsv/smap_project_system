-- D1 + D6 + D7 + D8: Crear tablas nuevas (N1, sin tocar datos existentes)
-- Estas tablas son additive: no afectan ninguna fila ni estructura existente.

-- D1: FirebaseUser mapping
CREATE TABLE IF NOT EXISTS `t_app_firebase_user` (
  `firebase_uid` VARCHAR(128) NOT NULL,
  `user_id` INT NOT NULL,
  `email` VARCHAR(254) NULL,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`firebase_uid`),
  UNIQUE INDEX `t_app_firebase_user_user_id_unique`(`user_id`),
  INDEX `idx_firebase_user_user`(`user_id`),
  CONSTRAINT `t_app_firebase_user_user_fk`
    FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
    ON DELETE CASCADE ON UPDATE NO ACTION
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- D6: TranslationCache
CREATE TABLE IF NOT EXISTS `t_app_translation_cache` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `source_hash` VARCHAR(64) NOT NULL,
  `source_text` TEXT NOT NULL,
  `target_lang` VARCHAR(5) NOT NULL,
  `translated_text` TEXT NOT NULL,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `t_app_translation_cache_hash_unique`(`source_hash`),
  INDEX `idx_translation_lang`(`target_lang`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- D7: PushToken
CREATE TABLE IF NOT EXISTS `t_app_push_token` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` VARCHAR(128) NOT NULL,
  `token` VARCHAR(255) NOT NULL,
  `platform` VARCHAR(20) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `last_used_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `t_app_push_token_token_unique`(`token`),
  INDEX `idx_push_token_user_active`(`user_id`, `is_active`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- D8: AuditLog
CREATE TABLE IF NOT EXISTS `t_app_audit_log` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` INT NULL,
  `action` VARCHAR(50) NOT NULL,
  `entity` VARCHAR(50) NOT NULL,
  `entity_id` VARCHAR(64) NULL,
  `metadata` JSON NULL,
  `ip` VARCHAR(45) NULL,
  `user_agent` TEXT NULL,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  INDEX `idx_audit_user_created`(`user_id`, `created_at` DESC),
  INDEX `idx_audit_entity`(`entity`, `entity_id`),
  INDEX `idx_audit_action_created`(`action`, `created_at` DESC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
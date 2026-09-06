-- CreateTable: t_app_category para Módulo Dinámico de Categorías
CREATE TABLE IF NOT EXISTS `t_app_category` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(50) NOT NULL,
    `name_es` VARCHAR(100) NOT NULL,
    `name_en` VARCHAR(100) NULL,
    `emoji` VARCHAR(10) NOT NULL DEFAULT '🎪',
    `color` VARCHAR(100) NOT NULL DEFAULT 'from-primary/20 to-party-pink/20',
    `position` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

    UNIQUE INDEX `t_app_category_slug_key`(`slug`),
    INDEX `idx_category_position`(`position`),
    INDEX `idx_category_active_position`(`is_active`, `position`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

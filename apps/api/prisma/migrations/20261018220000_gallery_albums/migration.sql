-- Galería de álbumes de fiestas (mini blog con fotos y productos vinculados)

CREATE TABLE IF NOT EXISTS `t_app_gallery_album` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(160) NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `description` TEXT NULL,
    `event_date` DATE NULL,
    `location` VARCHAR(150) NULL,
    `cover_photo_id` INTEGER NULL,
    `published` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

    UNIQUE INDEX `t_app_gallery_album_slug_key`(`slug`),
    INDEX `idx_gallery_album_pub_date`(`published`, `event_date` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `t_app_gallery_photo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `album_id` INTEGER NOT NULL,
    `path` VARCHAR(255) NOT NULL,
    `caption` VARCHAR(255) NULL,
    `position` INTEGER NOT NULL DEFAULT 0,
    `width` INTEGER NULL,
    `height` INTEGER NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    INDEX `idx_gallery_photo_album_pos`(`album_id`, `position`),
    PRIMARY KEY (`id`),
    CONSTRAINT `t_app_gallery_photo_album_fk` FOREIGN KEY (`album_id`)
        REFERENCES `t_app_gallery_album`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `t_app_gallery_album_product` (
    `album_id` INTEGER NOT NULL,
    `product_id` BIGINT NOT NULL,

    INDEX `idx_gallery_ap_product`(`product_id`),
    PRIMARY KEY (`album_id`, `product_id`),
    CONSTRAINT `t_app_gallery_ap_album_fk` FOREIGN KEY (`album_id`)
        REFERENCES `t_app_gallery_album`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT `t_app_gallery_ap_product_fk` FOREIGN KEY (`product_id`)
        REFERENCES `t_app_product_product`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

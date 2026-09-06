-- D3 (VERSIÓN SEGURA): Crear tabla ProductImage, backfill desde img/.../img5
-- NO elimina las columnas originales. Aplicación puede migrar gradualmente.

-- Paso 1: Crear tabla normalizada
CREATE TABLE IF NOT EXISTS t_app_product_image (
  id            BIGINT NOT NULL AUTO_INCREMENT,
  product_id    BIGINT NOT NULL,
  url           VARCHAR(255) NOT NULL,
  alt_text      VARCHAR(255) NULL,
  position      INT NOT NULL DEFAULT 0,
  is_primary    TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  INDEX idx_product_image_product (product_id, position),
  INDEX idx_product_image_primary (product_id, is_primary),
  CONSTRAINT t_app_product_image_product_fk
    FOREIGN KEY (product_id) REFERENCES t_app_product_product (id)
    ON DELETE CASCADE ON UPDATE NO ACTION
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Paso 2: Backfill - Insertar img principal (position=0, is_primary=1)
INSERT INTO t_app_product_image (product_id, url, position, is_primary)
SELECT id, img, 0, 1
FROM t_app_product_product
WHERE img IS NOT NULL AND img != 'default_product_image.jpg';

-- Paso 3: Backfill - img1 (position=1)
INSERT INTO t_app_product_image (product_id, url, position, is_primary)
SELECT id, img1, 1, 0
FROM t_app_product_product
WHERE img1 IS NOT NULL AND img1 != 'default_product_image.jpg';

-- Paso 4: Backfill - img2 (position=2)
INSERT INTO t_app_product_image (product_id, url, position, is_primary)
SELECT id, img2, 2, 0
FROM t_app_product_product
WHERE img2 IS NOT NULL AND img2 != 'default_product_image.jpg';

-- Paso 5: Backfill - img3 (position=3)
INSERT INTO t_app_product_image (product_id, url, position, is_primary)
SELECT id, img3, 3, 0
FROM t_app_product_product
WHERE img3 IS NOT NULL AND img3 != 'default_product_image.jpg';

-- Paso 6: Backfill - img4 (position=4)
INSERT INTO t_app_product_image (product_id, url, position, is_primary)
SELECT id, img4, 4, 0
FROM t_app_product_product
WHERE img4 IS NOT NULL AND img4 != 'default_product_image.jpg';

-- Paso 7: Backfill - img5 (position=5)
INSERT INTO t_app_product_image (product_id, url, position, is_primary)
SELECT id, img5, 5, 0
FROM t_app_product_product
WHERE img5 IS NOT NULL AND img5 != 'default_product_image.jpg';

-- Rollback (manual, si se necesita):
-- DROP TABLE IF EXISTS t_app_product_image;
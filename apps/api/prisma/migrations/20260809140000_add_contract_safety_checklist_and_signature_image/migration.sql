SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 't_app_rental_contract'
    AND COLUMN_NAME = 'safety_checklist'
);
SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE t_app_rental_contract ADD COLUMN safety_checklist JSON NULL AFTER status',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 't_app_rental_contract'
    AND COLUMN_NAME = 'signature_image'
);
SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE t_app_rental_contract ADD COLUMN signature_image LONGTEXT NULL AFTER safety_checklist',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 't_app_rental_contract'
    AND COLUMN_NAME = 'updated_at'
);
SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE t_app_rental_contract ADD COLUMN updated_at DATETIME(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) AFTER created_at',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 't_app_rental_contract'
    AND COLUMN_NAME = 'expires_at'
);
SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE t_app_rental_contract ADD COLUMN expires_at DATETIME(6) NULL AFTER updated_at',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 't_app_rental_contract'
    AND COLUMN_NAME = 'viewed_at'
);
SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE t_app_rental_contract ADD COLUMN viewed_at DATETIME(6) NULL AFTER expires_at',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 't_app_rental_contract'
    AND COLUMN_NAME = 'archived_at'
);
SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE t_app_rental_contract ADD COLUMN archived_at DATETIME(6) NULL AFTER viewed_at',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 't_app_rental_contract'
    AND COLUMN_NAME = 'cancelled_at'
);
SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE t_app_rental_contract ADD COLUMN cancelled_at DATETIME(6) NULL AFTER archived_at',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 't_app_rental_contract'
    AND COLUMN_NAME = 'cancel_reason'
);
SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE t_app_rental_contract ADD COLUMN cancel_reason TEXT NULL AFTER cancelled_at',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 't_app_rental_contract'
    AND COLUMN_NAME = 'signature_method'
);
SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE t_app_rental_contract ADD COLUMN signature_method VARCHAR(30) NULL AFTER cancel_reason',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 't_app_rental_contract'
    AND COLUMN_NAME = 'created_by_id'
);
SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE t_app_rental_contract ADD COLUMN created_by_id INT NULL AFTER signature_method',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE t_app_rental_contract
SET expires_at = DATE_ADD(created_at, INTERVAL 7 DAY)
WHERE status = 'PENDING'
  AND expires_at IS NULL
  AND created_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS t_app_contract_document (
  id                 BIGINT NOT NULL AUTO_INCREMENT,
  contract_id        INT NOT NULL,
  payment_id         BIGINT NULL,
  kind               VARCHAR(30) NOT NULL,
  original_filename  VARCHAR(255) NOT NULL,
  mime_type          VARCHAR(120) NOT NULL,
  size_bytes         INT NOT NULL,
  sha256             VARCHAR(64) NOT NULL,
  storage_path       VARCHAR(500) NOT NULL,
  uploaded_by_id     INT NULL,
  created_at         DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  INDEX idx_contract_document_contract_kind (contract_id, kind),
  INDEX idx_contract_document_payment (payment_id),
  INDEX idx_contract_document_created (created_at DESC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS t_app_contract_payment (
  id            BIGINT NOT NULL AUTO_INCREMENT,
  contract_id   INT NOT NULL,
  type          VARCHAR(20) NOT NULL,
  amount        DECIMAL(10,2) NOT NULL,
  method        VARCHAR(40) NOT NULL,
  reference     VARCHAR(120) NULL,
  notes         TEXT NULL,
  paid_at       DATETIME(6) NOT NULL,
  created_by_id INT NULL,
  created_at    DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  INDEX idx_contract_payment_contract (contract_id),
  INDEX idx_contract_payment_contract_type (contract_id, type),
  INDEX idx_contract_payment_paid_at (paid_at DESC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO t_app_contract_payment (contract_id, type, amount, method, notes, paid_at, created_at)
SELECT
  rc.id,
  'DEPOSIT',
  rc.deposit,
  'manual',
  'historical-backfill',
  rc.created_at,
  NOW(6)
FROM t_app_rental_contract rc
WHERE rc.deposit IS NOT NULL
  AND rc.deposit > 0
  AND NOT EXISTS (
    SELECT 1
    FROM t_app_contract_payment cp
    WHERE cp.contract_id = rc.id
      AND cp.type = 'DEPOSIT'
      AND cp.amount = rc.deposit
  );

CREATE INDEX IF NOT EXISTS idx_rental_contract_created_by ON t_app_rental_contract (created_by_id);
CREATE INDEX IF NOT EXISTS idx_rental_contract_expires_at ON t_app_rental_contract (expires_at);
CREATE INDEX IF NOT EXISTS idx_rental_contract_archived_at ON t_app_rental_contract (archived_at);

SET @fk_exists := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 't_app_rental_contract'
    AND CONSTRAINT_NAME = 't_app_rental_contract_created_by_fk'
);
SET @sql := IF(
  @fk_exists = 0,
  'ALTER TABLE t_app_rental_contract ADD CONSTRAINT t_app_rental_contract_created_by_fk FOREIGN KEY (created_by_id) REFERENCES auth_user (id) ON DELETE SET NULL ON UPDATE NO ACTION',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk_exists := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 't_app_contract_document'
    AND CONSTRAINT_NAME = 't_app_contract_document_contract_fk'
);
SET @sql := IF(
  @fk_exists = 0,
  'ALTER TABLE t_app_contract_document ADD CONSTRAINT t_app_contract_document_contract_fk FOREIGN KEY (contract_id) REFERENCES t_app_rental_contract (id) ON DELETE CASCADE ON UPDATE NO ACTION',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk_exists := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 't_app_contract_document'
    AND CONSTRAINT_NAME = 't_app_contract_document_payment_fk'
);
SET @sql := IF(
  @fk_exists = 0,
  'ALTER TABLE t_app_contract_document ADD CONSTRAINT t_app_contract_document_payment_fk FOREIGN KEY (payment_id) REFERENCES t_app_contract_payment (id) ON DELETE SET NULL ON UPDATE NO ACTION',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk_exists := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 't_app_contract_document'
    AND CONSTRAINT_NAME = 't_app_contract_document_uploader_fk'
);
SET @sql := IF(
  @fk_exists = 0,
  'ALTER TABLE t_app_contract_document ADD CONSTRAINT t_app_contract_document_uploader_fk FOREIGN KEY (uploaded_by_id) REFERENCES auth_user (id) ON DELETE SET NULL ON UPDATE NO ACTION',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk_exists := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 't_app_contract_payment'
    AND CONSTRAINT_NAME = 't_app_contract_payment_contract_fk'
);
SET @sql := IF(
  @fk_exists = 0,
  'ALTER TABLE t_app_contract_payment ADD CONSTRAINT t_app_contract_payment_contract_fk FOREIGN KEY (contract_id) REFERENCES t_app_rental_contract (id) ON DELETE CASCADE ON UPDATE NO ACTION',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk_exists := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 't_app_contract_payment'
    AND CONSTRAINT_NAME = 't_app_contract_payment_creator_fk'
);
SET @sql := IF(
  @fk_exists = 0,
  'ALTER TABLE t_app_contract_payment ADD CONSTRAINT t_app_contract_payment_creator_fk FOREIGN KEY (created_by_id) REFERENCES auth_user (id) ON DELETE SET NULL ON UPDATE NO ACTION',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

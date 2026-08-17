CREATE TABLE IF NOT EXISTS t_app_client (
  id              INT NOT NULL AUTO_INCREMENT,
  email           VARCHAR(254) NOT NULL,
  name            VARCHAR(150) NOT NULL,
  phone           VARCHAR(50) NULL,
  address         VARCHAR(255) NULL,
  city_state_zip  VARCHAR(150) NULL,
  driver_license  VARCHAR(50) NULL,
  user_id         INT NULL,
  source          VARCHAR(30) NOT NULL DEFAULT 'manual',
  notes           TEXT NULL,
  is_active       TINYINT(1) NOT NULL DEFAULT 1,
  created_at      DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at      DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE INDEX t_app_client_email_unique (email),
  UNIQUE INDEX t_app_client_user_id_unique (user_id),
  INDEX idx_client_name (name),
  INDEX idx_client_active (is_active),
  INDEX idx_client_source (source)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 't_app_rental_contract'
    AND COLUMN_NAME = 'client_id'
);
SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE t_app_rental_contract ADD COLUMN client_id INT NULL AFTER created_at',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

INSERT IGNORE INTO t_app_client (email, name, phone, address, city_state_zip, driver_license, user_id, source, is_active, created_at, updated_at)
SELECT
  LOWER(TRIM(u.email))                            AS email,
  COALESCE(NULLIF(TRIM(CONCAT_WS(' ', u.first_name, u.last_name)), ''), u.username, LOWER(TRIM(u.email))) AS name,
  NULL                                            AS phone,
  NULL                                            AS address,
  NULL                                            AS city_state_zip,
  NULL                                            AS driver_license,
  u.id                                            AS user_id,
  CASE
    WHEN fu.firebase_uid IS NOT NULL THEN 'firebase'
    ELSE 'auth_user'
  END                                             AS source,
  1                                                AS is_active,
  NOW(6)                                          AS created_at,
  NOW(6)                                          AS updated_at
FROM auth_user u
LEFT JOIN t_app_firebase_user fu ON fu.user_id = u.id
WHERE u.email IS NOT NULL
  AND TRIM(u.email) <> ''
  AND LOWER(TRIM(u.email)) NOT IN ('', 'anonymous@firebase.local', 'dev@local');

INSERT IGNORE INTO t_app_client (email, name, phone, address, city_state_zip, driver_license, user_id, source, is_active, created_at, updated_at)
SELECT
  LOWER(TRIM(latest.client_email))                AS email,
  latest.client_name                              AS name,
  latest.client_phone                             AS phone,
  latest.client_address                           AS address,
  latest.client_city_state_zip                    AS city_state_zip,
  latest.driver_license                           AS driver_license,
  NULL                                            AS user_id,
  'contract'                                      AS source,
  1                                                AS is_active,
  NOW(6)                                          AS created_at,
  NOW(6)                                          AS updated_at
FROM (
  SELECT c.*
  FROM t_app_rental_contract c
  INNER JOIN (
    SELECT LOWER(TRIM(client_email)) AS email_norm, MAX(id) AS max_id
    FROM t_app_rental_contract
    WHERE client_email IS NOT NULL
      AND TRIM(client_email) <> ''
      AND LOWER(TRIM(client_email)) NOT IN ('', 'anonymous@firebase.local', 'dev@local')
    GROUP BY LOWER(TRIM(client_email))
  ) latest_match
    ON c.id = latest_match.max_id
) latest
WHERE LOWER(TRIM(latest.client_email)) NOT IN ('', 'anonymous@firebase.local', 'dev@local')
  AND LOWER(TRIM(latest.client_email)) NOT IN (
    SELECT email FROM t_app_client WHERE email IS NOT NULL
  );

UPDATE t_app_client c
JOIN auth_user u
  ON LOWER(TRIM(u.email)) COLLATE utf8mb4_unicode_ci = c.email
  AND u.email IS NOT NULL
  AND TRIM(u.email) <> ''
SET c.user_id = u.id
WHERE c.user_id IS NULL;

UPDATE t_app_client c
LEFT JOIN (
  SELECT
    LOWER(TRIM(c2.client_email)) AS email_norm,
    NULLIF(TRIM(c2.client_phone), '')         AS phone,
    NULLIF(TRIM(c2.client_address), '')       AS address,
    NULLIF(TRIM(c2.client_city_state_zip), '') AS city_state_zip,
    NULLIF(TRIM(c2.driver_license), '')        AS driver_license
  FROM t_app_rental_contract c2
  INNER JOIN (
    SELECT LOWER(TRIM(client_email)) AS email_norm, MAX(id) AS max_id
    FROM t_app_rental_contract
    WHERE client_email IS NOT NULL
      AND TRIM(client_email) <> ''
    GROUP BY LOWER(TRIM(client_email))
  ) latest_match
    ON c2.id = latest_match.max_id
) latest
  ON latest.email_norm COLLATE utf8mb4_unicode_ci = c.email
SET
  c.phone          = COALESCE(NULLIF(c.phone, ''), latest.phone),
  c.address        = COALESCE(NULLIF(c.address, ''), latest.address),
  c.city_state_zip = COALESCE(NULLIF(c.city_state_zip, ''), latest.city_state_zip),
  c.driver_license = COALESCE(NULLIF(c.driver_license, ''), latest.driver_license);

UPDATE t_app_rental_contract rc
JOIN t_app_client c
  ON LOWER(TRIM(c.email)) = LOWER(TRIM(rc.client_email)) COLLATE utf8mb4_unicode_ci
SET rc.client_id = c.id
WHERE rc.client_id IS NULL
  AND rc.client_email IS NOT NULL
  AND TRIM(rc.client_email) <> '';

CREATE INDEX IF NOT EXISTS idx_rental_contract_client_id ON t_app_rental_contract (client_id);

SET @fk_exists := (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 't_app_rental_contract'
    AND CONSTRAINT_NAME = 't_app_rental_contract_client_fk'
);
SET @sql := IF(
  @fk_exists = 0,
  'ALTER TABLE t_app_rental_contract ADD CONSTRAINT t_app_rental_contract_client_fk FOREIGN KEY (client_id) REFERENCES t_app_client (id) ON DELETE SET NULL ON UPDATE NO ACTION',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_exists := (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 't_app_client'
    AND CONSTRAINT_NAME = 't_app_client_user_fk'
);
SET @sql := IF(
  @fk_exists = 0,
  'ALTER TABLE t_app_client ADD CONSTRAINT t_app_client_user_fk FOREIGN KEY (user_id) REFERENCES auth_user (id) ON DELETE SET NULL ON UPDATE NO ACTION',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

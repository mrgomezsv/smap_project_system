-- D4: Crear tabla ContractSafetyChecklistItem (N1 - tabla vacía, sin datos que migrar)
-- Tabla t_app_rental_contract tiene 0 filas, no hay safetyChecklist que migrar.

CREATE TABLE IF NOT EXISTS t_app_contract_safety_item (
  id           BIGINT NOT NULL AUTO_INCREMENT,
  contract_id  INT NOT NULL,
  item_key     VARCHAR(50) NOT NULL,
  is_checked   TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE INDEX t_app_contract_safety_unique (contract_id, item_key),
  INDEX idx_safety_contract (contract_id),
  CONSTRAINT t_app_contract_safety_contract_fk
    FOREIGN KEY (contract_id) REFERENCES t_app_rental_contract (id)
    ON DELETE CASCADE ON UPDATE NO ACTION
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Rollback:
-- DROP TABLE IF EXISTS t_app_contract_safety_item;
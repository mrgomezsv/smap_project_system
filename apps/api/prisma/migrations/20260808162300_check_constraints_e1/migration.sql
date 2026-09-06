-- E1: CHECK constraints (additive, N1 risk level)
-- Pre-validated: all existing data passes the constraints below.
-- These protect against future bad data insertion.

-- 1. Products with non-negative price
ALTER TABLE t_app_product_product
  ADD CONSTRAINT chk_product_price_nonneg
  CHECK (price IS NULL OR price >= 0);

-- 2. Events with non-negative ticket price
ALTER TABLE t_app_event
  ADD CONSTRAINT chk_event_ticket_price_nonneg
  CHECK (ticket_price >= 0);

-- 3. Waivers must expire after they are created
ALTER TABLE waiver_v2_waiverqr
  ADD CONSTRAINT chk_waiver_expires_after_created
  CHECK (expires_at >= created_at);

-- 4. Relatives age must be sane (0-120 years)
ALTER TABLE waiver_v2_waiverdata
  ADD CONSTRAINT chk_waiverdata_age_range
  CHECK (relative_age BETWEEN 0 AND 120);

-- 5. Rental contracts: price/deposit non-negative when present
ALTER TABLE t_app_rental_contract
  ADD CONSTRAINT chk_contract_amounts_nonneg
  CHECK ((price IS NULL OR price >= 0) AND (deposit IS NULL OR deposit >= 0));
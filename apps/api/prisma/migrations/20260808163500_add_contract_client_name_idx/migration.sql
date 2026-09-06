-- F: Agregar índice para búsquedas admin en contracts
CREATE INDEX idx_contract_client_name ON t_app_rental_contract(client_name);

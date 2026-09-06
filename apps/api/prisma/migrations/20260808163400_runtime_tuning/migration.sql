-- F: Tuning de runtime MariaDB
-- NOTA: estos son comandos de runtime, no estructurales.
-- Para que persistan en restart, deben estar en docker-compose.yml (command:).

-- Activar slow query log para detectar queries > 1 segundo
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;
SET GLOBAL log_output = 'TABLE';

-- Aumentar tmp_table_size y max_heap_table_size (default 16MB es bajo)
SET GLOBAL tmp_table_size = 33554432;       -- 32MB
SET GLOBAL max_heap_table_size = 33554432;  -- 32MB
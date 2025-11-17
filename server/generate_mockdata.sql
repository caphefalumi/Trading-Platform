-- =============================================
-- Mock Data Generator for Trading Platform
-- Generates configurable mock data with proper foreign keys
-- =============================================

-- Disable foreign key checks temporarily for faster insertion
SET FOREIGN_KEY_CHECKS = 0;
SET @usdt_id = NULL;
SET @btc_id = NULL;
SET @eth_id = NULL;
SET @voc_id = NULL;
SET @crypto_class_id = NULL;

-- =============================================
-- 1. INSERT REFERENCE DATA (Currencies, Asset Classes, Order Types, etc.)
-- =============================================

-- Insert Currencies
INSERT INTO currencies (id, code, name, symbol) VALUES 
    (UUID(), 'USDT', 'Tether USD', '₮'),
    (UUID(), 'BTC', 'Bitcoin', '₿'),
    (UUID(), 'ETH', 'Ethereum', 'Ξ'),
    (UUID(), 'VOC', 'VOC Token', 'Ⓥ')
ON DUPLICATE KEY UPDATE code = code;

-- Get currency IDs for later use
SELECT id INTO @usdt_id FROM currencies WHERE code = 'USDT' LIMIT 1;
SELECT id INTO @btc_id FROM currencies WHERE code = 'BTC' LIMIT 1;
SELECT id INTO @eth_id FROM currencies WHERE code = 'ETH' LIMIT 1;
SELECT id INTO @voc_id FROM currencies WHERE code = 'VOC' LIMIT 1;

-- Insert Asset Classes
INSERT INTO asset_classes (id, name, description) VALUES 
    (UUID(), 'Cryptocurrency', 'Digital or virtual currency'),
    (UUID(), 'Forex', 'Foreign Exchange'),
    (UUID(), 'Commodity', 'Raw materials and primary products')
ON DUPLICATE KEY UPDATE name = name;

SELECT id INTO @crypto_class_id FROM asset_classes WHERE name = 'Cryptocurrency' LIMIT 1;

-- Insert Order Sides
INSERT INTO order_sides (code, description) VALUES 
    ('BUY', 'Buy order'),
    ('SELL', 'Sell order')
ON DUPLICATE KEY UPDATE code = code;

-- Insert Order Statuses
INSERT INTO order_statuses (code, description) VALUES 
    ('PENDING', 'Order pending'),
    ('OPEN', 'Order open'),
    ('FILLED', 'Order filled'),
    ('PARTIALLY_FILLED', 'Order partially filled'),
    ('CANCELLED', 'Order cancelled'),
    ('REJECTED', 'Order rejected')
ON DUPLICATE KEY UPDATE code = code;

-- Insert Order Types
INSERT INTO order_types (code, description) VALUES 
    ('MARKET', 'Market order'),
    ('LIMIT', 'Limit order'),
    ('STOP', 'Stop order'),
    ('STOP_LIMIT', 'Stop limit order')
ON DUPLICATE KEY UPDATE code = code;

-- Insert Time In Force Types
INSERT INTO time_in_force_types (code, description) VALUES 
    ('GTC', 'Good Till Cancelled'),
    ('IOC', 'Immediate or Cancel'),
    ('FOK', 'Fill or Kill'),
    ('DAY', 'Day order')
ON DUPLICATE KEY UPDATE code = code;

-- Insert Transaction Types
INSERT INTO transaction_types (code, description, category) VALUES 
    ('DEPOSIT', 'Deposit funds', 'CREDIT'),
    ('WITHDRAWAL', 'Withdraw funds', 'DEBIT'),
    ('TRADE', 'Trade execution', 'TRADE'),
    ('FEE', 'Trading fee', 'DEBIT')
ON DUPLICATE KEY UPDATE code = code;

-- Insert Transaction Statuses
INSERT INTO transaction_statuses (code, description) VALUES 
    ('PENDING', 'Transaction pending'),
    ('COMPLETED', 'Transaction completed'),
    ('FAILED', 'Transaction failed'),
    ('CANCELLED', 'Transaction cancelled')
ON DUPLICATE KEY UPDATE code = code;

-- Insert Ledger Entry Types
INSERT INTO ledger_entry_types (code, description, category) VALUES 
    ('DEPOSIT', 'Deposit entry', 'CREDIT'),
    ('WITHDRAWAL', 'Withdrawal entry', 'DEBIT'),
    ('TRADE_BUY', 'Trade buy entry', 'DEBIT'),
    ('TRADE_SELL', 'Trade sell entry', 'CREDIT'),
    ('FEE', 'Fee entry', 'DEBIT')
ON DUPLICATE KEY UPDATE code = code;

-- =============================================
-- 2. INSERT INSTRUMENTS
-- =============================================

INSERT INTO instruments (id, symbol, name, asset_class_id, lot_size, tick_size, currency_id) VALUES 
    (UUID(), 'BTCUSDT', 'Bitcoin/Tether', @crypto_class_id, 0.00000100, 0.01000000, @usdt_id),
    (UUID(), 'ETHUSDT', 'Ethereum/Tether', @crypto_class_id, 0.00001000, 0.01000000, @usdt_id),
    (UUID(), 'VOCUSDT', 'VOC Token/Tether', @crypto_class_id, 0.00010000, 0.00010000, @usdt_id)
ON DUPLICATE KEY UPDATE symbol = symbol;

-- =============================================
-- 3-11. Scalable mock data generator (DELIMITER-free)
-- Configure sizes below then run the file
-- =============================================

-- --- Configure sizes here (change to scale)
SET @ACCOUNTS = 1000;
SET @ORDERS = 2000;
SET @POSITIONS = 500;
SET @TRANSACTIONS = 1500;
SET @LEDGER = 2000;
SET @MARKET_QUOTES = 1000;
SET @INSTR_PRICES = 1000;
SET @EXECUTIONS = 1000;

-- Create a temporary numbers table large enough for generation
DROP TEMPORARY TABLE IF EXISTS nums;
CREATE TEMPORARY TABLE nums (n INT PRIMARY KEY);
-- populate 1..10000 (adjust if you need larger)
-- Use a 4-way cross join of 0..9 to produce 0..9999, then add 1 => 1..10000
INSERT INTO nums (n)
SELECT ones.n + tens.n * 10 + hundreds.n * 100 + thousands.n * 1000 + 1
FROM
    (SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) ones,
    (SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) tens,
    (SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) hundreds,
    (SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) thousands
LIMIT 10000;

-- 3. ACCOUNTS (use nums.n as row number)
-- Use WHERE n <= @ACCOUNTS instead of LIMIT @ACCOUNTS for better compatibility
INSERT INTO accounts (id, email, password, base_currency_id, created_at)
SELECT UUID(), CONCAT('user', n, '@trading-platform.com'), CONCAT('$2b$10$', MD5(CONCAT('password', n))), @usdt_id, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 365) DAY)
FROM nums
WHERE n <= @ACCOUNTS
ORDER BY n;

-- 4. ACCOUNT BALANCES (bulk style)
INSERT INTO account_balances (id, account_id, currency_id, available, reserved, created_at, updated_at)
SELECT UUID(), id, @usdt_id, ROUND(RAND() * 100000, 8), ROUND(RAND() * 1000, 8), NOW(), NOW() FROM accounts;

INSERT INTO account_balances (id, account_id, currency_id, available, reserved, created_at, updated_at)
SELECT UUID(), id, @btc_id, ROUND(RAND() * 10, 8), ROUND(RAND() * 0.5, 8), NOW(), NOW() FROM accounts WHERE RAND() > 0.3;

INSERT INTO account_balances (id, account_id, currency_id, available, reserved, created_at, updated_at)
SELECT UUID(), id, @eth_id, ROUND(RAND() * 100, 8), ROUND(RAND() * 5, 8), NOW(), NOW() FROM accounts WHERE RAND() > 0.4;

INSERT INTO account_balances (id, account_id, currency_id, available, reserved, created_at, updated_at)
SELECT UUID(), id, @voc_id, ROUND(RAND() * 10000, 8), ROUND(RAND() * 100, 8), NOW(), NOW() FROM accounts WHERE RAND() > 0.5;

-- 5. ORDERS
INSERT INTO orders (id, account_id, instrument_id, side_id, type_id, status_id, time_in_force_id, client_order_id, price, quantity, filled_quantity, remaining_quantity, created_at, updated_at)
SELECT
    UUID(),
    (SELECT id FROM accounts ORDER BY RAND() LIMIT 1),
    (SELECT id FROM instruments ORDER BY RAND() LIMIT 1),
    IF(RAND() > 0.5, 1, 2),
    FLOOR(1 + RAND() * 2),
    FLOOR(1 + RAND() * 6),
    IF(RAND() > 0.5, 1, NULL),
    CONCAT('CLT-', LPAD(n, 10, '0')),
    ROUND(30000 + RAND() * 40000, 8),
    ROUND(RAND() * 2, 8),
    ROUND(RAND() * 1, 8),
    ROUND(RAND() * 1, 8),
    DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 180) DAY),
    NOW()
FROM nums
WHERE n <= @ORDERS
ORDER BY n;

-- 6. EXECUTIONS (for filled orders)
-- Use ROW_NUMBER() to pick a limited random subset without using LIMIT with a user variable
INSERT INTO executions (id, order_id, counterparty_order_id, price, quantity, executed_at, liquidity)
SELECT UUID(), o.id, NULL, o.price, o.filled_quantity, o.updated_at, IF(RAND() > 0.5, 'MAKER', 'TAKER')
FROM (
    SELECT id, price, filled_quantity, updated_at,
                 ROW_NUMBER() OVER (ORDER BY RAND()) AS rn
    FROM orders
    WHERE status_id IN (3,4) AND filled_quantity > 0
) o
WHERE o.rn <= @EXECUTIONS;

-- 7. POSITIONS
INSERT INTO positions (id, account_id, instrument_id, quantity, average_price, updated_at)
SELECT UUID(), (SELECT id FROM accounts ORDER BY RAND() LIMIT 1), (SELECT id FROM instruments ORDER BY RAND() LIMIT 1), ROUND((RAND() * 4) - 2, 8), ROUND(30000 + RAND() * 40000, 8), NOW()
FROM nums
WHERE n <= @POSITIONS
ORDER BY n
ON DUPLICATE KEY UPDATE quantity = VALUES(quantity);

-- 8. TRANSACTIONS
INSERT INTO transactions (id, account_id, tx_type_id, status_id, amount, currency_id, external_ref, created_at, updated_at)
SELECT UUID(), (SELECT id FROM accounts ORDER BY RAND() LIMIT 1), FLOOR(1 + RAND() * 4), FLOOR(1 + RAND() * 2), ROUND(RAND() * 10000, 8), IF(RAND() > 0.5, @usdt_id, @btc_id), CONCAT('TXN-', UUID()), DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY), NOW()
FROM nums
WHERE n <= @TRANSACTIONS
ORDER BY n;

-- 9. LEDGER ENTRIES
INSERT INTO ledger_entries (id, account_id, entry_type_id, amount, reference_id, reference_table, created_at)
SELECT UUID(), (SELECT id FROM accounts ORDER BY RAND() LIMIT 1), FLOOR(1 + RAND() * 5), ROUND((RAND() * 20000) - 10000, 8), UUID(), IF(RAND() > 0.5, 'orders', 'transactions'), DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 120) DAY)
FROM nums
WHERE n <= @LEDGER
ORDER BY n;

-- 10. MARKET QUOTES (Historical data)
INSERT INTO market_quotes (instrument_id, bid_price, ask_price, last_price, volume, ts)
SELECT (SELECT id FROM instruments ORDER BY RAND() LIMIT 1), ROUND(30000 + RAND() * 40000, 8), ROUND(30100 + RAND() * 40000, 8), ROUND(30050 + RAND() * 40000, 8), ROUND(RAND() * 1000000, 8), DATE_SUB(NOW(), INTERVAL n HOUR)
FROM nums
WHERE n <= @MARKET_QUOTES
ORDER BY n
ON DUPLICATE KEY UPDATE bid_price = VALUES(bid_price);

-- 11. INSTRUMENT PRICES (Historical OHLC data)
INSERT INTO instrument_prices (instrument_id, timestamp, open_price, close_price, volume)
SELECT (SELECT id FROM instruments ORDER BY RAND() LIMIT 1), DATE_SUB(NOW(), INTERVAL n HOUR), ROUND(30000 + RAND() * 40000, 8), ROUND(30000 + RAND() * 40000, 8), ROUND(RAND() * 500000, 8)
FROM nums
WHERE n <= @INSTR_PRICES
ORDER BY n
ON DUPLICATE KEY UPDATE open_price = VALUES(open_price);

-- Clean up temporary numbers table
DROP TEMPORARY TABLE IF EXISTS nums;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================
-- SUMMARY
-- =============================================

SELECT 'Mock data generation completed!' AS status;
SELECT COUNT(*) AS total_accounts FROM accounts;
SELECT COUNT(*) AS total_account_balances FROM account_balances;
SELECT COUNT(*) AS total_orders FROM orders;
SELECT COUNT(*) AS total_executions FROM executions;
SELECT COUNT(*) AS total_positions FROM positions;
SELECT COUNT(*) AS total_transactions FROM transactions;
SELECT COUNT(*) AS total_ledger_entries FROM ledger_entries;
SELECT COUNT(*) AS total_market_quotes FROM market_quotes;
SELECT COUNT(*) AS total_instrument_prices FROM instrument_prices;
-- =============================================

-- Generate 2000 ledger entries
INSERT INTO ledger_entries (
    id, account_id, entry_type_id, amount, reference_id,
    reference_table, created_at
)
SELECT 
    UUID(),
    (SELECT id FROM accounts ORDER BY RAND() LIMIT 1),
    FLOOR(1 + RAND() * 5),
    ROUND((RAND() * 20000) - 10000, 8),
    UUID(),
    IF(RAND() > 0.5, 'orders', 'transactions'),
    DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 120) DAY)
FROM (
    SELECT 1 FROM (
        SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION 
        SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION
        SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15 UNION
        SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20 UNION
        SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25 UNION
        SELECT 26 UNION SELECT 27 UNION SELECT 28 UNION SELECT 29 UNION SELECT 30 UNION
        SELECT 31 UNION SELECT 32 UNION SELECT 33 UNION SELECT 34 UNION SELECT 35 UNION
        SELECT 36 UNION SELECT 37 UNION SELECT 38 UNION SELECT 39 UNION SELECT 40 UNION
        SELECT 41 UNION SELECT 42 UNION SELECT 43 UNION SELECT 44 UNION SELECT 45 UNION
        SELECT 46 UNION SELECT 47 UNION SELECT 48 UNION SELECT 49 UNION SELECT 50
    ) a, (
        SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION 
        SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION
        SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15 UNION
        SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20 UNION
        SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25 UNION
        SELECT 26 UNION SELECT 27 UNION SELECT 28 UNION SELECT 29 UNION SELECT 30 UNION
        SELECT 31 UNION SELECT 32 UNION SELECT 33 UNION SELECT 34 UNION SELECT 35 UNION
        SELECT 36 UNION SELECT 37 UNION SELECT 38 UNION SELECT 39 UNION SELECT 40
    ) b
) t
LIMIT 2000;
    
-- =============================================
-- 10. GENERATE MARKET QUOTES (Historical data)
-- =============================================

-- Generate 1000 market quotes
INSERT INTO market_quotes (
    instrument_id, bid_price, ask_price, last_price, volume, ts
)
SELECT 
    (SELECT id FROM instruments ORDER BY RAND() LIMIT 1),
    ROUND(30000 + RAND() * 40000, 8),
    ROUND(30100 + RAND() * 40000, 8),
    ROUND(30050 + RAND() * 40000, 8),
    ROUND(RAND() * 1000000, 8),
    DATE_SUB(NOW(), INTERVAL ROW_NUMBER() OVER () HOUR)
FROM (
    SELECT 1 FROM (
        SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION 
        SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10
    ) a, (
        SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION 
        SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10
    ) b, (
        SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION 
        SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10
    ) c
) t
LIMIT 1000
ON DUPLICATE KEY UPDATE bid_price = VALUES(bid_price);
    
-- =============================================
-- 11. GENERATE INSTRUMENT PRICES (Historical OHLC data)
-- =============================================

-- Generate 1000 instrument prices
INSERT INTO instrument_prices (
    instrument_id, timestamp, open_price, close_price, volume
)
SELECT 
    (SELECT id FROM instruments ORDER BY RAND() LIMIT 1),
    DATE_SUB(NOW(), INTERVAL ROW_NUMBER() OVER () HOUR),
    ROUND(30000 + RAND() * 40000, 8),
    ROUND(30000 + RAND() * 40000, 8),
    ROUND(RAND() * 500000, 8)
FROM (
    SELECT 1 FROM (
        SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION 
        SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10
    ) a, (
        SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION 
        SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10
    ) b, (
        SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION 
        SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10
    ) c
) t
LIMIT 1000
ON DUPLICATE KEY UPDATE open_price = VALUES(open_price);

-- Clean up temporary tables
DROP TEMPORARY TABLE IF EXISTS num10;
DROP TEMPORARY TABLE IF EXISTS num20;
DROP TEMPORARY TABLE IF EXISTS num50;
DROP TEMPORARY TABLE IF EXISTS num100;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================
-- SUMMARY
-- =============================================

SELECT 'Mock data generation completed!' AS status;
SELECT COUNT(*) AS total_accounts FROM accounts;
SELECT COUNT(*) AS total_account_balances FROM account_balances;
SELECT COUNT(*) AS total_orders FROM orders;
SELECT COUNT(*) AS total_executions FROM executions;
SELECT COUNT(*) AS total_positions FROM positions;
SELECT COUNT(*) AS total_transactions FROM transactions;
SELECT COUNT(*) AS total_ledger_entries FROM ledger_entries;
SELECT COUNT(*) AS total_market_quotes FROM market_quotes;
SELECT COUNT(*) AS total_instrument_prices FROM instrument_prices;

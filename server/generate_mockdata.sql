-- =============================================
-- Mock Data Generator for Trading Platform
-- Generates 1000+ entries with proper foreign keys
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
-- 3. GENERATE 1000 ACCOUNTS (Using INSERT with generated numbers)
-- =============================================

-- Create temporary tables with numbers
DROP TEMPORARY TABLE IF EXISTS num10;
DROP TEMPORARY TABLE IF EXISTS num20;
DROP TEMPORARY TABLE IF EXISTS num50;
DROP TEMPORARY TABLE IF EXISTS num100;

CREATE TEMPORARY TABLE num10 (n INT PRIMARY KEY);
CREATE TEMPORARY TABLE num20 (n INT PRIMARY KEY);
CREATE TEMPORARY TABLE num50 (n INT PRIMARY KEY);
CREATE TEMPORARY TABLE num100 (n INT PRIMARY KEY);

-- Insert numbers 1-10
INSERT INTO num10 (n) VALUES (1),(2),(3),(4),(5),(6),(7),(8),(9),(10);

-- Insert numbers 1-20
INSERT INTO num20 (n) VALUES 
(1),(2),(3),(4),(5),(6),(7),(8),(9),(10),
(11),(12),(13),(14),(15),(16),(17),(18),(19),(20);

-- Insert numbers 1-50
INSERT INTO num50 (n) VALUES 
(1),(2),(3),(4),(5),(6),(7),(8),(9),(10),
(11),(12),(13),(14),(15),(16),(17),(18),(19),(20),
(21),(22),(23),(24),(25),(26),(27),(28),(29),(30),
(31),(32),(33),(34),(35),(36),(37),(38),(39),(40),
(41),(42),(43),(44),(45),(46),(47),(48),(49),(50);

-- Insert numbers 1-100
INSERT INTO num100 (n) VALUES
(1),(2),(3),(4),(5),(6),(7),(8),(9),(10),
(11),(12),(13),(14),(15),(16),(17),(18),(19),(20),
(21),(22),(23),(24),(25),(26),(27),(28),(29),(30),
(31),(32),(33),(34),(35),(36),(37),(38),(39),(40),
(41),(42),(43),(44),(45),(46),(47),(48),(49),(50),
(51),(52),(53),(54),(55),(56),(57),(58),(59),(60),
(61),(62),(63),(64),(65),(66),(67),(68),(69),(70),
(71),(72),(73),(74),(75),(76),(77),(78),(79),(80),
(81),(82),(83),(84),(85),(86),(87),(88),(89),(90),
(91),(92),(93),(94),(95),(96),(97),(98),(99),(100);

-- Generate 1000 accounts (using simpler approach)
INSERT INTO accounts (id, email, password, base_currency_id, created_at)
SELECT 
    UUID(),
    CONCAT('user', ROW_NUMBER() OVER (), '@trading-platform.com'),
    CONCAT('$2b$10$', MD5(CONCAT('password', ROW_NUMBER() OVER ()))),
    @usdt_id,
    DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 365) DAY)
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
) t;
    
-- =============================================
-- 4. GENERATE ACCOUNT BALANCES
-- =============================================

-- USDT balance for all accounts
INSERT INTO account_balances (id, account_id, currency_id, available, reserved, created_at, updated_at)
SELECT 
    UUID(),
    id,
    @usdt_id,
    ROUND(RAND() * 100000, 8),
    ROUND(RAND() * 1000, 8),
    NOW(),
    NOW()
FROM accounts;

-- BTC balance for 70% of accounts
INSERT INTO account_balances (id, account_id, currency_id, available, reserved, created_at, updated_at)
SELECT 
    UUID(),
    id,
    @btc_id,
    ROUND(RAND() * 10, 8),
    ROUND(RAND() * 0.5, 8),
    NOW(),
    NOW()
FROM accounts
WHERE RAND() > 0.3;

-- ETH balance for 60% of accounts
INSERT INTO account_balances (id, account_id, currency_id, available, reserved, created_at, updated_at)
SELECT 
    UUID(),
    id,
    @eth_id,
    ROUND(RAND() * 100, 8),
    ROUND(RAND() * 5, 8),
    NOW(),
    NOW()
FROM accounts
WHERE RAND() > 0.4;

-- VOC balance for 50% of accounts
INSERT INTO account_balances (id, account_id, currency_id, available, reserved, created_at, updated_at)
SELECT 
    UUID(),
    id,
    @voc_id,
    ROUND(RAND() * 10000, 8),
    ROUND(RAND() * 100, 8),
    NOW(),
    NOW()
FROM accounts
WHERE RAND() > 0.5;
    
-- =============================================
-- 5. GENERATE 2000 ORDERS
-- =============================================

-- Generate 2000 orders
INSERT INTO orders (
    id, account_id, instrument_id, side_id, type_id, status_id, time_in_force_id,
    client_order_id, price, quantity, filled_quantity, remaining_quantity,
    created_at, updated_at
)
SELECT 
    UUID(),
    (SELECT id FROM accounts ORDER BY RAND() LIMIT 1),
    (SELECT id FROM instruments ORDER BY RAND() LIMIT 1),
    IF(RAND() > 0.5, 1, 2),
    FLOOR(1 + RAND() * 2),
    FLOOR(1 + RAND() * 6),
    IF(RAND() > 0.5, 1, NULL),
    CONCAT('CLT-', LPAD(ROW_NUMBER() OVER (), 10, '0')),
    ROUND(30000 + RAND() * 40000, 8),
    ROUND(RAND() * 2, 8),
    ROUND(RAND() * 1, 8),
    ROUND(RAND() * 1, 8),
    DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 180) DAY),
    NOW()
FROM (
    SELECT 1 FROM (
        SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION 
        SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10
    ) a, (
        SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION 
        SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10
    ) b, (
        SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION 
        SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION
        SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15 UNION
        SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20
    ) c
) t
LIMIT 2000;
    
-- =============================================
-- 6. GENERATE EXECUTIONS (for filled orders)
-- =============================================

INSERT INTO executions (id, order_id, counterparty_order_id, price, quantity, executed_at, liquidity)
SELECT 
    UUID(),
    o.id,
    NULL,
    o.price,
    o.filled_quantity,
    o.updated_at,
    IF(RAND() > 0.5, 'MAKER', 'TAKER')
FROM orders o
WHERE o.status_id IN (3, 4)
AND o.filled_quantity > 0
LIMIT 1000;
    
-- =============================================
-- 7. GENERATE POSITIONS
-- =============================================

-- Generate 500 positions
INSERT INTO positions (id, account_id, instrument_id, quantity, average_price, updated_at)
SELECT 
    UUID(),
    (SELECT id FROM accounts ORDER BY RAND() LIMIT 1),
    (SELECT id FROM instruments ORDER BY RAND() LIMIT 1),
    ROUND((RAND() * 4) - 2, 8),
    ROUND(30000 + RAND() * 40000, 8),
    NOW()
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
        SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10
    ) b
) t
ON DUPLICATE KEY UPDATE quantity = VALUES(quantity);
    
-- =============================================
-- 8. GENERATE TRANSACTIONS
-- =============================================

-- Generate 1500 transactions
INSERT INTO transactions (
    id, account_id, tx_type_id, status_id, amount, currency_id,
    external_ref, created_at, updated_at
)
SELECT 
    UUID(),
    (SELECT id FROM accounts ORDER BY RAND() LIMIT 1),
    FLOOR(1 + RAND() * 4),
    FLOOR(1 + RAND() * 2),
    ROUND(RAND() * 10000, 8),
    IF(RAND() > 0.5, @usdt_id, @btc_id),
    CONCAT('TXN-', UUID()),
    DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 90) DAY),
    NOW()
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
        SELECT 26 UNION SELECT 27 UNION SELECT 28 UNION SELECT 29 UNION SELECT 30
    ) b
) t
LIMIT 1500;
    
-- =============================================
-- 9. GENERATE LEDGER ENTRIES
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

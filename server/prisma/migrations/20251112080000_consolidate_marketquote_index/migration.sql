-- Drop redundant index on market_quotes
DROP INDEX `market_quotes_instrument_id_ts_idx` ON `market_quotes`;

-- Recreate unique constraint with DESC ordering
ALTER TABLE `market_quotes` DROP INDEX `uq_market_quotes_instrument_ts`;
CREATE UNIQUE INDEX `uq_market_quotes_instrument_ts` ON `market_quotes`(`instrument_id`, `ts` DESC);

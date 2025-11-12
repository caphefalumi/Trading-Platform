-- Production index optimizations applied via db push
-- This migration file tracks the changes that were already applied to the database

-- The following indexes were added:
-- - ledger_entries: account_id, created_at
-- - sessions: account_id, expires_at
-- - sessions: expires_at
-- - orders: account_id, status_id
-- - orders: instrument_id, side_id, status_id, created_at (reordered from old index)
-- - transactions: account_id, created_at
-- - transactions: account_id, status_id, tx_type_id
-- - executions index renamed from executions_order_id_fkey to executions_order_id_idx





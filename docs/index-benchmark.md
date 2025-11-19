# Index Benchmark: orders variants for (account_id, created_at)

Date: 2025-11-19T13:44:28.270Z

Database: MySQL 8.0.35

Dataset:
- Orders total for benchmark account: 2
- LIMIT: 100
- Iterations: 20

Query under test:



```sql
SELECT id FROM `orders` WHERE account_id = ? ORDER BY created_at DESC LIMIT 100
```

Results summary (averages across 20 runs):

| Variant | Index DDL | Avg | Min | P50 | P90 | Max | Improvement vs baseline |
|--------|-----------|----:|----:|----:|----:|----:|------------------------:|
| Baseline | (no candidate index) | 33.206 ms | 31.500 ms | 32.927 ms | 34.837 ms | 35.713 ms | 0.00% |
| account_id | `CREATE INDEX idx_orders_account_only ON orders (`account_id`);` | 51.501 ms | 31.677 ms | 37.118 ms | 50.522 ms | 276.257 ms | -55.10% |
| account_id, created_at (ASC) | `CREATE INDEX idx_orders_account_created_at_asc ON orders (`account_id`, `created_at`);` | 37.155 ms | 31.256 ms | 35.612 ms | 44.423 ms | 50.836 ms | -11.89% |
| account_id, created_at (DESC) | `CREATE INDEX idx_orders_account_created_at ON orders (`account_id`, `created_at` DESC);` | 42.753 ms | 31.012 ms | 32.603 ms | 61.727 ms | 125.124 ms | -28.75% |

Execution plans (JSON from EXPLAIN; ANALYZE when available):

<details><summary>Baseline EXPLAIN</summary>

```json
[
  {
    "f0": "-> Limit: 100 row(s)  (cost=2.19 rows=2) (actual time=4.43..4.43 rows=2 loops=1)\n    -> Sort: orders.created_at DESC, limit input to 100 row(s) per chunk  (cost=2.19 rows=2) (actual time=4.43..4.43 rows=2 loops=1)\n        -> Index lookup on orders using orders_account_id_status_id_idx (account_id='000ca485-1169-4d89-9af0-e3f77051bb75')  (cost=2.19 rows=2) (actual time=4.38..4.38 rows=2 loops=1)\n"
  }
]
```

</details>

<details><summary>account_id — EXPLAIN</summary>

```json
[
  {
    "f0": "-> Limit: 100 row(s)  (cost=0.706 rows=2) (actual time=4.06..4.06 rows=2 loops=1)\n    -> Sort: orders.created_at DESC, limit input to 100 row(s) per chunk  (cost=0.706 rows=2) (actual time=4.05..4.05 rows=2 loops=1)\n        -> Index lookup on orders using orders_account_id_status_id_idx (account_id='000ca485-1169-4d89-9af0-e3f77051bb75')  (cost=0.706 rows=2) (actual time=4..4.01 rows=2 loops=1)\n"
  }
]
```

</details>

<details><summary>account_id, created_at (ASC) — EXPLAIN</summary>

```json
[
  {
    "f0": "-> Limit: 100 row(s)  (cost=1.23 rows=2) (actual time=0.048..0.056 rows=2 loops=1)\n    -> Covering index lookup on orders using idx_orders_account_created_at_asc (account_id='000ca485-1169-4d89-9af0-e3f77051bb75') (reverse)  (cost=1.23 rows=2) (actual time=0.0468..0.0545 rows=2 loops=1)\n"
  }
]
```

</details>

<details><summary>account_id, created_at (DESC) — EXPLAIN</summary>

```json
[
  {
    "f0": "-> Limit: 100 row(s)  (cost=1.37 rows=2) (actual time=0.0386..0.0463 rows=2 loops=1)\n    -> Covering index lookup on orders using idx_orders_account_created_at (account_id='000ca485-1169-4d89-9af0-e3f77051bb75')  (cost=1.37 rows=2) (actual time=0.0374..0.0449 rows=2 loops=1)\n"
  }
]
```

</details>

Notes:
- The benchmark picks the account with the most orders.
- Times are measured in-process using Node's performance.now().
- Each phase includes a warm-up run to stabilize caches.

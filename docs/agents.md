# Agents for Retail Trading Platform

This document defines the autonomous agents (background services, workers, and integrators) used by the trading platform MVP. It describes responsibilities, data contracts, operational requirements, security, observability, and testing guidance. The goal is to make agents predictable, auditable, and safe for a retail trading operator.

## Agent overview

Agents are small focused services (processes) that perform continuous or scheduled work outside of the synchronous API request/response path. Examples for this project:

- Market Data Agent (marketdata-agent)
- Price Recommender Agent (recommender-agent)
- Matching Engine Worker (matching-agent)
- Settlement & Ledger Agent (ledger-agent)
- Notification Agent (notify-agent)
- Reconciliation & Compliance Agent (reconcile-agent)
- Health & Monitoring Agent (heartbeat-agent)

Agents must be idempotent, observable, resilient, and respect platform access control.

---

## 1. Market Data Agent (marketdata-agent)

Purpose
- Poll external feeds (CoinMarketCap, exchange websockets) and normalize quotes into `MarketQuote` table.
- Publish updates to internal cache / pub-sub for UI and downstream agents.

Responsibilities
- Fetch quotes for configured instruments at required frequency.
- Validate and sanitize feed data (check timestamps, remove outliers, apply rate limits).
- Upsert `MarketQuote` with a deterministic timestamp and source tag.
- Emit events (e.g., via Redis pubsub or Kafka) for `quote.update`.

Data contract (example upsert)
```json
POST /internal/marketquote
{
  "instrumentId": "uuid",
  "lastPrice": "12345.67",
  "bidPrice": "12340.00",
  "askPrice": "12350.00",
  "volume": "1000",
  "source": "coinmarketcap",
  "ts": "2025-10-16T09:25:32.601Z"
}
```

Safety
- Use API key from secrets manager (do not commit).
- Respect provider rate limits; implement exponential backoff + jitter.

Observability
- Metrics: request latency, success/failure counts, items per second.
- Logs: feed source, symbol, fetched price, normalized price, errors.

---

## 2. Price Recommender Agent (recommender-agent)

Purpose
- Compute advisor signals and simple indicators (moving averages, volatility, momentum).
- Provide recommendations for the UI and risk checks for the matching engine.

Responsibilities
- Consume `quote.update` events or query `MarketQuote` periodically.
- Compute indicators and write `recommendations` table or cache.
- Version model outputs and record metadata for audit.

Contract
- `recommendation` rows include `instrumentId`, `score`, `explanation`, `modelVersion`, `ts`.

Safety
- Use conservative defaults; do not auto-execute trades.
- Log inputs & outputs for model explainability.

---

## 3. Matching Engine Worker (matching-agent)

Purpose
- Run the deterministic matching algorithm against queued orders and create executions.

Responsibilities
- Consume newly created orders (DB poll, job queue, or change stream) and run matching logic.
- Create `Execution` rows and update `Order` filled/remaining and status in a transaction.
- Emit `trade.executed` events for ledger & notifications.

Contracts & idempotency
- Execution creation must be idempotent: use a deterministic execution ID or dedupe by (newOrderId, counterpartyId, batchNonce).
- All updates must be done in DB transactions to prevent double-booking.

Safety
- Verify account balances/reservations before matching for buy orders.
- Apply tick-size and minimum lot validation.
- Rate-limit matches to control downstream load.

Observability
- Metrics: matches/sec, latency per order, partial/full fills counts.
- Logs: order id, instrument, match price, quantity, involved order ids.

---

## 4. Settlement & Ledger Agent (ledger-agent)

Purpose
- Apply trade executions to account balances, positions, and ledger entries.

Responsibilities
- Listen to `trade.executed` events or query `Execution` table for unprocessed rows.
- Within a DB transaction: debit/credit AccountBalance rows, update Position, write LedgerEntry and Transaction records, set execution as settled.
- Support retries and idempotency (mark ledger entries with executionId). 

Safety
- Use strong serializable transactions where supported, or implement optimistic locking.
- If settlement fails, mark executions with `settlementStatus` and alert operations.

---

## 5. Notification Agent (notify-agent)

Purpose
- Send emails, push notifications, and webhooks for fills, deposits, and alerts.

Responsibilities
- Subscribe to events: `trade.executed`, `deposit.completed`, `account.suspended`.
- Send templated notifications and record delivery attempts.
- Respect user preferences and rate limits.

Security
- Keep SMTP / push credentials in secrets manager.
- Do not leak PII in logs.

---

## 6. Reconciliation & Compliance Agent (reconcile-agent)

Purpose
- Periodically verify aggregate invariants and produce audit reports.

Responsibilities
- Reconcile total ledger vs positions vs exchange custody on scheduled jobs.
- Produce daily reports, flag mismatches, and create AuditLog entries.

Observability
- Run as a scheduled job, send alerts when discrepancies exceed thresholds.

---

## 7. Health & Heartbeat Agent (heartbeat-agent)

Purpose
- Emit regular health metrics and heartbeat to external monitoring.

Responsibilities
- Send service up/down pings, queue sizes, lag metrics, and essential KPIs to Prometheus/Grafana.

---

## Cross-cutting concerns

Authentication & Authorization
- Agents use machine/service accounts. Store credentials in environment or secrets manager and rotate regularly.
- All internal APIs require a signed token or mutual TLS in production.

Idempotency
- Design APIs to be idempotent for retries (use idempotency keys or dedupe logic).

Transactions
- Use DB transactions for multi-row updates across orders, executions, balances, and ledger entries.
- Prefer single transaction per execution settlement.

Observability
- Export Prometheus metrics: counters, histograms for latency, gauges for queue depth and balance totals.
- Structured logs (JSON) with correlation IDs (orderId, executionId, requestId).

Testing
- Unit tests for each agent algorithm.
- Integration tests with a local DB and a test message broker.
- Chaos tests for transient failures and retries.

Deployment & Scaling
- Package agents as Docker containers with health checks.
- Use separate scaling policies: matching-agent and ledger-agent require vertical scale/low latency; marketdata and recommender can scale horizontally.

Secrets
- Never store API keys in source. Use .env for local dev and a secrets manager (Azure KeyVault, AWS Secrets Manager) in prod.

Operational runbook (short)
1. Check `metrics` dashboards for agent-specific metrics.
2. On partial failures: inspect agent logs and restart the service; if settlement failed, run reconciliation job.
3. For data inconsistencies, escalate to the compliance team and freeze affected accounts.

---

## Example event flow (order -> trade -> settle)
1. User POST /api/orders -> creates Order row (status=PENDING).
2. matching-agent picks up order, finds counterparty, writes Execution(s) and updates order statuses.
3. matching-agent emits `trade.executed` events.
4. ledger-agent listens, applies balances and positions in a transaction, writes LedgerEntry and Transaction.
5. notify-agent sends user notifications.
6. reconcile-agent tallies results and records audit logs.

---

## Templates and utilities
- Use a shared `agents` library with helpers for:
  - HTTP client with retry/backoff
  - DB transactional helper
  - Event emitter and consumer wrapper
  - Idempotency key generator
  - Structured logger and metrics helper

---

## Local development notes
- Provide environment variables in `.env.example` (CMC_API_KEY, DATABASE_URL, QUEUE_URL).
- Run services with Docker Compose or local process manager.
- Include a `seed` script to create base currencies (USDT, BTC, ETH) and basic order side/type/status rows.

---

## Governance
- Approver: Ngoc Nam (operational sign-off for agent behavior and thresholds).
- Driver/Lead: Hieu Phan (implementation & on-call)
- Contributors: Hieu Phan, Trung Doan (support & maintenance)

---

Notes
- Keep agent implementations simple for the MVP: prioritize safety, idempotency, and audit trails over raw performance.
- Document each agent's configuration, SLOs, and runbook in `/docs` alongside this file.


# ADR-002: Backend Event Indexer Architecture

## Status

Accepted

## Context

ZizaLend needs to index on-chain Soroban contract events into a PostgreSQL
database so the frontend and API can query loan history, credit scores, and
pool state without hitting Stellar RPC directly. The indexer must handle:

- Continuous polling with configurable intervals
- Event deduplication
- Graceful recovery from RPC outages
- Multiple contract event types
- Connection pooling and rate limiting

## Decision

### Polling Architecture

The indexer uses a continuous-poll pattern rather than WebSocket subscriptions:

```
Soroban RPC
    ↓ (poll getEvents every INDEXER_POLL_INTERVAL_MS)
EventIndexer service
    ↓ (decode XDR, deduplicate, store)
PostgreSQL (contract_events + indexer_state tables)
    ↓ (query via REST API)
Frontend
```

Key design decisions:

1. **Poll, don't subscribe**: Soroban RPC does not support persistent
   WebSocket subscriptions for events. The polling approach is the canonical
   pattern recommended by Stellar docs.

2. **Cursor-based pagination**: The indexer uses Stellar RPC's cursor-based
   pagination to fetch events in batches (`INDEXER_BATCH_SIZE`, default 100).
   The `last_indexed_cursor` is persisted to resume from interruptions.

3. **Event ID deduplication**: Each event carries a unique `event_id` which
   is stored with a `UNIQUE` constraint. `ON CONFLICT DO NOTHING` prevents
   duplicates in the event of re-indexing.

4. **Quarantine for failures**: Events that fail decoding are moved to a
   `quarantine_events` table with the error message for later inspection and
   reprocessing after a hotfix.

5. **Separate status tracking**: The `indexer_state` table tracks the last
   processed ledger and cursor per contract, allowing independent progress
   tracking for each contract.

6. **Unified contract events table**: All contracts emit events into a single
   `contract_events` table (originally `loan_events`), with an `event_type`
   column distinguishing the event kind and a backward-compat view.

### Admin Operations

The indexer exposes admin API endpoints:
- `POST /api/admin/indexer/pause` — Pause polling (completes current cycle)
- `POST /api/admin/indexer/resume` — Resume from last position
- `POST /api/admin/indexer/reindex` — Re-index a specific ledger range
- `GET /api/admin/indexer/quarantine` — View failed events
- `POST /api/admin/indexer/quarantine/{id}/reprocess` — Retry a single event

### Health Monitoring

- `/health` endpoint reports basic application liveness
- `/health/deep` reports indexer lag (`current_ledger - last_indexed_ledger`)
  and marks as degraded when lag exceeds `INDEXER_HEALTH_LAG_LIMIT`

## Consequences

**Positive:**
- Simple, reliable polling pattern that works with Soroban RPC's limitations.
- Deduplication at the database level prevents data corruption.
- Quarantine table ensures no events are silently lost.
- Admin endpoints enable operational control without redeploying.

**Negative:**
- Polling introduces latency equal to the poll interval (default 30s).
- Stellar RPC only retains events for ~7 days — the indexer must be
  continuously running to avoid gaps.
- Polling consumes RPC quota even when no new events exist.

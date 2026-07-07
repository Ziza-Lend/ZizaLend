# API Idempotency

Write endpoints that mutate state (e.g. `/api/loans/:loanId/repay/build`)
support the `Idempotency-Key` request header. Sending the same key twice
within the 24-hour cache window returns an identical response without
re-executing side effects.

## Request header

```
Idempotency-Key: <client-generated-uuid>
```

Use a fresh UUID per logical operation. Re-use the same UUID only when
retrying after a network failure.

## Response headers

| Header | Values | Meaning |
|---|---|---|
| `X-Idempotency-Cache` | `HIT` | Response was served from the idempotency cache |
| `X-Idempotent-Replayed` | `true` / `false` | `true` = cached replay; `false` = fresh execution |

`X-Idempotent-Replayed` is always present on requests that include an
`Idempotency-Key`, regardless of whether the key was seen before. This
lets the frontend branch without checking two separate headers:

```ts
const replayed = response.headers.get("X-Idempotent-Replayed") === "true";
if (!replayed) {
  showSuccessToast("Repayment submitted");   // first execution
} else {
  // duplicate submission — silently ignore or show a softer message
}
```

## Cached status codes

Only `2xx` and `4xx` responses are cached. `5xx` responses are never
cached so that clients can safely retry transient server errors.

## TTL

The idempotency cache entry expires after **24 hours**.

## Out of scope

- Changing the cache backend or TTL (tracked separately).
- Replaying side effects — the cache stores and replays the HTTP
  response only; the underlying transaction is not re-executed.

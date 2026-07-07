# Webhook Integration Guide

ZizaLend can deliver real-time event notifications to external services via
webhooks. This guide covers everything an external integrator needs to
subscribe, receive, and verify webhook deliveries.

---

## Table of Contents

- [Creating a Subscription](#creating-a-subscription)
- [Supported Event Types](#supported-event-types)
- [Payload Examples](#payload-examples)
- [Delivery & Retry Semantics](#delivery--retry-semantics)
- [Circuit Breaker](#circuit-breaker)
- [Verifying HMAC Signatures](#verifying-hmac-signatures)
- [Subscriber Response Requirements](#subscriber-response-requirements)

---

## Creating a Subscription

**Endpoint:** `POST /api/webhooks/subscriptions`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <your-jwt-token>
```

**Request body:**

```json
{
  "url": "https://your-service.com/webhooks/ZizaLend",
  "events": ["loan_approved", "repayment_confirmed", "loan_defaulted"],
  "description": "My loan tracking service (optional)"
}
```

| Field       | Type     | Description                                          |
|-------------|----------|------------------------------------------------------|
| `url`       | string   | HTTPS endpoint that will receive POST requests       |
| `events`    | string[] | Array of [event types](#supported-event-types)       |
| `description` | string | Optional human-readable label                      |

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "sub_abc123",
    "url": "https://your-service.com/webhooks/ZizaLend",
    "events": ["loan_approved", "repayment_confirmed", "loan_defaulted"],
    "active": true,
    "createdAt": "2026-05-28T12:00:00.000Z"
  }
}
```

After creation the subscription is immediately active. No verification handshake
is required.

### Managing Subscriptions

| Method | Endpoint                              | Description            |
|--------|---------------------------------------|------------------------|
| GET    | `/api/webhooks/subscriptions`         | List all subscriptions |
| GET    | `/api/webhooks/subscriptions/:id`     | Get a single subscription |
| PUT    | `/api/webhooks/subscriptions/:id`     | Update events / URL    |
| DELETE | `/api/webhooks/subscriptions/:id`     | Delete a subscription  |

---

## Supported Event Types

| Event                  | Description                                   |
|------------------------|-----------------------------------------------|
| `loan_approved`        | A borrower's loan has been approved           |
| `repayment_due`        | A repayment is coming due soon                |
| `repayment_confirmed`  | A repayment was received and confirmed        |
| `loan_defaulted`       | A loan has been marked as defaulted           |
| `loan_liquidated`      | Collateral has been liquidated after default  |
| `score_changed`        | A borrower's credit score changed             |

---

## Payload Examples

Every delivery is a JSON POST with the following envelope:

```json
{
  "event": "<event_type>",
  "id": "<unique_delivery_id>",
  "timestamp": "2026-05-28T12:00:00.000Z",
  "data": { }
}
```

### `loan_approved`

```json
{
  "event": "loan_approved",
  "id": "evt_loan_42",
  "timestamp": "2026-05-28T12:00:00.000Z",
  "data": {
    "loanId": 42,
    "borrower": "GABCDEF...",
    "amount": "5000",
    "termMonths": 12
  }
}
```

### `repayment_confirmed`

```json
{
  "event": "repayment_confirmed",
  "id": "evt_repay_99",
  "timestamp": "2026-05-28T12:05:00.000Z",
  "data": {
    "loanId": 42,
    "borrower": "GABCDEF...",
    "amount": "450",
    "txHash": "a1b2c3d4..."
  }
}
```

### `loan_defaulted`

```json
{
  "event": "loan_defaulted",
  "id": "evt_default_7",
  "timestamp": "2026-05-28T12:10:00.000Z",
  "data": {
    "loanId": 42,
    "borrower": "GABCDEF...",
    "outstandingAmount": "3200"
  }
}
```

### `loan_liquidated`

```json
{
  "event": "loan_liquidated",
  "id": "evt_liq_3",
  "timestamp": "2026-05-28T12:15:00.000Z",
  "data": {
    "loanId": 42,
    "borrower": "GABCDEF...",
    "collateralSeized": true,
    "borrowerRefund": "150"
  }
}
```

### `repayment_due`

```json
{
  "event": "repayment_due",
  "id": "evt_due_21",
  "timestamp": "2026-05-28T12:00:00.000Z",
  "data": {
    "loanId": 42,
    "borrower": "GABCDEF...",
    "dueDate": "2026-06-01",
    "amount": "450"
  }
}
```

### `score_changed`

```json
{
  "event": "score_changed",
  "id": "evt_score_15",
  "timestamp": "2026-05-28T12:00:00.000Z",
  "data": {
    "userId": "GABCDEF...",
    "previousScore": 650,
    "newScore": 665,
    "reason": "on-time repayment"
  }
}
```

---

## Delivery & Retry Semantics

1. **Delivery method:** HTTP POST to the subscriber URL.
2. **Timeout:** The endpoint must respond within **10 seconds**.
3. **Retry policy:** Deliveries are retried with exponential backoff:
   - Retry 1: 10 seconds
   - Retry 2: 30 seconds
   - Retry 3: 1 minute
   - Retry 4: 5 minutes
   - Retry 5: 15 minutes
   - Retry 6: 30 minutes
   - Retry 7: 1 hour
4. **Max attempts:** 8 total (1 initial + 7 retries).
5. **Delivery window:** Events older than **24 hours** are not retried.
6. **Ordering:** Webhooks are delivered on a **best-effort** basis and may not
   arrive in the exact order events occurred.

---

## Circuit Breaker

If a subscriber endpoint fails to respond with a 2xx status for **5 consecutive
deliveries**, the subscription is automatically **deactivated** to avoid
wasting resources.

While deactivated:
- No further events are sent to the subscriber.
- The subscription status changes to `deactivated`.
- You can **re-activate** the subscription by calling
  `PUT /api/webhooks/subscriptions/:id` with `{ "active": true }`.

---

## Verifying HMAC Signatures

Each delivery includes an `X-ZizaLend-Signature` header containing an
HMAC-SHA256 signature of the **raw request body**.

**Header format:**
```
X-ZizaLend-Signature: sha256=<hex-encoded-hmac>
```

The value is `sha256=` followed by the lowercase hex-encoded HMAC-SHA256
digest computed over the raw request body (no timestamp prefix).

### Verification snippet (Node.js)

```typescript
import { createHmac, timingSafeEqual } from "node:crypto";

function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string,
): boolean {
  const expected =
    "sha256=" +
    createHmac("sha256", secret).update(rawBody).digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader ?? "");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
```

> ⚠️ **Important:** Always use `timingSafeEqual` (or your language's
> constant-time comparison) when verifying the signature to prevent timing
> attacks.

### Obtaining your secret

The signing secret is the **per-subscription secret** returned in the
response when you register the webhook subscription (see
[Creating a Subscription](#creating-a-subscription)). It is **not** a
global environment variable. Store it securely on your server and use it
to verify each incoming delivery.

See also: [docs/wiki/webhook-signatures.md](wiki/webhook-signatures.md)
for additional language examples.

---

## Subscriber Response Requirements

| Code    | Meaning                                      |
|---------|----------------------------------------------|
| 2xx     | Delivery accepted — no retry                 |
| 4xx     | Request rejected — permanent failure (no retry) |
| 5xx     | Server error — will be retried               |
| Timeout | Treated as a failure — will be retried       |

- **Respond within 10 seconds.** Slow responses are counted as failures.
- Returning any 2xx status (200, 201, 202, 204) acknowledges delivery.

---

## Need Help?

Contact the ZizaLend team or open an issue on GitHub for integration support.

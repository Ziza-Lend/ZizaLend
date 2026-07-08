# ADR-003: Authentication & Authorization Model

## Status

Accepted

## Context

ZizaLend needs to authenticate users and authorize API access. The key
requirements are:

1. **Non-custodial**: Users authenticate using their Stellar wallet, not
   a username/password stored on our servers.
2. **Role-based access**: Three roles — `admin`, `lender`, `borrower` — each
   with different scope sets.
3. **Stateless where possible**: Avoid server-side sessions for scalability.
4. **JWT revocation capability**: Support logout and immediate scope changes.
5. **SSE support**: Server-Sent Events need cookie-based auth since the
   EventSource API cannot set `Authorization` headers.

## Decision

### Two-Factor Authentication Design

**Primary: Challenge-Signature-JWT flow**

1. `GET /api/auth/challenge?publicKey=G…` — Server returns a one-time nonce
   message valid for 5 minutes.
2. Client signs the message with Stellar Ed25519 private key.
3. `POST /api/auth/verify` — Server verifies signature via
   `Keypair.verify`, resolves role for public key, and mints a JWT.
4. JWT is returned in JSON body **and** set as `httpOnly`, `SameSite=strict`
   cookie named `ZizaLend_jwt` (configurable via `JWT_COOKIE_NAME`).

**Secondary: API-key auth (for internal/admin tooling)**

`x-api-key` header with support for scoped keys (e.g.,
`admin:disputes:mysecretkey`). Key format:

| Format | Example | Grants |
|---|---|---|
| Legacy (no scope) | `mysecretkey` | All admin scopes |
| Scoped | `admin:disputes:mysecretkey` | Only `admin:disputes` |

### JWT Structure

```json
{
  "publicKey": "G…",
  "role": "borrower",
  "scopes": ["read:loans", "write:repayment", "read:score", …],
  "jti": "uuid",
  "iat": 1234567890,
  "exp": 1234567890 + 86400
}
```

### Scope-Based Authorization

Roles map to scope sets in `ROLE_SCOPES` (defined in `rbac.ts`):

| Role | Scopes |
|---|---|
| `admin` | `admin:all` |
| `lender` | `read:loans`, `read:pool` |
| `borrower` | `read:loans`, `write:repayment`, `read:score`, `read:notifications`, `write:notifications` |

Route groups declare required scopes. Middleware (`requireScopes`) checks
the JWT's embedded scopes against the route requirement.

### Scope Capping for Role Changes

On every request, middleware re-resolves the wallet's current role from
environment variables and **intersects** the token's embedded scopes with
what the current role allows. This means:

- Removing a wallet from `ADMIN_WALLETS` takes effect on the **next request**
  — the admin scope is stripped, and access is denied immediately.
- Scope capping never adds scopes (only removes), so purpose-limited
  sessions remain valid.

### JWT Revocation

JWT IDs (`jti`) can be blacklisted in Redis via `POST /api/auth/logout`.
The revocation check has a 250ms timeout and fails open (cache unavailability
does not block API access).

## Consequences

**Positive:**
- Non-custodial auth aligns with Web3 principles — no password storage, no
  session hijacking via database breach.
- Scope capping provides instant role-change propagation without session
  invalidation.
- Cookie + Bearer token dual transport supports both SSE and JS clients.
- JWT revocation via Redis blacklist supports explicit logout.

**Negative:**
- Challenge nonce valid for 5 minutes — client must complete the flow
  within that window.
- Scope capping reads wallet lists from environment variables (env vars
  require redeploy to change; future work may move this on-chain).
- Redis dependency for revocation — if Redis is down, logout does not take
  effect until TTL expiry.
- 24h JWT lifetime means long-lived sessions require re-authentication.

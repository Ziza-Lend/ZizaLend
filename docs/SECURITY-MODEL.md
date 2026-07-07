# ZizaLend Authentication & Authorization Model

This document describes the security model for the ZizaLend backend API: how
identities are established, how roles map to scopes, and which scope guard
protects each route group. See also [SECURITY.md](../SECURITY.md) for the
vulnerability-disclosure policy.

---

## Authentication flows

### 1. Challenge–signature–JWT (primary, for wallet users)

1. **GET /api/auth/challenge?publicKey=G…** — server returns a one-time nonce
   message valid for 5 minutes.
2. Client signs the message with the Stellar Ed25519 private key.
3. **POST /api/auth/verify** — server verifies the signature via
   `Keypair.verify`, resolves the role for that public key (see [Role
   resolution](#role-resolution) below), and mints a JWT.
4. The JWT is returned both in the JSON body and set as a `httpOnly`,
   `SameSite=strict` cookie named `ZizaLend_jwt` (overridable via
   `JWT_COOKIE_NAME` env var). The cookie is used for SSE/EventSource
   connections that cannot attach `Authorization` headers.
5. JWT lifetime: **24 hours** (`JWT_EXPIRES_IN = "24h"`).
   Secret: `JWT_SECRET` environment variable (required).

JWT payload shape (`JwtPayload` in `authService.ts`):

```ts
{
  publicKey: string;   // Stellar G… address
  role: UserRole;      // "admin" | "borrower" | "lender"
  scopes: string[];    // derived from role via ROLE_SCOPES
  iat: number;
  exp: number;
}
```

Subsequent requests supply the JWT via:
- `Authorization: Bearer <token>` header, or
- the `ZizaLend_jwt` cookie.

### 2. API-key authentication (for backend services / admin tooling)

Admin operations use `x-api-key: <key>` instead of JWTs. Keys are configured
in the `INTERNAL_API_KEY` environment variable as a comma-separated list.

Key formats:

| Format | Example | Grants |
|---|---|---|
| Legacy (no scope prefix) | `mysecretkey` | All admin scopes |
| Scoped | `admin:disputes:mysecretkey` | Only `admin:disputes` |

Available scopes: `admin:disputes`, `admin:indexer`, `admin:webhooks`,
`admin:loans`.

Implemented in `backend/src/middleware/auth.ts` (`requireApiKey`).

---

## Role resolution

`resolveRoleForWallet(publicKey)` in `backend/src/auth/rbac.ts`:

1. If the public key is in `ADMIN_WALLETS` (comma-separated env) → **admin**.
2. If the public key is in `LENDER_WALLETS` → **lender**.
3. Otherwise → **borrower**.

---

## Role-to-scope table

Defined in `ROLE_SCOPES` in `backend/src/auth/rbac.ts`:

| Role | Scopes granted |
|---|---|
| `admin` | `admin:all` |
| `lender` | `read:loans`, `read:pool` |
| `borrower` | `read:loans`, `write:repayment`, `read:score`, `read:notifications`, `write:notifications` |

> **Note:** `lender` does **not** have `write:pool`. Pool write endpoints
> (`build-deposit`, `build-withdraw`, `build-emergency-withdraw`, `submit`)
> require `write:pool`, which means lenders currently receive 403 on those
> routes. This is a known gap tracked in issue #1179.

---

## Route-group authorization map

### JWT-authenticated routes (`requireJwtAuth` + `requireScopes`)

| Route group | Role check | Required scope |
|---|---|---|
| `GET /api/pool/stats` | `requireLender` | `read:pool` |
| `GET /api/pool/depositor/:address` | `requireLender` | `read:pool` |
| `GET /api/pool/depositor/:address/yield-history` | `requireLender` | `read:pool` |
| `GET /api/pool/:token/share-price` | `requireLender` | `read:pool` |
| `POST /api/pool/build-deposit` | `requireLender` | `write:pool` |
| `POST /api/pool/build-withdraw` | `requireLender` | `write:pool` |
| `POST /api/pool/build-emergency-withdraw` | `requireLender` | `write:pool` |
| `POST /api/pool/submit` | `requireLender` | `write:pool` |
| `GET /api/loans/*` | — | `read:loans` |
| `GET /api/indexer/loans/*` | — | `read:loans` |
| `GET/POST /api/notifications` | — | `read:notifications` / `write:notifications` |
| `POST /api/remittances` | — | `write:remittances` |
| `GET /api/remittances` | — | `read:remittances` |

### API-key-authenticated routes (`requireApiKey(scope)`)

| Route | Required scope |
|---|---|
| `GET /api/admin/loan-disputes` | `admin:disputes` |
| `POST /api/admin/loan-disputes/:id/resolve` | `admin:disputes` |
| `POST /api/admin/loans/check-defaults` | `admin:loans` |
| `GET /api/admin/indexer/*` | `admin:indexer` |
| `GET /api/events/status` | `admin:indexer` |
| `GET /api/indexer/events/recent` | `admin:indexer` |
| `GET/POST/DELETE /api/indexer/webhooks/*` | `admin:webhooks` |
| `GET/POST/DELETE /api/admin/webhooks/*` | `admin:webhooks` |

---

## Auth middleware stack

```
backend/src/middleware/jwtAuth.ts   — requireJwtAuth, requireLender,
                                      requireBorrower, requireScopes
backend/src/middleware/auth.ts      — requireApiKey (API-key scoped access)
backend/src/services/authService.ts — generateJwtToken, verifyJwtToken,
                                      generateChallenge, verifySignature
backend/src/auth/rbac.ts            — ROLE_SCOPES, resolveRoleForWallet,
                                      resolveScopesForRole
```

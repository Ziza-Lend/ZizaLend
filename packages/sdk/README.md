# ZizaLend TypeScript SDK

Typed API client for the ZizaLend decentralized lending protocol. Provides full TypeScript coverage for all 50+ API endpoints with built-in auth, retry logic, and error handling.

## Installation

```bash
npm install @zizalend/sdk @zizalend/types
```

## Quick Start

```ts
import { Zizalend } from "@zizalend/sdk";

const api = new Zizalend({
  baseUrl: "http://localhost:3001/api/v1",
  timeoutMs: 30000,
});

// Authenticate with a Stellar wallet
const { token } = await api.auth.authenticate(publicKey, signTransaction);

// Fetch borrower loans
const loans = await api.loans.list({ status: "active" });

// Get pool stats
const stats = await api.pool.getStats();
```

## Configuration

```ts
interface ClientConfig {
  /** Base URL for the API (e.g. http://localhost:3001/api/v1) */
  baseUrl: string;
  /** JWT token — set after login or from persisted session */
  token?: string;
  /** API key for server-to-server admin endpoints */
  apiKey?: string;
  /** Request timeout in milliseconds (default: 60000) */
  timeoutMs?: number;
  /** Maximum retries for transient errors (default: 3) */
  maxRetries?: number;
}
```

### Authentication Modes

| Mode | Use Case | Config |
|------|----------|--------|
| **JWT (Browser)** | User-facing apps | `setToken()` after login |
| **API Key (Server)** | Admin automation, webhooks | Pass `apiKey` in constructor |
| **Unauthenticated** | Health checks, public endpoints | No token or key needed |

## API Modules

### Auth

```ts
// Challenge-response login with Stellar wallet
const { token } = await api.auth.authenticate(publicKey, signTransaction);

// Verify session
const session = await api.auth.verifySession();

// Refresh token (extends 24h window)
const { token: newToken } = await api.auth.refreshToken();

// Logout (adds JWT to server-side revocation list)
await api.auth.logout();
```

### Loans

```ts
// List borrower loans with filters
const { loans, pagination } = await api.loans.list({
  status: "active",
  page: 1,
  limit: 20,
});

// Get loan details
const loan = await api.loans.get(loanId);

// Get loan events (timeline)
const events = await api.loans.getEvents(loanId, { page: 1, limit: 50 });

// Get amortization schedule
const schedule = await api.loans.getAmortizationSchedule(loanId);

// Build unsigned loan request transaction
const { unsignedTxXdr } = await api.loans.buildLoanRequestTx({
  borrowerPublicKey,
  amount: 1000,
});

// Build repayment transaction
const { unsignedTxXdr } = await api.loans.buildRepayTx({
  loanId: 42,
  amount: 500,
});

// Build refinance transaction
const { unsignedTxXdr } = await api.loans.buildRefinanceTx({
  loanId: 42,
  newAmount: 800,
  newTerm: 90,
});

// Build extend transaction
const { unsignedTxXdr } = await api.loans.buildExtendTx({
  loanId: 42,
  extraLedgers: 4320,
});

// Submit signed transaction
const result = await api.loans.submitSignAndSubmit({
  unsignedTxXdr,
  signedTxXdr,
});

// Cancel pending loan
await api.loans.cancelLoan(loanId);

// Get loan configuration
const config = await api.loans.getConfig();
```

### Pool (Lending Pool)

```ts
// Get pool statistics
const stats = await api.pool.getStats();
// => { totalDeposits, utilizationRate, apy, activeLoansCount, sharePrice }

// Get depositor portfolio
const portfolio = await api.pool.getDepositorPortfolio(address);
// => { depositAmount, shares, sharePercent, estimatedYield }

// Get share price
const { sharePrice } = await api.pool.getSharePrice();

// Build deposit transaction
const { unsignedTxXdr } = await api.pool.buildDepositTx({
  providerPublicKey: address,
  tokenAddress: USDC_CONTRACT,
  amount: 500,
});

// Build withdraw transaction
const { unsignedTxXdr } = await api.pool.buildWithdrawTx({
  providerPublicKey: address,
  tokenAddress: USDC_CONTRACT,
  shares: 100,
});

// Build emergency withdraw (bypasses cooldown)
const { unsignedTxXdr } = await api.pool.buildEmergencyWithdrawTx({
  providerPublicKey: address,
  tokenAddress: USDC_CONTRACT,
  shares: 100,
});

// Get yield history
const history = await api.pool.getYieldHistory(address);

// Get withdrawal cooldown
const cooldown = await api.pool.getWithdrawalCooldown();
```

### Scores

```ts
// Get user score
const { score, tier } = await api.scores.get(address);

// Get score breakdown (component analysis)
const breakdown = await api.scores.getBreakdown(address);
// => { baseScore, repaymentBonus, consistencyFactor, latePenalties }

// Get score history (up to 50 entries)
const history = await api.scores.getHistory(address);

// Trigger score reconciliation (admin)
await api.scores.reconcile(address);
```

### Notifications

```ts
// List notifications with filters
const { notifications, pagination, unreadCount } = await api.notifications.list({
  status: "unread",
  type: "repayment_due",
  page: 1,
  limit: 20,
});

// Mark as read
await api.notifications.markRead(notificationId);

// Mark all as read
await api.notifications.markAllRead();

// Get notification preferences
const prefs = await api.notifications.getPreferences();

// Update preferences
await api.notifications.updatePreferences({
  emailEnabled: true,
  smsEnabled: false,
  digestFrequency: "weekly",
  perTypeOverrides: {
    loan_approved: true,
    repayment_due: true,
    score_changed: false,
  },
});
```

### Remittances

```ts
// List remittances with filters
const { remittances, pagination } = await api.remittances.list({
  status: "completed",
  page: 1,
  limit: 20,
});

// Get remittance by ID
const remittance = await api.remittances.get(remittanceId);

// Create a remittance
await api.remittances.create({
  recipientAddress: "GABCDEF...",
  amount: 500,
  fromCurrency: "USD",
  toCurrency: "PHP",
  memo: "Family support",
});
```

### Transactions

```ts
// List recent transactions
const { transactions, pagination } = await api.transactions.list({
  type: "repayment",
  page: 1,
  limit: 20,
});
```

### Events (SSE Streaming)

```ts
// Stream loan events in real-time
const stream = api.events.stream({ eventTypes: ["LoanRepaid", "LoanDefaulted"] });

stream.onMessage((event) => {
  console.log("New event:", event.eventType, event.loanId);
});

stream.onError((error) => {
  console.error("Stream error:", error);
});

// Close the stream
stream.close();

// Get event stream status
const status = await api.events.getStreamStatus();
```

### Indexer (Admin)

```ts
// Get indexer status
const status = await api.indexer.getStatus();
// => { lastIndexedLedger, lagLedgers, currentLedger, isSynced }

// List webhook subscriptions
const subs = await api.indexer.listWebhookSubscriptions();

// Create webhook subscription
await api.indexer.createWebhookSubscription({
  callbackUrl: "https://example.com/webhooks",
  eventTypes: ["LoanRepaid", "LoanDefaulted"],
  secret: "hmac-secret-key",
});

// Trigger reindex (admin)
await api.indexer.reindex({ fromLedger: 1000, toLedger: 2000 });

// Run default check (admin)
await api.indexer.runDefaultCheck();
```

### Admin

```ts
// List audit logs
const { entries, pagination } = await api.admin.listAuditLogs({
  actor: "GADMIN...",
  page: 1,
});

// List loan disputes
const disputes = await api.admin.listDisputes({ status: "open" });

// Resolve a dispute
await api.admin.resolveDispute(disputeId, {
  resolution: "approved",
  adminNote: "Borrower provided proof of repayment",
});
```

### Simulation

```ts
// Simulate remittance history
const result = await api.simulation.simulatePayment({
  userId: "GABC...",
  amount: 500,
  frequency: "monthly",
  months: 12,
});
// => { projectedScore, confidenceLevel, recommendations }
```

### Health

```ts
// Basic health check
const health = await api.health.check();

// Deep health (includes DB, Redis, Stellar RPC, indexer lag)
const deep = await api.health.deepCheck();

// Version info
const version = await api.health.version();
// => { gitSha, builtAt, nodeVersion, contracts }
```

### User

```ts
// Get user profile
const profile = await api.user.getProfile(address);

// Update profile
await api.user.updateProfile({
  displayName: "Alice",
  email: "alice@example.com",
});
```

## Error Handling

```ts
import { ApiError } from "@zizalend/sdk";

try {
  const loans = await api.loans.list();
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`API Error ${error.statusCode}: ${error.message}`);

    if (error.isAuthError) {
      // Redirect to login
    } else if (error.isRateLimited) {
      // Wait and retry with exponential backoff
    } else if (error.isValidationError) {
      // Show field-level errors
      console.error("Invalid field:", error.field);
    }
  }
}
```

### Retry Behavior

The client automatically retries on transient failures (HTTP 429, 502, 503, 504) and network errors, with exponential backoff. Configure via `maxRetries` (default: 3).

## Event Streaming

The SDK supports real-time Server-Sent Events (SSE) for live updates:

```ts
const stream = api.events.stream();

const unsubscribe = stream.onMessage((event) => {
  console.log("Event:", event);
});

// Later:
unsubscribe();
stream.close();
```

The stream automatically reconnects on disconnection with exponential backoff.

## Server-to-Server Usage

For backend services, use API key authentication:

```ts
const adminClient = new Zizalend({
  baseUrl: "http://backend:3001/api/v1",
  apiKey: process.env.INTERNAL_API_KEY,
});

// Admin-only endpoints
await adminClient.indexer.reindex({ fromLedger: 0 });
await adminClient.admin.resolveDispute(disputeId, { resolution: "approved" });
```

## TypeScript

The SDK is fully typed. Import types directly:

```ts
import type {
  BorrowerLoan,
  PoolStats,
  UserScore,
  Notification,
  Remittance,
} from "@zizalend/sdk";
```

`@zizalend/types` provides generated types from the OpenAPI 3.0 spec. The SDK re-exports these with domain-specific type aliases for convenience.

## Related Packages

| Package | Description |
|---------|-------------|
| `@zizalend/sdk` | Typed API client (this package) |
| `@zizalend/types` | Auto-generated OpenAPI types |

## License

ISC License — see LICENSE file for details.

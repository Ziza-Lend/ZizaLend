# Credit Scoring Model

## Overview

ZizaLend transforms remittance history into a credit score that determines borrowing ability. The score is stored both on-chain (on the RemittanceNFT contract) and in the off-chain database, with periodic reconciliation between the two.

**Score Range:** 300 (poor) – 850 (excellent)

---

## Formula

```
rawScore = BASE_SCORE + SUM(event_deltas) - SUM(decay_penalties)
finalScore = CLAMP(rawScore, MIN_SCORE, MAX_SCORE)
```

Where:

| Constant | Value | Description |
|----------|-------|-------------|
| `BASE_SCORE` | 500 | Starting score for new users |
| `MIN_SCORE` | 300 | Floor — no score can fall below this |
| `MAX_SCORE` | 850 | Ceiling — no score can exceed this |

### Event Deltas

| Event | Delta | Description |
|-------|-------|-------------|
| `LoanRepaid` | **+10** | On-time repayment increases the score |
| `LoanDefaulted` | **-20** | Default penalizes the score |

These deltas are configurable via the Soroban contract's `getScoreConfig()` method, which currently returns `{ repaymentDelta: 10, defaultPenalty: 20 }`.

### Example

A borrower with the following history:

1. **Mint NFT & start** → score = 500
2. **3 on-time repayments** → score = 500 + 30 = 530
3. **2 months of inactivity** → score = 530 − 10 = 520
4. **1 default** → score = 520 − 20 = 500

---

## Score Decay

Borrowers who stop repaying see their score degrade over time to prevent stale credit profiles from being used indefinitely.

| Parameter | Value | Description |
|-----------|-------|-------------|
| `DECAY_PER_MONTH` | 5 points | Score reduction per 30-day period of inactivity |
| `INACTIVITY_THRESHOLD` | 30 days | No repayments in the last 30 days triggers decay |
| `MIN_SCORE` | 300 | Decay stops at the floor |

**Formula:**

```
monthsInactive = FLOOR(daysSinceLastRepayment / 30)
decay = MAX(1, monthsInactive) × DECAY_PER_MONTH
newScore = MAX(MIN_SCORE, currentScore − decay)
```

The decay job runs daily via a cron scheduler (`SCORE_DECAY_CRON`, default: `0 0 * * *`).

---

## Score Tiers & Loan Terms

The credit score maps to interest rate tiers. Borrowers with higher scores qualify for better rates.

| Tier | Score Range | Interest Rate | Description |
|------|------------|---------------|-------------|
| **Seed** | 300–400 | 15% | New or recovering borrowers |
| **Bronze** | 401–550 | 12% | Building credit history |
| **Silver** | 551–700 | 9% | Established repayment history |
| **Gold** | 701–800 | 7% | Strong credit profile |
| **Platinum** | 801–850 | 5% | Excellent credit |

Tier thresholds and interest rates are configured via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `LOAN_MIN_SCORE` | 300 | Minimum score to qualify for any loan |
| `LOAN_MAX_AMOUNT` | 100,000 | Maximum loan amount (in pool tokens) |
| `LOAN_INTEREST_RATE_PERCENT` | 12 | Base annual interest rate |
| `CREDIT_SCORE_THRESHOLD` | 600 | Score above which better rates unlock |

---

## On-Chain Storage

Credit scores are stored on the RemittanceNFT Soroban contract. Each borrower's score is:

- **Written** when a `ScoreUpd` event is emitted by the contract
- **Read** via `sorobanService.getOnChainCreditScore(userId)` for reconciliation
- **Minted** into the borrower's RemittanceNFT at initialization

---

## Off-Chain Storage

The off-chain `scores` table mirrors the on-chain state and powers API queries:

```sql
-- Simplified schema
CREATE TABLE scores (
  user_id       TEXT PRIMARY KEY,
  current_score INTEGER NOT NULL DEFAULT 500
                    CHECK (current_score >= 300 AND current_score <= 850),
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Key Operations

| Operation | Description |
|-----------|-------------|
| `updateUserScoresBulk` | Apply deltas from events (repayments, defaults) atomically within the same DB transaction. Called by the Event Indexer. |
| `setAbsoluteUserScoresBulk` | Overwrite scores with authoritative on-chain values during reconciliation. Used when the DB has drifted from contract state. |

### Score Reconciliation

A scheduled service (`ScoreReconciliationService`) periodically compares on-chain and off-chain scores:

1. Fetches all active borrowers (those with open loans)
2. For each borrower, compares `current_score` (DB) with `getOnChainCreditScore()` (contract)
3. If a divergence exceeds the `SCORE_RECONCILIATION_AUTOCORRECT_THRESHOLD` (default: 50 points), and auto-correction is enabled, the DB score is overwritten with the on-chain value

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `SCORE_RECONCILIATION_INTERVAL_MS` | 3,600,000 (1 hour) | How often reconciliation runs |
| `SCORE_RECONCILIATION_BATCH_SIZE` | 25 | Borrowers processed per batch |
| `SCORE_RECONCILIATION_MAX_BORROWERS_PER_RUN` | 500 | Max borrowers checked per run |
| `SCORE_RECONCILIATION_AUTOCORRECT_ENABLED` | false | Whether to auto-fix divergences |
| `SCORE_RECONCILIATION_AUTOCORRECT_THRESHOLD` | 50 | Minimum point difference to auto-correct |

Auto-correction is **disabled by default** to prevent automated overwrites during contract migrations or upgrades.

---

## Sybil Resistance

The scoring model mitigates self-dealing (sending funds to oneself to inflate the score) through:

1. **Remittance verification**: Only repayments on real loans affect the score. A borrower must have an approved loan (via the LoanManager contract) to generate scoring events.
2. **Score decay**: Inflated scores that aren't backed by ongoing loan activity decay back toward the baseline.
3. **On-chain anchoring**: The canonical score lives on the Stellar contract, making it publicly auditable and resistant to off-chain manipulation.

---

## Future Improvements

- **Weighted scoring**: Incorporate remittance volume, frequency, and recipient diversity
- **Multi-asset scoring**: Support scoring based on stablecoin holdings, LP positions, and other DeFi activity on Stellar
- **External credit data**: Integrate with on-chain reputation protocols for additional data points
- **Dynamic tiers**: Adjust tier thresholds algorithmically based on pool utilization and default rates

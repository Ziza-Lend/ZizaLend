# ADR-001: Smart Contract Architecture & Share-Based Accounting

## Status

Accepted

## Context

ZizaLend's on-chain logic is split across four Soroban smart contracts:

1. **RemittanceNFT** — Credit scoring & identity
2. **LoanManager** — Loan lifecycle management
3. **LendingPool** — Liquidity pool & yield distribution
4. **MultisigGovernance** — Admin transfer with timelock

The lending pool initially used an accumulator-based yield model (tracking
`rewardDebt`, `accYieldPerDeposit`, per-user `claimableYield`). This approach
had several drawbacks:

- **Complexity**: Every deposit/withdraw required updating accumulator state,
  creating and testing many edge cases.
- **Gas cost**: Per-user yield snapshots on every state-changing operation.
- **Borrow semantics**: Accrued yield was not automatically reflected in
  withdrawal amounts — lenders had to explicitly claim yield in a separate step.

## Decision

### Share-Based (LP Token) Accounting

Replace the accumulator model with a share-based (LP token) accounting system:

- **Deposits mint shares**: When a user deposits `amount`, they receive
  `amount * totalShares / totalAssets` shares, preserving the exchange rate
  for existing holders.
- **Withdrawals burn shares**: Users burn shares and receive
  `shares * totalAssets / totalShares` assets back — automatically including
  any yield that has accrued since deposit.
- **No separate claim step**: Yield is implicit in the share price. Transfer
  assets into the pool (loan repayments), and all depositors' shares
  appreciate proportionally.

Key design decisions:

1. **First depositor gets 1:1 shares**: The first depositor always receives
   a 1-for-1 allocation to bootstrap the pool.
2. **Multi-token pools**: A single contract instance serves multiple token
   pools keyed by `(token) → state`, reducing deployment overhead.
3. **Withdrawal cooldown**: Configurable ledger-based cooldown between deposit
   and withdrawal (default 1440 ledgers ~24h) to prevent rapid deposit/withdraw
   attacks.
4. **Emergency withdraw bypass**: Bypasses pause and cooldown for safety.
5. **Max pool size**: Optional per-token cap on total deposits.
6. **Pausability**: Admin can pause deposits and standard withdrawals.
7. **Utilisation tracking**: `PoolStats.utilization_bps` reports the fraction
   of tracked principal deployed in active loans.

### Four-Contract Split

| Contract | Responsibility | Upgradeability |
|---|---|---|
| RemittanceNFT | Score storage, mint/burn/transfer, minter authorization | `upgrade()` admin-only |
| LoanManager | Loan lifecycle (request→approve→repay→default→liquidate), collateral, score integration | `upgrade()` admin-only |
| LendingPool | Deposit/withdraw, share accounting, yield accrual | `upgrade()` admin-only |
| MultisigGovernance | Timelocked admin transfer with multi-sig approvals | `upgrade()` admin-only |

Each contract calls the others via cross-contract invocation:
- `LoanManager → NftClient`: Check/update scores, seize collateral
- `LoanManager → PoolClient`: Check paused state
- `LoanManager → TokenClient`: Transfer funds to/from pool
- `Governance → LendingPool.set_admin()`: Multi-sig admin transfer

This separation allows independent upgrades and testing.

## Consequences

**Positive:**
- Significantly simpler yield math — no accumulator state to maintain.
- Gas-efficient: One division per deposit/withdraw instead of per-user snapshot.
- Automatic yield inclusion on withdrawal — better UX.
- Each contract has a single, well-defined responsibility.

**Negative:**
- Share-based accounting means depositors cannot see "how much yield" they
  earned without comparing current asset value to their own cost basis.
- Constant-product invariant only holds when external token transfers into
  the pool are atomic (loan repayments go through LoanManager).

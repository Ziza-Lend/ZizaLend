# ZizaLend Lending Pool Contract

A share-based (LP token) liquidity pool serving multiple token markets from a single contract instance.

## Architecture

- **Share-based accounting**: Every deposit mints LP shares at the current exchange rate. Yield is implicit in the share price — no separate `claim` step required.
- **Multi-token support**: One contract instance manages independent pools for different token addresses.
- **Withdrawal cooldown**: Configurable per-token delay (in ledgers) between deposit and withdrawal.
- **Minimum hold time**: 1-ledger minimum prevents flash-loan-style deposit/withdraw cycles in the same transaction.
- **Dust collection**: Accumulated rounding truncations from share/asset conversions are tracked and reclaimable by the admin.
- **Emergency pause**: Admin can pause deposits/withdrawals; `emergency_withdraw` bypasses both pause and cooldown.
- **Admin governance**: Two-step admin transfer (`propose` + `accept`) and immediate `set_admin`.
- **Upgradeable**: WASM-hash replacement with version tracking.

## Key Invariants

1. `total_pool_assets = idle_balance + total_outstanding`
2. `shares × total_assets / total_shares` always equals the depositor's proportional claim (including yield).
3. First depositor always receives a 1:1 share-to-asset allocation.
4. Subsequent depositors cannot dilute existing holders.
5. Share price is monotonic non-decreasing (yield can only increase it).
6. `TotalDeposits` can never exceed `MaxPoolSize` when the cap is set.
7. Withdrawals can only reduce the idle balance — `total_outstanding` is only modified by `adjust_outstanding`.

## Public Functions

| Function | Description |
|----------|-------------|
| `initialize(admin)` | One-time initialisation |
| `deposit(provider, token, amount)` | Deposit tokens, receive LP shares |
| `withdraw(provider, token, shares)` | Redeem shares for underlying assets |
| `emergency_withdraw(provider, token, shares)` | Bypass pause and cooldown |
| `collect_dust(token)` | Admin reclaims accumulated rounding dust |
| `set_max_pool_size(token, max)` | Set deposit cap (0 = unlimited) |
| `set_withdrawal_cooldown(ledgers)` | Configure cooldown period |
| `pause() / unpause()` | Emergency controls |
| `propose_admin(new_admin) / accept_admin()` | Two-step admin transfer |
| `set_admin(new_admin)` | Immediate admin transfer |
| `upgrade(new_wasm_hash)` | Contract upgrade |

## View Functions

| Function | Returns |
|----------|---------|
| `get_share_price(token)` | Current LP share price (1_000_000 = 1.0) |
| `get_deposit(provider, token)` | Underlying asset value of LP shares |
| `get_shares(provider, token)` | Raw LP share balance |
| `get_depositor_yield(provider, token)` | `(shares, current_asset_value)` |
| `get_pool_stats(token)` | PoolStats struct with utilisation |
| `get_total_deposits(token)` | Total tracked principal |
| `get_total_shares(token)` | Total LP shares outstanding |
| `get_depositor_count(token)` | Unique depositor count |
| `get_accumulated_dust()` | Current rounding dust balance |
| `get_max_pool_size(token)` | Deposit cap |
| `get_withdrawal_cooldown()` | Current cooldown period |
| `get_withdrawal_available_at(provider, token)` | Earliest withdrawal ledger |
| `get_withdraw_cooldown_left(provider, token)` | Ledgers remaining |

## Events

- `Deposit(provider, token, amount, shares)`
- `Withdraw(provider, token, amount, shares)`
- `YieldDistributed(token, amount)`
- `DustCollected(amount)`
- `DepositCapUpdated(token, old_cap, new_cap)`
- `WithdrawalCooldownUpdated(old, new)`
- `PoolPaused / PoolUnpaused`
- `AdminProposed / AdminTransferred`
- `ContractUpgraded`

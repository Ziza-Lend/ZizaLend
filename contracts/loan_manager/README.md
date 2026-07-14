# ZizaLend Loan Manager Contract

The core orchestrator governing the full lifecycle of collateralised loans.

## Architecture

- **CEI pattern**: Loan status committed to storage _before_ any cross-contract token transfer, preventing reentrancy.
- **Proportional repayment**: Payments split across principal, interest, and late fees based on each component's share of total debt — no strict waterfall.
- **High-precision interest**: 1_000_000 precision factor with residual tracking prevents rounding value loss on micro loans.
- **Collateralised lending**: Per-loan collateral deposits released on full repayment or seized on default.
- **Extension mechanism**: Borrowers can push due dates (up to 3×) for a 1% fee.
- **Refinancing**: Adjust principal/term with admin approval, settling accruals at the point of refinance.
- **Liquidation**: Triggers below configurable collateral ratio; bonus ≤20% of collateral.

## Cross-Contract Dependencies

| Contract                  | Role                                                     |
| ------------------------- | -------------------------------------------------------- |
| **LendingPool**           | Liquidity source for disbursement, repayment destination |
| **RemittanceNFT**         | Credit-scoring gate for loan eligibility                 |
| **RateOracle** (optional) | External rate feed for risk-adjusted pricing             |

## Key Invariants

1. **Total debt cap**: `principal + interest + late fees ≤ 2 × original_principal`
2. **CEI for repayments**: Status → `Repaid` before token transfer prevents reentrancy.
3. **Proportional split**: `principal_payment + interest_payment + late_fee_payment = amount`.
4. **Borrower cap**: Pending loans count against the limit.
5. **Late fee base**: Fees on _original_ principal, not remaining balance.
6. **Default is non-reversible**: Once `Defaulted`, no repayment or extension.
7. **Oracle bounds**: Out-of-range oracle values fall back to configured default rate.
8. **Collateral lifecycle**: Deposit only for Approved loans; release requires Repaid/Defaulted/Cancelled/Rejected.

## Loan State Machine

```
Pending → Approved → Repaid
                → Defaulted
                → Liquidated
Pending → Cancelled (by borrower)
Pending → Rejected (by admin)
Repaid/Defaulted/Liquidated/Cancelled/Rejected → Purged (by admin)
```

## Configuration Parameters

| Parameter             | Default                   | Description                                       |
| --------------------- | ------------------------- | ------------------------------------------------- |
| Interest Rate         | 1200 bps (12%)            | Base interest rate                                |
| Term                  | 17,280 ledgers (~30 days) | Default loan term                                 |
| Min Score             | 500                       | Minimum credit score for loans                    |
| Late Fee Rate         | 500 bps (5%)              | Late fee accrual rate                             |
| Max Late Fee Cap      | 2500 bps (25%)            | Hard cap on late fee rate                         |
| Grace Period          | 4,320 ledgers             | Window after due date before late fees            |
| Default Window        | 17,280 ledgers            | Window after due date before default              |
| Max Loan Amount       | 50,000 units              | Per-loan principal cap                            |
| Max Loans/Borrower    | 3                         | Active loan limit per borrower                    |
| Min Repayment         | 100 units                 | Minimum partial repayment size                    |
| Max Extensions        | 3                         | Max due-date pushes per loan                      |
| Extension Fee         | 100 bps (1%)              | Fee on remaining principal per extension          |
| Liquidation Threshold | 15,000 bps (150%)         | Collateral ratio below which liquidation triggers |
| Liquidation Bonus     | 500 bps (5%)              | Bonus to liquidator (max 20%)                     |

## Events

30+ events covering all state transitions, configuration changes, and admin actions.

/**
 * Add a compound index on contract_events (address, event_type, ledger_closed_at)
 * to support the status + date-range filters added to GET /loans/borrower/:borrower.
 *
 * The getBorrowerLoans query filters rows by `address = $1`, then aggregates
 * per loan_id, and applies optional WHERE clauses on the computed `status`
 * and `approved_at` (ledger_closed_at of the LoanApproved event).
 * This index keeps those scans efficient for borrowers with long histories.
 *
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {void}
 */
export const up = (pgm) => {
  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_contract_events_address_type_closed_at
      ON contract_events (address, event_type, ledger_closed_at)
      WHERE address IS NOT NULL;
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {void}
 */
export const down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_contract_events_address_type_closed_at;
  `);
};

/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  // Add composite index for filtering by sender, status, and created_at
  pgm.createIndex('remittances', ['sender_id', 'status', 'created_at'], {
    name: 'idx_remittances_sender_status_created',
  });

  // Add index for date range queries
  pgm.createIndex('remittances', ['sender_id', 'created_at'], {
    name: 'idx_remittances_sender_created',
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropIndex('remittances', ['sender_id', 'status', 'created_at'], {
    name: 'idx_remittances_sender_status_created',
  });
  pgm.dropIndex('remittances', ['sender_id', 'created_at'], {
    name: 'idx_remittances_sender_created',
  });
};

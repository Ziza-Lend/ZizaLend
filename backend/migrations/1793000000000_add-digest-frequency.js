/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.addColumns('user_notification_preferences', {
    digest_frequency: {
      type: 'varchar(20)',
      notNull: true,
      default: 'off',
      check: "digest_frequency IN ('off', 'daily', 'weekly')",
      comment: 'Digest mode for repayment reminders: off, daily, or weekly',
    },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropColumns('user_notification_preferences', ['digest_frequency']);
};

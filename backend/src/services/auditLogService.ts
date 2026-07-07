import { query } from '../db/connection.js';

export interface AuditLogFilters {
  actor?: string;
  action?: string;
  from?: string;
  to?: string;
  cursor?: string;
  limit?: number;
  withTotal?: boolean;
}

export async function getAuditLogs(filters: AuditLogFilters) {
  const { actor, action, from, to, cursor, limit = 25, withTotal } = filters;

  const conditions: string[] = [];
  const values: unknown[] = [];

  if (actor) {
    conditions.push(`actor = $${values.length + 1}`);
    values.push(actor);
  }

  if (action) {
    conditions.push(`action = $${values.length + 1}`);
    values.push(action);
  }

  if (from) {
    conditions.push(`created_at >= $${values.length + 1}`);
    values.push(from);
  }

  if (to) {
    conditions.push(`created_at <= $${values.length + 1}`);
    values.push(to);
  }

  if (cursor) {
    conditions.push(`id < $${values.length + 1}`);
    values.push(cursor);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  values.push(limit + 1);
  const result = await query(
    `SELECT * FROM audit_logs ${whereClause} ORDER BY created_at DESC LIMIT $${values.length}`,
    values,
  );

  const rows = result.rows as Array<Record<string, unknown>>;
  const hasNext = rows.length > limit;
  const data = rows.slice(0, limit);

  let total: number | undefined;
  if (withTotal === true) {
    const countResult = await query('SELECT COUNT(*) as count FROM audit_logs');
    total = Number((countResult.rows[0] as Record<string, unknown>)?.count ?? 0);
  }

  return {
    data,
    nextCursor: hasNext ? String((data[data.length - 1] as Record<string, unknown>).id) : null,
    total,
  };
}

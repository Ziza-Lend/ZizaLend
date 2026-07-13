"use client";

import { TxHashLink } from "./TxHashLink";
import type { LoanEvent } from "../../hooks/useApi";

interface LoanTimelineProps {
  events: LoanEvent[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

const EVENT_LABELS: Record<string, string> = {
  LoanRequested: "Loan requested",
  LoanApproved: "Loan approved",
  LoanRepaid: "Repayment made",
  LoanDefaulted: "Loan defaulted",
  Seized: "Collateral seized",
};

export function LoanTimeline({ events }: LoanTimelineProps) {
  if (events.length === 0) {
    return <p className="text-sm text-[var(--text-secondary)]">No events yet.</p>;
  }

  return (
    <ol className="relative space-y-0">
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        return (
          <li key={`${event.type}-${event.timestamp}-${index}`} className="flex gap-3">
            {/* Timeline spine */}
            <div className="flex flex-col items-center">
              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-violet-500 ring-2 ring-[var(--bg-primary)]" />
              {!isLast && <span className="mt-1 flex-1 w-px bg-[var(--border-default)]" />}
            </div>

            {/* Event card */}
            <div className={`pb-4 w-full ${isLast ? "pb-0" : ""}`}>
              <div className="rounded-xl border border-[var(--border-default)] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {EVENT_LABELS[event.type] ?? event.type}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {new Date(event.timestamp).toLocaleString()}
                  </p>
                </div>
                {Number(event.amount) > 0 && (
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    Amount: {formatCurrency(Number(event.amount))}
                  </p>
                )}
                {event.txHash && (
                  <div className="mt-1.5">
                    <TxHashLink txHash={event.txHash} />
                  </div>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

"use client";

import { useState } from "react";
import { FinancialPerformanceDashboard } from "../../components/dashboards/FinancialPerformanceDashboard";
import { ErrorBoundary } from "../../components/global_ui/ErrorBoundary";
import { useWalletStore, selectWalletAddress } from "../../stores/useWalletStore";

type ViewType = "borrower" | "lender";

export default function AnalyticsPage() {
  const [view, setView] = useState<ViewType>("borrower");
  const address = useWalletStore(selectWalletAddress);
  const userId = address ?? "demo_user";

  return (
    <main className="min-h-screen p-8 lg:p-12 max-w-7xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">Analytics Dashboard</h1>
        <p className="text-[var(--text-secondary)] mt-2">
          Visualize your financial performance with interactive charts
        </p>
      </header>

      <div className="flex gap-2" role="group" aria-label="Analytics view selector">
        {(["borrower", "lender"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-5 py-2 rounded-full text-sm font-semibold capitalize transition-all ${
              view === v
                ? "bg-violet-600 text-white shadow-[var(--shadow-glow)]"
                : "bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"
            }`}
            aria-pressed={view === v}
          >
            {v}
          </button>
        ))}
      </div>

      <ErrorBoundary scope="analytics dashboard" variant="section">
        <FinancialPerformanceDashboard
          userId={userId}
          userType={view}
          walletAddress={address ?? undefined}
        />
      </ErrorBoundary>
    </main>
  );
}

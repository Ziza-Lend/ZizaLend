"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

const localeSegments = new Set(["en", "es", "tl"]);

const segmentLabels: Record<string, string> = {
  activity: "Activity",
  analytics: "Analytics",
  borrower: "Borrower",
  dashboard: "Dashboard",
  kingdom: "Kingdom",
  loans: "Loans",
  lend: "Lend",
  "request-loan": "Request Loan",
  "send-remittance": "Send Remittance",
  wallet: "Wallet",
  repay: "Repayment",
  "transaction-preview-demo": "Transaction Preview",
  "ui-demo": "UI Demo",
};

function toTitleCase(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getSegmentLabel(segment: string) {
  if (segmentLabels[segment]) {
    return segmentLabels[segment];
  }

  if (/^\d+$/.test(segment)) {
    return `#${segment}`;
  }

  return toTitleCase(segment);
}

function getContextualLabel(segment: string, previousSegment?: string, isLast = false) {
  if (isLast && previousSegment && ["loans", "repay"].includes(previousSegment)) {
    return `Loan #${segment}`;
  }

  return getSegmentLabel(segment);
}

export function Breadcrumbs() {
  const pathname = usePathname();

  if (!pathname || pathname === "/") {
    return null;
  }

  const allSegments = pathname.split("/").filter(Boolean);
  const locale = allSegments[0] && localeSegments.has(allSegments[0]) ? allSegments[0] : null;
  const segments = locale ? allSegments.slice(1) : allSegments;

  if (segments.length === 0) {
    return null;
  }

  const baseHref = locale ? `/${locale}` : "/";
  const items = segments.map((segment, index) => {
    const fullSegments = locale
      ? [locale, ...segments.slice(0, index + 1)]
      : segments.slice(0, index + 1);
    const href = `/${fullSegments.join("/")}`;
    const isCurrent = index === segments.length - 1;

    return {
      href,
      isCurrent,
      label: getContextualLabel(segment, segments[index - 1], isCurrent),
    };
  });

  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-4 overflow-x-auto rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)]/80 px-3 py-2 shadow-sm backdrop-blur sm:mb-6 sm:px-4"
    >
      <ol className="flex min-w-max items-center gap-1 text-sm text-[var(--text-muted)]">
        <li>
          <Link
            href={baseHref}
            className="inline-flex items-center gap-2 rounded-full px-2 py-1 font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]"
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
        </li>
        {items.map((item) => (
          <li key={item.href} className="flex items-center gap-1">
            <ChevronRight className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
            {item.isCurrent ? (
              <span
                aria-current="page"
                className="rounded-full bg-violet-500/10 px-3 py-1 font-semibold text-violet-400"
              >
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="rounded-full px-3 py-1 font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]"
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

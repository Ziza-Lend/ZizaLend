"use client";

import { Info } from "lucide-react";
import { useId, type ReactNode } from "react";

type TooltipProps = {
  content: ReactNode;
  label?: string;
  iconClassName?: string;
  className?: string;
};

export function Tooltip({ content, label = "More info", iconClassName, className }: TooltipProps) {
  const id = useId();

  return (
    <span className={`group relative inline-flex items-center ${className ?? ""}`}>
      <button
        type="button"
        aria-label={label}
        aria-describedby={id}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[var(--text-muted)] transition hover:text-violet-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]"
      >
        <Info className={`h-4 w-4 ${iconClassName ?? ""}`} />
      </button>
      <span
        id={id}
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 hidden w-64 -translate-x-1/2 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-3 text-xs leading-5 text-[var(--text-secondary)] shadow-lg group-hover:block group-focus-within:block"
      >
        {content}
      </span>
    </span>
  );
}

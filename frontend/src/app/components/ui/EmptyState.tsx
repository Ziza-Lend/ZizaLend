"use client";

import type { ElementType, ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/app/utils/cn";

interface EmptyStateProps {
  icon: ElementType<{ className?: string }>;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  actionIcon?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  actionIcon,
  className,
}: EmptyStateProps) {
  const actionClasses =
    "mt-6 inline-flex items-center gap-2 rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500 shadow-[var(--shadow-glow)]";

  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-[var(--border-default)] px-6 py-10 text-center",
        className,
      )}
    >
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400">
        <Icon className="h-8 w-8" />
      </div>
      <p className="mt-5 text-base font-semibold text-[var(--text-primary)]">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-[var(--text-secondary)]">
        {description}
      </p>
      {actionLabel && actionHref ? (
        <Link href={actionHref} className={actionClasses}>
          {actionLabel}
          {actionIcon ?? <ArrowRight className="h-4 w-4" />}
        </Link>
      ) : null}
      {actionLabel && onAction ? (
        <button type="button" onClick={onAction} className={actionClasses}>
          {actionLabel}
          {actionIcon ?? <ArrowRight className="h-4 w-4" />}
        </button>
      ) : null}
    </div>
  );
}

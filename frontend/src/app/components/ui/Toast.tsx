"use client";

import { Toaster as SonnerToaster } from "sonner";
import { useEffect, useState } from "react";

/**
 * Toast notification component using Sonner.
 * Provides a clean, accessible toast system with dark mode support.
 */
export function Toaster() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <SonnerToaster
      position="top-right"
      expand={false}
      richColors
      closeButton
      duration={4000}
      toastOptions={{
        classNames: {
          toast:
            "rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-lg",
          title: "text-sm font-medium text-[var(--text-primary)]",
          description: "text-sm text-[var(--text-secondary)]",
          actionButton: "bg-violet-600 text-white hover:bg-violet-700",
          cancelButton:
            "bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]",
          closeButton: "bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-surface-hover)]",
          success: "border-green-200 dark:border-green-900",
          error: "border-red-200 dark:border-red-900",
          warning: "border-yellow-200 dark:border-yellow-900",
          info: "border-blue-200 dark:border-blue-900",
        },
      }}
    />
  );
}

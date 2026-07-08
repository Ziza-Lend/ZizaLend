"use client";

import { useEffect, useState } from "react";

/**
 * useHydrated
 *
 * Returns `false` during SSR and the very first client render, then flips
 * to `true` after the first effect tick. Use this to gate components that
 * read from client-only sources (localStorage, persisted Zustand stores,
 * `window.matchMedia`, etc.) so they avoid SSR/CSR DOM mismatches.
 *
 * This hook is dependency-free and safe to call from any client component.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  return hydrated;
}

"use client";

import { useEffect } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useThemeStore } from "../../stores/useThemeStore";

export function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme);
  const hydrated = useThemeStore((state) => state.hydrated);
  const initializeTheme = useThemeStore((state) => state.initializeTheme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  useEffect(() => {
    if (!hydrated) {
      initializeTheme();
    }
  }, [hydrated, initializeTheme]);

  // Prevent hydration mismatch and flash of unstyled icon
  if (!hydrated) {
    return (
      <button className="p-2 text-transparent" aria-hidden="true" disabled>
        <div className="h-5 w-5" />
      </button>
    );
  }

  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;
  const label = theme === "dark" ? "Dark mode" : theme === "light" ? "Light mode" : "System";
  const nextLabel = theme === "dark" ? "system" : theme === "system" ? "light" : "dark";

  return (
    <button
      onClick={toggleTheme}
      className="p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] rounded-lg transition-colors duration-150 relative overflow-hidden"
      aria-label={`${label} active, switch to ${nextLabel} mode`}
      aria-live="polite"
      title={label}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={theme}
          initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
        >
          <Icon className="h-5 w-5" />
        </motion.div>
      </AnimatePresence>
    </button>
  );
}

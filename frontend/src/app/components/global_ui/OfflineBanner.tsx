"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const update = () => setIsOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  useEffect(() => {
    if (isOnline) {
      queryClient.refetchQueries({ type: "active" });
    }
  }, [isOnline, queryClient]);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          key="offline-banner"
          initial={{ maxHeight: 0, opacity: 0 }}
          animate={{ maxHeight: 100, opacity: 1 }}
          exit={{ maxHeight: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="overflow-hidden border-b border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30"
          role="status"
          aria-live="polite"
        >
          <div className="px-4 py-2 text-amber-900 dark:text-amber-200">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Offline — showing cached data</span>
              </div>
              <button
                type="button"
                onClick={() => queryClient.refetchQueries({ type: "active" })}
                className="shrink-0 rounded-full bg-amber-900 px-3 py-1 text-xs font-semibold text-amber-50 transition hover:bg-amber-800 dark:bg-amber-200 dark:text-amber-950 dark:hover:bg-amber-100"
              >
                Retry
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

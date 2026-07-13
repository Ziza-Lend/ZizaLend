"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  return (
    <AnimatePresence>
      {deferredPrompt && !dismissed && (
        <motion.div
          key="install-prompt"
          initial={{ opacity: 0, y: 32, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="fixed bottom-4 left-4 right-4 z-[60] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-violet-500/30 bg-violet-500/10 px-4 py-3 shadow-lg backdrop-blur-xl sm:left-auto sm:right-4 sm:bottom-4"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600/20">
            <Download className="h-5 w-5 text-violet-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-violet-100">Install Zizalend</p>
            <p className="text-xs text-violet-300/80">Add to home screen for offline access</p>
          </div>
          <button
            type="button"
            onClick={handleInstall}
            className="shrink-0 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-violet-700 active:bg-violet-800 active:scale-[0.97]"
          >
            Install
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="shrink-0 rounded-full p-1.5 text-violet-400 transition hover:bg-violet-500/10 hover:text-violet-300"
            aria-label="Dismiss install prompt"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

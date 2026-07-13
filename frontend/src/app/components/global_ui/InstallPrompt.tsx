"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

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

  if (!deferredPrompt || dismissed) return null;

  const handleInstall = async () => {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3 shadow-lg backdrop-blur">
      <Download className="h-5 w-5 text-violet-400" />
      <p className="text-sm font-medium text-violet-200">
        Install Zizalend for offline access
      </p>
      <button
        type="button"
        onClick={handleInstall}
        className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-700"
      >
        Install
      </button>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="text-violet-400 transition hover:text-violet-300"
        aria-label="Dismiss install prompt"
      >
        &times;
      </button>
    </div>
  );
}

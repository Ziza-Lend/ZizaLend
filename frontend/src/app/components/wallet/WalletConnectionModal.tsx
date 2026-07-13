"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, ChevronRight, Lock, RefreshCw, Smartphone, Wallet, X } from "lucide-react";
import Modal from "../ui/Modal";
import { useWallet } from "../providers/WalletProvider";
import {
  useWalletStore,
  selectWalletLastError,
  selectIsWrongNetwork,
  type WalletErrorKind,
} from "../../stores/useWalletStore";
import { useConnectModalStore } from "../../stores/useConnectModalStore";
import { ALBEDO_DEEPLINK_BASE, MODAL_AUTO_CLOSE_MS } from "../../config/walletFallbacks";

/**
 * WalletConnectionModal
 *
 * Single global modal that drives the wallet connection lifecycle. Rendered
 * once at the root layout. Reads `useConnectModalStore` for open/close,
 * delegates signing + Freighter interaction to `useWallet()`.
 *
 * Phase render order:
 *  1. picker  — listing detected wallets (currently Freighter)
 *  2. connecting — Freighter popup open; spinner
 *  3. wrong_network — connected but on unsupported network; CTA "Switch"
 *  4. error — terminal failure with categorised CTA copy
 *  5. mobile — fallback when Freighter is unavailable on mobile
 *  6. connected — closes immediately on success
 *
 * A11y: Modal already provides role=dialog + aria-modal + focus trap.
 */
export default function WalletConnectionModal() {
  const t = useTranslations("wallet");
  const wallet = useWallet();
  const lastError = useWalletStore(selectWalletLastError);
  const isWrongNetwork = useWalletStore(selectIsWrongNetwork);
  const phase = useWalletStore((s) => s.phase);
  const address = useWalletStore((s) => s.address);
  const networkName = useWalletStore((s) => s.network?.name ?? null);
  const isOpen = useConnectModalStore((s) => s.isOpen);
  const close = useConnectModalStore((s) => s.close);
  const setPhase = useWalletStore((s) => s.setPhase);
  const setErrorString = useWalletStore((s) => s.setErrorString);

  // Auto-close once connected, with a tiny delay so the user sees the success.
  useEffect(() => {
    if (isOpen && address && !lastError && !isWrongNetwork) {
      const handle = window.setTimeout(close, MODAL_AUTO_CLOSE_MS);
      return () => window.clearTimeout(handle);
    }
    return undefined;
  }, [isOpen, address, lastError, isWrongNetwork, close]);

  const onContinueOnMobile = useCallback(() => {
    const url = encodeURIComponent(window.location.href);
    window.open(`${ALBEDO_DEEPLINK_BASE}?target=${url}`, "_blank", "noopener,noreferrer");
  }, []);

  const isMobile = useMemo(() => {
    if (typeof window === "undefined") return false;
    return /Mobi|Android|iPhone|iPad/i.test(window.navigator.userAgent);
  }, []);

  const showError = !!lastError;
  const showWrongNetwork = isWrongNetwork;
  const showConnecting = phase === "connecting" || phase === "detecting";
  const showMobileFallback = !wallet.isFreighterAvailable && isMobile && !showError;

  return (
    <Modal isOpen={isOpen} onClose={close} title={t("connect.title")}>
      <div className="space-y-4">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("connect.description")}</p>

        {/* Picker / detector */}
        {!showWrongNetwork && !showError && !showConnecting && !showMobileFallback && (
          <button
            type="button"
            onClick={() => {
              setErrorString(null);
              setPhase("connecting");
              void wallet.connectWallet();
            }}
            disabled={!wallet.isFreighterAvailable && !isMobile}
            aria-label={t("connect.freighterOptionName")}
            className="group flex w-full items-center justify-between gap-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 text-left transition hover:border-violet-500/50 hover:bg-violet-500/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-violet-500/10">
                <Wallet
                  className="h-5 w-5 text-violet-400"
                  aria-hidden="true"
                />
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  {t("connect.freighterOptionName")}
                </span>
                <span className="text-xs text-[var(--text-secondary)]">
                  {t("connect.freighterOptionDescription")}
                </span>
              </span>
            </span>
            <ChevronRight
              className="h-4 w-4 text-[var(--text-muted)] transition group-hover:translate-x-0.5 group-hover:text-violet-400"
              aria-hidden="true"
            />
          </button>
        )}

        {/* Mobile fallback */}
        {showMobileFallback && (
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200">
              <Smartphone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p>{t("connect.mobileFallback.description")}</p>
            </div>
            <button
              type="button"
              onClick={onContinueOnMobile}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500"
            >
              {t("connect.mobileFallback.cta")}
            </button>
          </div>
        )}

        {/* Connecting */}
        {showConnecting && (
          <div className="flex flex-col items-center gap-3 py-6 text-zinc-500 dark:text-zinc-400">
            <span
              className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent"
              aria-hidden="true"
            />
            <p className="text-sm">{t("connect.connecting")}</p>
          </div>
        )}

        {/* Wrong network */}
        {showWrongNetwork && (
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800/60 dark:bg-red-950/40 dark:text-red-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p>{t("error.wrongNetwork.description", { network: networkName ?? "UNKNOWN" })}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void wallet.refreshWallet()}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                {t("error.wrongNetwork.refresh")}
              </button>
              <button
                type="button"
                onClick={close}
                className="flex items-center justify-center gap-2 rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                {t("error.dismiss")}
              </button>
            </div>
          </div>
        )}

        {/* Categorised error */}
        {showError && lastError && (
          <ErrorCard
            kind={lastError.kind}
            message={lastError.message}
            onRetry={() => {
              setErrorString(null);
              setPhase("connecting");
              void wallet.connectWallet();
            }}
            onDismiss={() => setErrorString(null)}
            t={t}
          />
        )}
      </div>
    </Modal>
  );
}

interface ErrorCardProps {
  kind: WalletErrorKind;
  message: string;
  onRetry: () => void;
  onDismiss: () => void;
  t: ReturnType<typeof useTranslations>;
}

function ErrorCard({ kind, message, onRetry, onDismiss, t }: ErrorCardProps) {
  const toneClasses: Record<WalletErrorKind, string> = {
    user_rejected:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200",
    wallet_locked:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200",
    network_down:
      "border-red-200 bg-red-50 text-red-800 dark:border-red-800/60 dark:bg-red-950/40 dark:text-red-200",
    wrong_network:
      "border-red-200 bg-red-50 text-red-800 dark:border-red-800/60 dark:bg-red-950/40 dark:text-red-200",
    timeout:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200",
    unknown:
      "border-red-200 bg-red-50 text-red-800 dark:border-red-800/60 dark:bg-red-950/40 dark:text-red-200",
  };
  const Icon = kind === "wallet_locked" ? Lock : AlertTriangle;
  return (
    <div className="space-y-3">
      <div className={`flex items-start gap-3 rounded-lg border p-3 text-sm ${toneClasses[kind]}`}>
        <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <div>
          <p className="font-medium">{t(`error.${kind}.title` as const)}</p>
          <p className="mt-1 opacity-90">{message}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onRetry}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          {t("error.retry")}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          aria-label={t("error.dismiss")}
          className="flex items-center justify-center gap-2 rounded-lg border border-zinc-300 px-2.5 py-2.5 text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

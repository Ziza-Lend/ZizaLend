"use client";

import { useTranslations } from "next-intl";
import { useWallet } from "../providers/WalletProvider";
import { useWalletStore, selectIsWrongNetwork } from "../../stores/useWalletStore";
import { useHydrated } from "../../hooks/useHydrated";

/**
 * NetworkBanner
 *
 * Persistent banner shown at the top of the layout when the connected wallet
 * is on a network the app does not support (PUBLIC, TESTNET, FUTURENET, or
 * STANDALONE). Provides a "Refresh" CTA that re-reads network info, then a
 * "Disconnect" CTA as a resolution when the user can't / won't switch.
 *
 * Rendered once at the root layout. Returns null when not applicable.
 *
 * Hydration: the wallet store is persisted to localStorage. On SSR the store
 * has no address/network, so SSR renders nothing. After hydration the
 * persisted wrong-network state flips the banner on. We gate the banner on
 * `persist.hasHydrated()` so the rendered DOM matches between server and
 * client, avoiding React hydration mismatch warnings.
 */
export default function NetworkBanner() {
  const t = useTranslations("wallet.networkBanner");
  const { refreshWallet, disconnectWallet } = useWallet();
  const isWrong = useWalletStore(selectIsWrongNetwork);
  const networkName = useWalletStore((s) => s.network?.name ?? null);
  const hydrated = useHydrated();

  if (!hydrated || !isWrong) {
    return null;
  }

  return (
    <div
      role="alert"
      // data-hydrated so e2e tests can wait for the banner to mount.
      data-hydrated="true"
      className="border-b border-yellow-300 bg-yellow-50 px-4 py-2 text-sm text-yellow-900 dark:border-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-200"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <p className="font-medium">
          {t("title", { network: networkName ?? "UNKNOWN" })} <span aria-hidden="true">·</span>{" "}
          <span className="opacity-80">{t("description")}</span>
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void refreshWallet()}
            className="rounded-md border border-yellow-400 bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-900 hover:bg-yellow-200 dark:border-yellow-700 dark:bg-yellow-900/60 dark:text-yellow-100 dark:hover:bg-yellow-900"
          >
            {t("refresh")}
          </button>
          <button
            type="button"
            onClick={disconnectWallet}
            className="rounded-md border border-transparent px-3 py-1 text-xs font-semibold text-yellow-900 underline-offset-2 hover:underline dark:text-yellow-100"
          >
            {t("disconnect")}
          </button>
        </div>
      </div>
    </div>
  );
}

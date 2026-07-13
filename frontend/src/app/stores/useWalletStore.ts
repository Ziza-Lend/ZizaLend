/**
 * stores/useWalletStore.ts
 *
 * Zustand store for Web3 wallet connection state.
 *
 * Responsibilities:
 *  - Track the connected wallet address
 *  - Track the current chain / network
 *  - Track available token balances
 *  - Provide actions to connect / disconnect
 *
 * Design decision: actual wallet provider interaction (ethers / wagmi calls)
 * lives in a separate hook or service. This store is the single source of truth
 * for the resulting state so any component can read it without a provider tree.
 */

import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";

// ─── Types ───────────────────────────────────────────────────────────────────

export type WalletStatus = "disconnected" | "connecting" | "connected" | "error";

/**
 * Categorised wallet error taxonomy. Used by the wallet connection modal to
 * drive recovery UX (specific CTA, copy tone) instead of a flat error string.
 */
export type WalletErrorKind =
  "user_rejected" | "wallet_locked" | "network_down" | "wrong_network" | "timeout" | "unknown";

export interface WalletError {
  kind: WalletErrorKind;
  /** Human-readable message suitable for direct display. */
  message: string;
}

/**
 * Explicit connection lifecycle phase. Backed by the same status field
 * (status is the wire-facing string; phase is the orchestrator-facing enum).
 */
export type ConnectionPhase =
  "disconnected" | "detecting" | "connecting" | "wrong_network" | "signing" | "connected" | "error";

export interface TokenBalance {
  symbol: string;
  /** Human-readable amount, e.g. "1.234" */
  amount: string;
  /** USD value, or null if price unavailable */
  usdValue: number | null;
}

export interface WalletNetwork {
  chainId: number;
  name: string;
  /** Whether this is one of the app's supported networks */
  isSupported: boolean;
}

interface WalletState {
  /** Wallet connection status (wire-facing string, kept for back-compat) */
  status: WalletStatus;
  /** Orchestrator-facing lifecycle phase. */
  phase: ConnectionPhase;
  /** Connected wallet address (checksummed) — null when disconnected */
  address: string | null;
  /** Current network info */
  network: WalletNetwork | null;
  /** Token balances for the connected wallet */
  balances: TokenBalance[];
  /** True while fetching/refreshing balances */
  isLoadingBalances: boolean;
  /**
   * Categorised wallet error for rich UX (UserRejected vs WrongNetwork vs …).
   * May be null even when `error` is non-null; the orchestrator sets the
   * kind on known failure paths and leaves it null otherwise.
   */
  lastError: WalletError | null;
  /** Human-readable error message (derived convenience for display). */
  error: string | null;
  /** Whether the app should try to restore the wallet on refresh */
  shouldAutoReconnect: boolean;
}

interface WalletActions {
  /** Call after a successful wallet.connect() to store the result */
  setConnected: (address: string, network: WalletNetwork) => void;
  /** Call on disconnect or user-initiated Sign Out with wallet */
  disconnect: () => void;
  /** Update balances after fetching from the chain */
  setBalances: (balances: TokenBalance[]) => void;
  /** Update network when the user switches chains */
  setNetwork: (network: WalletNetwork) => void;
  setStatus: (status: WalletStatus) => void;
  /** Set the orchestrator-facing phase explicitly. */
  setPhase: (phase: ConnectionPhase) => void;
  /**
   * Set the categorised error. Passing `null` clears it. The optional `status`
   * keeps the legacy wire-facing status in sync.
   */
  /**
   * Set an uncategorised, free-text error message. Use this when the failure
   * path can't / shouldn't classify the kind (network blips, raw API errors).
   * Passing `null` clears the error. The optional `status` keeps the legacy
   * wire-facing status in sync.
   */
  setErrorString: (message: string | null, status?: WalletStatus) => void;
  /**
   * Set a categorised error. Use this when the failure path can classify the
   * kind (user rejected, wallet locked, network unreachable, wrong network,
   * timeout, or unknown). Passing `null` clears the error. The optional
   * `status` keeps the legacy wire-facing status in sync.
   */
  setCategorisedError: (error: WalletError | null, status?: WalletStatus) => void;
  setLoadingBalances: (loading: boolean) => void;
}

export type WalletStore = WalletState & WalletActions;

// ─── Initial state ────────────────────────────────────────────────────────────

export const initialState: WalletState = {
  status: "disconnected",
  phase: "disconnected",
  address: null,
  network: null,
  balances: [],
  isLoadingBalances: false,
  lastError: null,
  error: null,
  shouldAutoReconnect: false,
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useWalletStore = create<WalletStore>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        setConnected: (address, network) =>
          set(
            {
              status: "connected",
              address,
              network,
              error: null,
              shouldAutoReconnect: true,
            },
            false,
            "wallet/setConnected",
          ),

        disconnect: () =>
          set(
            {
              ...initialState,
            },
            false,
            "wallet/disconnect",
          ),

        setBalances: (balances) =>
          set({ balances, isLoadingBalances: false }, false, "wallet/setBalances"),

        setNetwork: (network) => set({ network }, false, "wallet/setNetwork"),

        setStatus: (status) => set({ status }, false, "wallet/setStatus"),

        setPhase: (phase) => set({ phase }, false, "wallet/setPhase"),

        setErrorString: (message, status) => {
          const nextStatus: WalletStatus = status ?? (message ? "error" : "disconnected");
          set(
            {
              error: message,
              lastError: message ? { kind: "unknown", message } : null,
              status: nextStatus,
              isLoadingBalances: false,
            },
            false,
            "wallet/setErrorString",
          );
        },

        setCategorisedError: (error, status) => {
          const nextStatus: WalletStatus = status ?? (error ? "error" : "disconnected");
          set(
            {
              error: error?.message ?? null,
              lastError: error,
              status: nextStatus,
              isLoadingBalances: false,
            },
            false,
            "wallet/setCategorisedError",
          );
        },

        setLoadingBalances: (isLoadingBalances) =>
          set({ isLoadingBalances }, false, "wallet/setLoadingBalances"),
      }),
      {
        name: "Zizalend-wallet",
        version: 2,
        storage: createJSONStorage(() => localStorage),
        // v1 -> v2 migration: existing persisted state has no `phase` or
        // `lastError` field. Backfill from the legacy `status` field so a
        // returning user lands on a sensible phase.
        migrate: (persisted, version) => {
          const p = (persisted ?? {}) as Partial<WalletState>;
          const phase: ConnectionPhase =
            p.status === "connected"
              ? "connected"
              : p.status === "connecting"
                ? "connecting"
                : p.status === "error"
                  ? "error"
                  : "disconnected";
          return {
            ...initialState,
            ...p,
            phase,
            lastError: null,
          } as WalletState;
        },
        partialize: (state) => ({
          status: state.status,
          phase: state.phase,
          address: state.address,
          network: state.network,
          balances: state.balances,
          shouldAutoReconnect: state.shouldAutoReconnect,
        }),
      },
    ),
    { name: "WalletStore" },
  ),
);

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectWalletAddress = (state: WalletStore) => state.address;
export const selectWalletStatus = (state: WalletStore) => state.status;
export const selectIsWalletConnected = (state: WalletStore) => state.status === "connected";
export const selectWalletNetwork = (state: WalletStore) => state.network;
export const selectWalletBalances = (state: WalletStore) => state.balances;
export const selectWalletError = (state: WalletStore) => state.error;
export const selectWalletShouldAutoReconnect = (state: WalletStore) => state.shouldAutoReconnect;
export const selectWalletPhase = (state: WalletStore) => state.phase;
export const selectWalletLastError = (state: WalletStore) => state.lastError;
export const selectIsWrongNetwork = (state: WalletStore) =>
  !!state.address && !!state.network && !state.network.isSupported;

"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";

/**
 * useConnectModalStore
 *
 * Tiny global flag that tracks whether the wallet connection modal is open.
 * Pages that need a "Connect Wallet" CTA call `open()`; the modal rendered
 * once at the root layout subscribes and renders accordingly.
 *
 * Kept separate from the wallet store so the modal's open/close does not
 * trigger re-renders for wallet-aware components that don't care about it.
 *
 * @remarks Intentionally non-persisted: A hard reload should reset the modal
 * to closed. Adding `persist` middleware would surface ephemeral UI state to
 * the wire-format surface and is not desired.
 */
interface ConnectModalState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const useConnectModalStore = create<ConnectModalState>()(
  devtools(
    (set) => ({
      isOpen: false,
      open: () => set({ isOpen: true }, false, "connectModal/open"),
      close: () => set({ isOpen: false }, false, "connectModal/close"),
    }),
    { name: "ConnectModalStore" },
  ),
);

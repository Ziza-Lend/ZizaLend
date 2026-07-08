/**
 * Tests for WalletConnectionModal.
 *
 * The modal occupies one render slot at the root layout and drives the
 * connect lifecycle through `useWallet()`. Tests focus on three layers:
 *
 *  1. Phase rendering — picker vs. connecting vs. wrong-network vs. error.
 *  2. Error taxonomy — each `WalletErrorKind` produces its own CTA + tone.
 *  3. Auto-close on success — once the wallet store reaches
 *     (address, !error) the modal closes itself.
 *
 * Implementation note: rather than `jest.mock`-ing `WalletProvider`, we import
 * the exported `WalletProviderContext` and supply a stub value via a small
 * render helper. This avoids running the real provider's `useEffect` chain
 * (which dynamically imports `@stellar/freighter-api` and would pollute the
 * wallet store under Jest).
 */

import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "../../../../messages/en.json";
import {
  WalletProviderContext,
  type WalletProviderContextValue,
} from "../providers/WalletProvider";
import {
  useWalletStore,
  initialState as storeInitialState,
  type WalletError,
  type WalletErrorKind,
} from "../../stores/useWalletStore";
import { useConnectModalStore } from "../../stores/useConnectModalStore";
import WalletConnectionModal from "./WalletConnectionModal";

const MOCK_ADDRESS = "GCJPBXSE6WCQDCEYZW6C3YVZCSSCHC4AE72L5KWKCYL2CLLL7NH5VSCI";

// ─── Test helpers ─────────────────────────────────────────────────────────────

interface RenderOptions {
  context?: Partial<WalletProviderContextValue>;
  modalOpen?: boolean;
}

function renderModal({ context, modalOpen = true }: RenderOptions = {}) {
  const fullContext: WalletProviderContextValue = {
    isFreighterAvailable: true,
    connectWallet: jest.fn().mockResolvedValue(undefined),
    disconnectWallet: jest.fn(),
    refreshWallet: jest.fn().mockResolvedValue(undefined),
    signTransaction: jest.fn().mockResolvedValue("signed-xdr"),
    ...context,
  };

  // Create the spies ONCE per render so tests can assert on the actual spy
  // the modal's effects will invoke (overwriting them post-render replaces
  // the modal's bound reference with a fresh jest.fn that the test never
  // observes).
  const closeSpy = jest.fn();
  const openSpy = jest.fn();
  useConnectModalStore.setState({ isOpen: modalOpen, open: openSpy, close: closeSpy });

  const utils = render(
    <NextIntlClientProvider locale="en" messages={enMessages as unknown as Record<string, unknown>}>
      <WalletProviderContext.Provider value={fullContext}>
        <WalletConnectionModal />
      </WalletProviderContext.Provider>
    </NextIntlClientProvider>,
  );
  return { ...utils, closeSpy, openSpy };
}

function resetStores() {
  useWalletStore.setState(storeInitialState);
  localStorage.clear();
  useConnectModalStore.setState({ isOpen: false, open: jest.fn(), close: jest.fn() });
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  resetStores();
});

afterEach(() => {
  jest.clearAllMocks();
});

// ─── Picker ───────────────────────────────────────────────────────────────────

describe("WalletConnectionModal — picker phase", () => {
  it("renders the modal title, description, and the Freighter option", () => {
    renderModal();
    expect(screen.getByText(/Connect a wallet/i)).toBeInTheDocument();
    expect(screen.getByText(/Choose a wallet/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Freighter/ })).toBeInTheDocument();
  });

  it("does not render as a dialog when the modal store reports closed", () => {
    renderModal({ modalOpen: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("clicking Freighter triggers connectWallet() and shows the connecting spinner", async () => {
    const connectWallet = jest.fn().mockImplementation(async () => {
      useWalletStore.setState({ phase: "connecting", status: "connecting" });
    });
    renderModal({ context: { connectWallet } });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /Freighter/ }));

    expect(connectWallet).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.getByText(/Waiting for wallet confirmation/i)).toBeInTheDocument();
    });
  });

  it("disables the Freighter option when isFreighterAvailable=false and not on mobile", () => {
    renderModal({ context: { isFreighterAvailable: false } });
    const btn = screen.getByRole("button", { name: /Freighter/ });
    expect(btn).toBeDisabled();
  });
});

// ─── Auto-close on success ────────────────────────────────────────────────────

describe("WalletConnectionModal — auto-close", () => {
  // The auto-close path schedules `close()` after `MODAL_AUTO_CLOSE_MS`
  // (350 ms). This test must run under real timers so the setTimeout fires;
  // if a future commit enables `jest.useFakeTimers()` globally, add a
  // matching override here (e.g., `jest.useFakeTimers()` + `jest.advanceTimersByTime`).
  beforeEach(() => {
    jest.useRealTimers();
  });

  it("closes itself once a wallet address lands with no error", async () => {
    const { closeSpy } = renderModal({ context: { isFreighterAvailable: true } });

    act(() => {
      useWalletStore.setState({
        status: "connected",
        phase: "connected",
        address: MOCK_ADDRESS,
        network: { chainId: 2, name: "TESTNET", isSupported: true },
      });
    });

    await waitFor(
      () => {
        expect(closeSpy).toHaveBeenCalled();
      },
      { timeout: 1500 },
    );
  });
});

// ─── Error taxonomy ───────────────────────────────────────────────────────────

describe("WalletConnectionModal — error taxonomy", () => {
  const kinds: Array<{ kind: WalletErrorKind; titleRegex: RegExp }> = [
    { kind: "user_rejected", titleRegex: /Connection cancelled/i },
    { kind: "wallet_locked", titleRegex: /Wallet is locked/i },
    { kind: "network_down", titleRegex: /Wallet extension unreachable/i },
    { kind: "timeout", titleRegex: /Wallet timed out/i },
    { kind: "unknown", titleRegex: /Wallet error/i },
  ];

  for (const { kind, titleRegex } of kinds) {
    it(`renders the '${kind}' error UI with retry + dismiss`, () => {
      renderModal();
      act(() => {
        const err: WalletError = { kind, message: `Simulated ${kind} failure` };
        useWalletStore.setState({
          status: "error",
          phase: "error",
          error: err.message,
          lastError: err,
        });
      });

      expect(screen.getByText(titleRegex)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Try again/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Dismiss/i })).toBeInTheDocument();
    });
  }

  it("retry button re-invokes connectWallet() and clears the error", async () => {
    const connectWallet = jest.fn().mockResolvedValue(undefined);
    renderModal({ context: { connectWallet } });

    act(() => {
      useWalletStore.setState({
        status: "error",
        phase: "error",
        error: "boom",
        lastError: { kind: "unknown", message: "boom" },
      });
    });

    await userEvent.setup().click(screen.getByRole("button", { name: /Try again/i }));

    expect(useWalletStore.getState().lastError).toBeNull();
    expect(connectWallet).toHaveBeenCalled();
  });
});

// ─── Wrong-network phase ──────────────────────────────────────────────────────

describe("WalletConnectionModal — wrong network", () => {
  it("renders the wrong-network panel when address set on unsupported network", () => {
    renderModal();
    act(() => {
      useWalletStore.setState({
        status: "error",
        phase: "wrong_network",
        address: MOCK_ADDRESS,
        network: { chainId: 0, name: "UNKNOWN", isSupported: false },
        error: "Unsupported wallet network",
        lastError: { kind: "wrong_network", message: "Unsupported" },
      });
    });

    // The wrong-network panel surfaces a contextual description (the i18n
    // key `wallet.error.wrongNetwork.description`) plus a refresh + dismiss
    // action. Assert against the rendered description, which interpolates
    // the offending network name, so the test stays robust to copy edits.
    expect(
      screen.getByText((text) => /Your wallet is connected to/i.test(text) && /UNKNOWN/.test(text)),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Refresh network/i })).toBeInTheDocument();
  });

  it("does not flag wrong-network when isSupported=true", async () => {
    const { closeSpy } = renderModal();

    act(() => {
      useWalletStore.setState({
        status: "connected",
        phase: "connected",
        address: MOCK_ADDRESS,
        network: { chainId: 2, name: "TESTNET", isSupported: true },
      });
    });

    // Auto-close fires; the wrong-network card never appears.
    await waitFor(
      () => {
        expect(closeSpy).toHaveBeenCalled();
      },
      { timeout: 1500 },
    );
    expect(screen.queryByText(/Unsupported network/i)).not.toBeInTheDocument();
  });
});

/**
 * Tests for NetworkBanner.
 *
 * The banner is a passive component: when the wallet store reports
 * `selectIsWrongNetwork` it renders; otherwise it returns null. The CTAs
 * delegate to `useWallet().refreshWallet()` and `useWallet().disconnectWallet()`.
 *
 * Implementation note: we wrap in `WalletProviderContext.Provider` directly
 * (to skip the real provider's `useEffect` chain which imports Freighter),
 * and rely on `useHydrated`'s effect-flip to gate the banner inside tests
 * (RTL advances effects inside `act()` for assertions that follow).
 */

import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "../../../../messages/en.json";
import {
  WalletProviderContext,
  type WalletProviderContextValue,
} from "../providers/WalletProvider";
import { useWalletStore, initialState as storeInitialState } from "../../stores/useWalletStore";
import NetworkBanner from "./NetworkBanner";

const MOCK_SUPPORTED = {
  chainId: 2,
  name: "TESTNET",
  isSupported: true,
};
const MOCK_UNSUPPORTED = {
  chainId: 0,
  name: "UNKNOWN",
  isSupported: false,
};

interface RenderOptions {
  refreshWallet?: jest.Mock;
  disconnectWallet?: jest.Mock;
}

function renderBanner({ refreshWallet, disconnectWallet }: RenderOptions = {}) {
  const ctx: WalletProviderContextValue = {
    isFreighterAvailable: true,
    connectWallet: jest.fn().mockResolvedValue(undefined),
    refreshWallet: refreshWallet ?? jest.fn().mockResolvedValue(undefined),
    disconnectWallet: disconnectWallet ?? jest.fn(),
    signTransaction: jest.fn().mockResolvedValue("x"),
  };

  return render(
    <NextIntlClientProvider locale="en" messages={enMessages as unknown as Record<string, unknown>}>
      <WalletProviderContext.Provider value={ctx}>
        <NetworkBanner />
      </WalletProviderContext.Provider>
    </NextIntlClientProvider>,
  );
}

function resetStore() {
  useWalletStore.setState(storeInitialState);
  localStorage.clear();
}

beforeEach(() => {
  act(() => {
    resetStore();
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("NetworkBanner", () => {
  it("renders nothing when the wallet is on a supported network", async () => {
    act(() => {
      useWalletStore.setState({
        ...storeInitialState,
        status: "connected",
        phase: "connected",
        address: "GABC",
        network: MOCK_SUPPORTED,
        shouldAutoReconnect: true,
      });
    });
    const { container } = renderBanner({});
    // Banner is hydration-gated; mounted state is null even when supported.
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it("renders nothing when disconnected", async () => {
    act(() => {
      useWalletStore.setState({
        ...storeInitialState,
        status: "disconnected",
        phase: "disconnected",
      });
    });
    const { container } = renderBanner({});
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it("renders an alert banner when the wallet is on an unsupported network", async () => {
    act(() => {
      useWalletStore.setState({
        ...storeInitialState,
        status: "error",
        phase: "wrong_network",
        address: "GABC",
        network: MOCK_UNSUPPORTED,
        shouldAutoReconnect: false,
      });
    });
    renderBanner({});

    const banner = await screen.findByRole("alert");
    expect(banner).toHaveAttribute("data-hydrated", "true");
    expect(banner).toHaveTextContent(/UNKNOWN/);
    expect(screen.getByRole("button", { name: /Refresh/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Disconnect/i })).toBeInTheDocument();
  });

  it("invokes refreshWallet when the Refresh button is clicked", async () => {
    act(() => {
      useWalletStore.setState({
        ...storeInitialState,
        status: "error",
        phase: "wrong_network",
        address: "GABC",
        network: MOCK_UNSUPPORTED,
        shouldAutoReconnect: false,
      });
    });
    const refresh = jest.fn().mockResolvedValue(undefined);
    renderBanner({ refreshWallet: refresh });

    await userEvent.setup().click(screen.getByRole("button", { name: /Refresh/i }));
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("invokes disconnectWallet when the Disconnect button is clicked", async () => {
    act(() => {
      useWalletStore.setState({
        ...storeInitialState,
        status: "error",
        phase: "wrong_network",
        address: "GABC",
        network: MOCK_UNSUPPORTED,
        shouldAutoReconnect: false,
      });
    });
    const disconnect = jest.fn();
    renderBanner({ disconnectWallet: disconnect });

    await userEvent.setup().click(screen.getByRole("button", { name: /Disconnect/i }));
    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SettingsPage from "./page";

jest.mock("../../lib/session", () => ({
  logoutUser: jest.fn(),
}));

jest.mock("../../hooks/useLogout", () => ({
  useLogout: () => ({ logout: jest.fn() }),
}));

jest.mock("../../stores/useUserStore", () => ({
  useUserStore: jest.fn((selector) =>
    selector({
      user: { id: "user1", email: "test@example.com" },
    }),
  ),
  selectUser: (state: { user: { id: string; email: string } }) => state.user,
}));

jest.mock("../../stores/useWalletStore", () => ({
  useWalletStore: jest.fn((selector) =>
    selector({
      address: null,
      network: "testnet",
      disconnect: jest.fn(),
    }),
  ),
  selectWalletAddress: (state: { address: string | null }) => state.address,
  selectWalletNetwork: (state: { network: string }) => state.network,
}));

jest.mock("../../stores/useThemeStore", () => ({
  useThemeStore: jest.fn(() => ({
    theme: "system",
    setTheme: jest.fn(),
  })),
}));

jest.mock("../../hooks/useApi", () => ({
  useNotificationPreferences: () => ({ data: undefined, isLoading: false, error: null }),
  useUpdateNotificationPreferences: () => ({ mutate: jest.fn(), isPending: false }),
}));

jest.mock("../../components/gamification/GamificationSettings", () => ({
  GamificationSettings: () => <div>Gamification Settings</div>,
}));

describe("SettingsPage section navigation", () => {
  it("exposes the default active section via aria-selected", () => {
    render(<SettingsPage />);

    expect(screen.getByRole("tab", { name: "Profile" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Wallet" })).toHaveAttribute("aria-selected", "false");
  });

  it("updates accessible state and focus when switching sections", async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    const walletTab = screen.getByRole("tab", { name: "Wallet" });
    await user.click(walletTab);

    expect(walletTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Profile" })).toHaveAttribute("aria-selected", "false");
    expect(document.activeElement).toBe(walletTab);
  });

  it("links each tab to its panel with aria-controls and tabpanel semantics", () => {
    render(<SettingsPage />);

    const profileTab = screen.getByRole("tab", { name: "Profile" });
    const panelId = profileTab.getAttribute("aria-controls");

    expect(panelId).toBe("settings-panel-profile");

    const panel = screen.getByRole("tabpanel");
    expect(panel).toHaveAttribute("id", panelId);
    expect(panel).toHaveAttribute("aria-labelledby", "settings-tab-profile");
  });
});

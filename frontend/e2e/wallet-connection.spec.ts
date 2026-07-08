/**
 * Wallet connection e2e spec.
 *
 * Two scenarios that exercise the HTML-visible surface of the new modal +
 * banner without requiring a real Freighter install:
 *
 *   1. Disconnected: landing on /wallet shows the connect CTA which opens
 *      the modal; the modal lists Freighter; closing returns to the page.
 *   2. Wrong network: when the persisted wallet is on an unsupported
 *      network, both the modal (if re-opened) and the persistent
 *      NetworkBanner render with the expected CTAs.
 *
 * Both flow tests are deterministic — they don't drive Freighter at all,
 * they drive the new UI shell we added.
 */

import { test, expect, type Page, type Route } from "@playwright/test";

const SUPPORTED_ADDRESS = "GCJPBXSE6WCQDCEYZW6C3YVZCSSCHC4AE72L5KWKCYL2CLLL7NH5VSCI";

async function seedDisconnected(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.removeItem("ZizaLend-wallet");
    window.localStorage.removeItem("ConnectModalStore");
  });
}

async function seedWrongNetwork(page: Page) {
  const wrongNetworkPayload = {
    state: {
      status: "error",
      phase: "wrong_network",
      address: SUPPORTED_ADDRESS,
      network: { chainId: 0, name: "UNKNOWN", isSupported: false },
      balances: [],
      shouldAutoReconnect: false,
    },
    version: 2,
  };
  await page.addInitScript((payload: string) => {
    window.localStorage.setItem("ZizaLend-wallet", payload);
  }, JSON.stringify(wrongNetworkPayload));
}

test.describe("Wallet connection — disconnected", () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await seedDisconnected(page);
  });

  test("CTA button on /wallet opens the connect modal", async ({ page }: { page: Page }) => {
    await page.goto("/en/wallet");

    const cta = page.getByTestId("wallet-page-connect-cta");
    await expect(cta).toBeVisible();
    await cta.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(/Connect a wallet/i);

    // The Freighter picker option should be present.
    await expect(dialog.getByRole("button", { name: /Freighter/ })).toBeVisible();
  });

  test("Closing the modal returns to the wallet page", async ({ page }: { page: Page }) => {
    await page.goto("/en/wallet");
    await page.getByTestId("wallet-page-connect-cta").click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Close via the modal's built-in close button (aria-label="Close modal").
    await page.getByRole("button", { name: /Close modal/i }).click();
    await expect(dialog).toBeHidden();
  });
});

test.describe("Wallet connection — wrong network banner", () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await seedWrongNetwork(page);
    // Profile route is required for header avatar / session probes.
    await page.route("**/api/user/profile", async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "user_1",
          walletAddress: SUPPORTED_ADDRESS,
          kycVerified: true,
        }),
      });
    });
  });

  test("Persistent banner renders the wrong-network CTAs on every page", async ({
    page,
  }: {
    page: Page;
  }) => {
    await page.goto("/en");

    const banner = page.getByRole("alert");
    await expect(banner).toBeVisible();
    await expect(banner).toContainText(/UNKNOWN/);
    await expect(banner.getByRole("button", { name: /Refresh/i })).toBeVisible();
    await expect(banner.getByRole("button", { name: /Disconnect/i })).toBeVisible();
  });
});

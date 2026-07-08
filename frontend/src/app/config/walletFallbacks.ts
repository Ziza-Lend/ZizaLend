/**
 * Wallet fallback URLs and tunables.
 *
 * Surface the third-party fallbacks and timing magic numbers as named exports
 * so the UI layers don't carry hard-coded literals. Tests can stub these
 * values deterministically without ad-hoc patching.
 */

/**
 * Albedo web-wallet deeplink target. Used by the WalletConnectionModal's
 * mobile fallback when Freighter is not available. The current URL points
 * to the Albedo lab's redirector that hands off to the host wallet extension.
 */
export const ALBEDO_DEEPLINK_BASE = "https://lab.albedo.xyz/deeplink";

/**
 * Delay (ms) before the connect-modal auto-closes after a successful wallet
 * connection. Tuned to be long enough to read the success but short enough
 * that the modal isn't a distracting overlay for more than a moment.
 *
 * Exposed as a named constant so any future test can `jest.useFakeTimers()`
 * + `jest.setSystemTime(...)` to advance past it deterministically.
 */
export const MODAL_AUTO_CLOSE_MS = 350;

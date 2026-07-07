"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useWalletStore } from "../stores/useWalletStore";
import { useUserStore } from "../stores/useUserStore";
import { useGamificationStore } from "../stores/useGamificationStore";
import { useQueryClient } from "@tanstack/react-query";

/**
 * useLogout
 *
 * Centralised logout handler that:
 *  1. Clears the user store (removes JWT / user data)
 *  2. Disconnects the wallet store
 *  3. Resets the gamification store session state
 *  4. Clears all TanStack Query cache (so stale data doesn't leak between sessions)
 *  5. Redirects to the home / login page
 *
 * Pass `sessionExpired: true` to show an explanatory message before redirect.
 */
export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const clearUser = useUserStore((s) => s.clearUser);
  const disconnectWallet = useWalletStore((s) => s.disconnect);
  const resetGamification = useGamificationStore((s) => s.resetGamification);

  const logout = useCallback(
    (options?: { sessionExpired?: boolean; redirectTo?: string }) => {
      // 1. Clear authentication state (JWT, user profile)
      clearUser();

      // 2. Disconnect wallet
      disconnectWallet();

      // 3. Reset gamification session counters
      resetGamification();

      // 4. Purge all cached server data so nothing leaks to the next session
      queryClient.clear();

      // 5. Navigate away
      const dest = options?.redirectTo ?? "/";
      if (options?.sessionExpired) {
        // Append flag so the landing page can show an expiry notice
        router.replace(`${dest}?reason=session_expired`);
      } else {
        router.replace(dest);
      }
    },
    [clearUser, disconnectWallet, resetGamification, queryClient, router],
  );

  return { logout };
}

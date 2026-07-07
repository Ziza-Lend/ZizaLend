import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry } from "@serwist/precaching";
import { Serwist } from "serwist";

declare const self: WorkerGlobalScope & {
  __SW_MANIFEST: PrecacheEntry[];
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  bypassCdn: ({ request }: { request: Request }) => {
    if (
      request.url.includes("/api/") ||
      request.url.includes("/sse/") ||
      request.url.includes("/_next/")
    ) {
      return true;
    }
    return false;
  },
} as ConstructorParameters<typeof Serwist>[0] & {
  bypassCdn: (context: { request: Request }) => boolean;
});

serwist.addEventListeners();

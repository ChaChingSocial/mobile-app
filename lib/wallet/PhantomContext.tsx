/**
 * PhantomContext – single shared instance of the Phantom deeplink connector.
 *
 * Problem it solves:
 *   usePhantomClusterConnector registers a Linking.addEventListener internally.
 *   When multiple components each call the hook directly (e.g. every PostWrapper
 *   in a feed), every instance fires handleRedirect on Phantom's deep-link
 *   return. The first instance to handle it clears pendingRequestRef; all other
 *   instances then see pendingRequestRef === null and log a spurious
 *   "Error from wallet provider" console error — and worse, if any of them has a
 *   stale pending request, setPendingRequest rejects it with "A wallet request
 *   is already in progress", killing the live signing promise.
 *
 * Solution:
 *   Instantiate usePhantomClusterConnector exactly once at the protected-layout
 *   level via <PhantomProvider>, and consume it everywhere via usePhantom().
 */

import React, { createContext, useContext } from "react";
import { usePhantomClusterConnector } from "./usePhantomClusterConnector";

type PhantomConnector = ReturnType<typeof usePhantomClusterConnector>;

const PhantomContext = createContext<PhantomConnector | null>(null);

const APP_URL =
  (process.env.EXPO_PUBLIC_PRIVY_CONNECT_APP_URL as string | undefined) ||
  "https://chachingsocial.io";

export function PhantomProvider({ children }: { children: React.ReactNode }) {
  const connector = usePhantomClusterConnector({
    appUrl: APP_URL,
    redirectUri: "/",
  });

  return (
    <PhantomContext.Provider value={connector}>
      {children}
    </PhantomContext.Provider>
  );
}

/**
 * Returns the single shared Phantom connector.
 * Must be called inside a <PhantomProvider> tree.
 */
export function usePhantom(): PhantomConnector {
  const ctx = useContext(PhantomContext);
  if (!ctx) {
    throw new Error("usePhantom must be used within a <PhantomProvider>");
  }
  return ctx;
}

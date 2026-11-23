import { useEffect, useState } from 'react';

type ExtensionSigner = {
  getPublicKey?: unknown;
  signEvent?: unknown;
};

function detectExtension(): boolean {
  if (typeof window === 'undefined') return false;
  const signer = (window as Window & { nostr?: ExtensionSigner }).nostr;
  return typeof signer?.getPublicKey === 'function' && typeof signer?.signEvent === 'function';
}

/**
 * Detect a NIP-07 browser extension (Alby, nos2x, Flamingo, etc.).
 * Re-checks shortly after mount and when the window regains focus, since some
 * extensions inject `window.nostr` slightly after page load.
 */
export function useNostrExtension() {
  const [available, setAvailable] = useState(detectExtension);

  useEffect(() => {
    const check = () => setAvailable(detectExtension());
    const timer = window.setTimeout(check, 500);
    window.addEventListener('focus', check);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('focus', check);
    };
  }, []);

  return { available, refresh: () => setAvailable(detectExtension()) };
}

/**
 * Platform Detector & Context Synchronization Module
 * Automatically resolves active token mint/contract address from Axiom & Padre pages.
 */

const BASE58_EXACT_REGEX = /\b[1-9A-HJ-NP-Za-km-z]{32,44}\b/;
const HEX_EXACT_REGEX = /\b0x[a-fA-F0-9]{40}\b/;

export function extractTokenAddress(rawUrl, bodyText = '') {
  // Strip query parameters and hash prior to URL matching
  const urlPath = rawUrl.split('?')[0].split('#')[0];

  // 1. Try URL path extraction
  const urlBase58Match = urlPath.match(BASE58_EXACT_REGEX);
  if (urlBase58Match) {
    return { address: urlBase58Match[0], source: 'URL' };
  }

  const urlHexMatch = urlPath.match(HEX_EXACT_REGEX);
  if (urlHexMatch) {
    return { address: urlHexMatch[0], source: 'URL' };
  }

  // 2. Try DOM body or active pair elements extraction
  const textBase58Match = bodyText.match(BASE58_EXACT_REGEX);
  if (textBase58Match) {
    return { address: textBase58Match[0], source: 'DOM' };
  }

  const textHexMatch = bodyText.match(HEX_EXACT_REGEX);
  if (textHexMatch) {
    return { address: textHexMatch[0], source: 'DOM' };
  }

  return null;
}

export function detectPlatform(hostname) {
  if (hostname.includes('axiom.trade')) return 'Axiom';
  if (hostname.includes('padre.gg')) return 'Padre';
  return 'Unknown';
}

export function initPlatformDetector(onTokenChangeCallback) {
  let currentToken = null;

  function checkContext() {
    const platform = detectPlatform(window.location.hostname);
    const resolved = extractTokenAddress(window.location.href, document.body ? document.body.innerText : '');

    if (resolved && resolved.address !== currentToken) {
      currentToken = resolved.address;
      onTokenChangeCallback({
        platform,
        address: currentToken,
        source: resolved.source,
        timestamp: Date.now()
      });
    }
  }

  // Initial check
  checkContext();

  // URL / History mutation listener for SPAs
  const observer = new MutationObserver(() => {
    checkContext();
  });

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  }

  window.addEventListener('popstate', checkContext);
  window.addEventListener('hashchange', checkContext);

  return {
    getCurrentToken: () => currentToken,
    disconnect: () => observer.disconnect()
  };
}

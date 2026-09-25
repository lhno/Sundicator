/**
 * Platform Detector & Context Synchronization Module
 * Automatically resolves active token mint/contract address from Axiom & Padre pages.
 */

const BASE58_REGEX = /[1-9A-HJ-NP-Za-km-z]{32,44}/;
const HEX_REGEX = /0x[a-fA-F0-9]{40}/;

export function extractTokenAddress(url, bodyText = '') {
  // 1. Try URL path extraction
  const urlMatches = url.match(BASE58_REGEX) || url.match(HEX_REGEX);
  if (urlMatches) {
    return { address: urlMatches[0], source: 'URL' };
  }

  // 2. Try DOM body or active pair elements extraction
  const textMatches = bodyText.match(BASE58_REGEX) || bodyText.match(HEX_REGEX);
  if (textMatches) {
    return { address: textMatches[0], source: 'DOM' };
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

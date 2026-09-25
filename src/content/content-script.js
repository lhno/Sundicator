// Content Script Entry Point

console.log('[Memecoin Intelligence Overlay] Injected into active platform.');

// Dynamically import overlay initializer
(async () => {
  try {
    const { initPlatformDetector } = await import(chrome.runtime.getURL('src/content/platform-detector.js'));
    const { initHUDOverlay } = await import(chrome.runtime.getURL('src/ui/hud-overlay.js'));

    const hud = initHUDOverlay();
    initPlatformDetector((tokenInfo) => {
      hud.updateTokenContext(tokenInfo);
    });
  } catch (err) {
    console.error('[Memecoin Intelligence Overlay] Initialization error:', err);
  }
})();

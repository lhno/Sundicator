/**
 * Injected Shadow DOM HUD Overlay UI Component
 */

import { evaluateRugRisk } from '../engines/rugpull.js';
import { analyzeBundlerAndInsiders } from '../engines/bundler.js';
import { calculateMomentumAndFlow } from '../engines/momentum.js';
import { calculateWinProbability } from '../engines/winscore.js';

export function initHUDOverlay() {
  const host = document.createElement('div');
  host.id = 'memecoin-intelligence-hud-root';
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });

  // Add styles
  const styleLink = document.createElement('link');
  styleLink.rel = 'stylesheet';
  styleLink.href = chrome.runtime.getURL('src/ui/styles.css');
  shadow.appendChild(styleLink);

  const container = document.createElement('div');
  container.className = 'hud-container';
  container.innerHTML = `
    <div class="hud-header" id="hud-drag-handle">
      <span class="hud-title">MEMECOIN INTELLIGENCE HUD</span>
      <div class="hud-controls">
        <span id="hud-toggle-dock">Dock</span>
        <span id="hud-minimize">_</span>
      </div>
    </div>
    <div class="hud-body" id="hud-body-content">
      <div class="hud-section">
        <div class="metric-row">
          <span class="metric-label">Token Mint:</span>
          <span class="metric-value" id="hud-token-addr">Detecting...</span>
        </div>
        <div class="metric-row" style="margin-top: 8px;">
          <span class="badge badge-gray" id="hud-verdict-badge">NEUTRAL / WAIT</span>
          <span class="metric-value" id="hud-win-score">Win Score: --%</span>
        </div>
      </div>

      <div class="hud-section">
        <div class="hud-section-title">1. Rug Risk & Authorities</div>
        <div class="metric-row">
          <span class="metric-label">Rug Risk:</span>
          <span class="metric-value" id="hud-rug-risk">--%</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Mint / Freeze Auth:</span>
          <span class="metric-value" id="hud-authorities">Checking...</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">LP Burn / Lock:</span>
          <span class="metric-value" id="hud-lp-status">Checking...</span>
        </div>
      </div>

      <div class="hud-section">
        <div class="hud-section-title">2. Bundler & Insiders</div>
        <div class="metric-row">
          <span class="metric-label">Block-0 Bundle %:</span>
          <span class="metric-value" id="hud-bundled-supply">--%</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Total Insider Control:</span>
          <span class="metric-value" id="hud-insider-control">--%</span>
        </div>
      </div>

      <div class="hud-section">
        <div class="hud-section-title">3. Momentum & CVD</div>
        <div class="metric-row">
          <span class="metric-label">Organic Volume:</span>
          <span class="metric-value" id="hud-organic-vol">--%</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">5m CVD Delta:</span>
          <span class="metric-value" id="hud-cvd-5m">$0</span>
        </div>
      </div>
    </div>
  `;

  shadow.appendChild(container);

  // Make HUD Draggable
  const header = shadow.querySelector('#hud-drag-handle');
  let isDragging = false, startX, startY, initialX, initialY;

  header.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    const rect = container.getBoundingClientRect();
    initialX = rect.left;
    initialY = rect.top;
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    container.style.left = `${initialX + dx}px`;
    container.style.top = `${initialY + dy}px`;
    container.style.right = 'auto';
  });

  window.addEventListener('mouseup', () => { isDragging = false; });

  return {
    updateTokenContext: (tokenInfo) => {
      const addrEl = shadow.querySelector('#hud-token-addr');
      if (addrEl) addrEl.innerText = `${tokenInfo.address.substring(0, 6)}...${tokenInfo.address.substring(tokenInfo.address.length - 4)}`;

      // Re-run intelligence engines with mock/live telemetry context
      const rugData = evaluateRugRisk({ mintAuthorityRevoked: true, freezeAuthorityRevoked: true, lpBurnPercent: 98, lpLockedPercent: 0, top10Concentration: 12 });
      const bundlerData = analyzeBundlerAndInsiders({ launchTransactions: [{ bundle: true, supplyPct: 8 }], walletClusters: [{ controlPct: 10 }] });
      const momentumData = calculateMomentumAndFlow({ takerBuyVolumeUSD: 50000, takerSellVolumeUSD: 10000, washVolumeUSD: 2000 });
      const winData = calculateWinProbability({ rugData, bundlerData, momentumData });

      // Update UI fields
      shadow.querySelector('#hud-rug-risk').innerText = `${rugData.overallRugRiskScore}%`;
      shadow.querySelector('#hud-bundled-supply').innerText = `${bundlerData.bundledSupplyPercent}%`;
      shadow.querySelector('#hud-insider-control').innerText = `${bundlerData.totalInsiderControlPercent}%`;
      shadow.querySelector('#hud-organic-vol').innerText = `${momentumData.organicVolumeRatio * 100}%`;
      shadow.querySelector('#hud-cvd-5m').innerText = `$${momentumData.cvd5m}`;
      shadow.querySelector('#hud-win-score').innerText = `Win Score: ${winData.winProbabilityScore}%`;

      const verdictBadge = shadow.querySelector('#hud-verdict-badge');
      verdictBadge.innerText = winData.actionableVerdict.badgeText;
      verdictBadge.className = `badge ${winData.actionableVerdict.badgeClass}`;
    }
  };
}

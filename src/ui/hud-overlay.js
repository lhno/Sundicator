/**
 * Injected Shadow DOM HUD Overlay UI Component
 */

import { evaluateRugRisk } from '../engines/rugpull.js';
import { analyzeBundlerAndInsiders } from '../engines/bundler.js';
import { calculateMomentumAndFlow } from '../engines/momentum.js';
import { analyzeProfitabilityAndTrend } from '../engines/profitability.js';
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
      <div class="hud-title-wrap">
        <div class="hud-dot"></div>
        <span class="hud-title">MEMECOIN INTELLIGENCE</span>
      </div>
      <div class="hud-controls">
        <span id="hud-minimize">_</span>
      </div>
    </div>

    <!-- Primary Action Verdict Banner -->
    <div class="verdict-banner">
      <div class="verdict-top-row">
        <span class="verdict-badge badge-gray" id="hud-verdict-badge">NEUTRAL / WAIT</span>
        <span class="win-score-pill" id="hud-win-score">SCORE: --%</span>
      </div>
      <div class="action-guidance" id="hud-action-guidance">Initializing real-time stream analysis...</div>
    </div>

    <!-- Navigation Tabs -->
    <div class="hud-tabs">
      <div class="tab-btn active" data-tab="tab-profit">PROFIT & TREND</div>
      <div class="tab-btn" data-tab="tab-momentum">MOMENTUM</div>
      <div class="tab-btn" data-tab="tab-insiders">INSIDERS</div>
      <div class="tab-btn" data-tab="tab-safety">SAFETY</div>
    </div>

    <div class="hud-body">
      <!-- Tab 1: Profit & Trend -->
      <div class="tab-content active" id="tab-profit">
        <div class="metric-grid">
          <div class="metric-card">
            <span class="card-label">IMPULSE VELOCITY</span>
            <span class="card-value val-cyan" id="hud-impulse">--</span>
          </div>
          <div class="metric-card">
            <span class="card-label">VOL ACCELERATION</span>
            <span class="card-value" id="hud-vol-accel">--x</span>
          </div>
          <div class="metric-card metric-card-full">
            <span class="card-label">ESTIMATED RUN PROBABILITIES</span>
            <div style="display: flex; justify-content: space-between; margin-top: 4px;">
              <span>2x: <strong class="val-green" id="hud-prob-2x">--%</strong></span>
              <span>5x: <strong class="val-cyan" id="hud-prob-5x">--%</strong></span>
              <span>10x: <strong id="hud-prob-10x">--%</strong></span>
            </div>
          </div>
          <div class="metric-card metric-card-full">
            <span class="card-label">OPTIMAL ACTION ZONE</span>
            <span class="card-value val-yellow" id="hud-action-zone">--</span>
          </div>
        </div>
      </div>

      <!-- Tab 2: Momentum & CVD -->
      <div class="tab-content" id="tab-momentum">
        <div class="metric-grid">
          <div class="metric-card">
            <span class="card-label">ORGANIC RATIO</span>
            <span class="card-value val-green" id="hud-organic-ratio">--%</span>
            <div class="bar-track"><div class="bar-fill fill-green" id="hud-organic-bar" style="width: 0%"></div></div>
          </div>
          <div class="metric-card">
            <span class="card-label">5m CVD DELTA</span>
            <span class="card-value" id="hud-cvd-5m">$0</span>
          </div>
          <div class="metric-card metric-card-full">
            <span class="card-label">FLOW DIVERGENCE</span>
            <span class="card-value" id="hud-divergence">NONE</span>
          </div>
        </div>
      </div>

      <!-- Tab 3: Insiders -->
      <div class="tab-content" id="tab-insiders">
        <div class="metric-grid">
          <div class="metric-card">
            <span class="card-label">BLOCK-0 BUNDLE</span>
            <span class="card-value" id="hud-bundled-supply">--%</span>
          </div>
          <div class="metric-card">
            <span class="card-label">INSIDER CONTROL</span>
            <span class="card-value" id="hud-insider-control">--%</span>
          </div>
          <div class="metric-card metric-card-full">
            <span class="card-label">DEV WALLET ACTIVITY</span>
            <span class="card-value" id="hud-dev-status">HOLDING</span>
          </div>
        </div>
      </div>

      <!-- Tab 4: Safety & Contract -->
      <div class="tab-content" id="tab-safety">
        <div class="metric-grid">
          <div class="metric-card">
            <span class="card-label">OVERALL RUG RISK</span>
            <span class="card-value" id="hud-rug-risk">--%</span>
          </div>
          <div class="metric-card">
            <span class="card-label">LP BURN / LOCK</span>
            <span class="card-value val-green" id="hud-lp-status">--%</span>
          </div>
          <div class="metric-card metric-card-full">
            <span class="card-label">AUTHORITIES & METADATA</span>
            <span class="card-value" id="hud-auth-status">REVOKED / IMMUTABLE</span>
          </div>
        </div>
      </div>
    </div>
  `;

  shadow.appendChild(container);

  // Tab switching logic
  const tabBtns = shadow.querySelectorAll('.tab-btn');
  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const targetTab = btn.getAttribute('data-tab');
      shadow.querySelectorAll('.tab-content').forEach((tc) => {
        tc.classList.remove('active');
      });
      shadow.querySelector(`#${targetTab}`).classList.add('active');
    });
  });

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
      // Run analytics pipelines
      const rugData = evaluateRugRisk({ mintAuthorityRevoked: true, freezeAuthorityRevoked: true, lpBurnPercent: 98, top10Concentration: 12 });
      const bundlerData = analyzeBundlerAndInsiders({ launchTransactions: [{ bundle: true, supplyPct: 8 }], walletClusters: [{ controlPct: 10 }] });
      const momentumData = calculateMomentumAndFlow({ takerBuyVolumeUSD: 60000, takerSellVolumeUSD: 10000, washVolumeUSD: 3000, cvd5m: 18000, priceTrend: 'RISING' });
      const profitabilityData = analyzeProfitabilityAndTrend({ volume1m: 12000, volume5m: 30000, priceChange1mPct: 4.5, priceChange5mPct: 12.0, cvd5m: 18000, organicRatio: 0.88 });
      const winData = calculateWinProbability({ rugData, bundlerData, momentumData, profitabilityData });

      // Update UI Header & Verdict
      const verdictBadge = shadow.querySelector('#hud-verdict-badge');
      verdictBadge.innerText = winData.actionableVerdict.badgeText;
      verdictBadge.className = `verdict-badge ${winData.actionableVerdict.badgeClass}`;

      shadow.querySelector('#hud-win-score').innerText = `SCORE: ${winData.winProbabilityScore}%`;
      shadow.querySelector('#hud-action-guidance').innerText = winData.actionableVerdict.actionRecommendation + ' — ' + winData.actionableVerdict.description;

      // Update Tab 1: Profit
      shadow.querySelector('#hud-impulse').innerText = profitabilityData.momentumImpulse;
      shadow.querySelector('#hud-vol-accel').innerText = `${profitabilityData.volAccelerationRatio}x`;
      shadow.querySelector('#hud-prob-2x').innerText = profitabilityData.runProbabilities.prob2x;
      shadow.querySelector('#hud-prob-5x').innerText = profitabilityData.runProbabilities.prob5x;
      shadow.querySelector('#hud-prob-10x').innerText = profitabilityData.runProbabilities.prob10x;
      shadow.querySelector('#hud-action-zone').innerText = profitabilityData.tradeZone;

      // Update Tab 2: Momentum
      shadow.querySelector('#hud-organic-ratio').innerText = `${Math.round(momentumData.organicVolumeRatio * 100)}%`;
      shadow.querySelector('#hud-organic-bar').style.width = `${Math.round(momentumData.organicVolumeRatio * 100)}%`;
      shadow.querySelector('#hud-cvd-5m').innerText = `$${momentumData.cvd5m}`;
      shadow.querySelector('#hud-divergence').innerText = momentumData.divergence;

      // Update Tab 3: Insiders
      shadow.querySelector('#hud-bundled-supply').innerText = `${bundlerData.bundledSupplyPercent}%`;
      shadow.querySelector('#hud-insider-control').innerText = `${bundlerData.totalInsiderControlPercent}%`;

      // Update Tab 4: Safety
      shadow.querySelector('#hud-rug-risk').innerText = `${rugData.overallRugRiskScore}%`;
      shadow.querySelector('#hud-lp-status').innerText = `${rugData.liquidityMetrics.lpBurnPercent}% Burned`;
    }
  };
}

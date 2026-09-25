/**
 * Probabilistic Run / Win Chance Engine
 * Synthesizes safety, insider control, momentum, and profitability into dynamic scores and actionable verdicts.
 */

import { analyzeProfitabilityAndTrend } from './profitability.js';

export function calculateWinProbability({ rugData = {}, bundlerData = {}, momentumData = {}, profitabilityData = null }) {
  const rugScore = rugData.overallRugRiskScore ?? 50;
  const bundledPct = bundlerData.bundledSupplyPercent ?? 0;
  const insiderPct = bundlerData.totalInsiderControlPercent ?? 0;
  const organicRatio = momentumData.organicVolumeRatio ?? 0.5;
  const cvd5m = momentumData.cvd5m ?? 0;
  const divergence = momentumData.divergence ?? 'NONE';

  const profData = profitabilityData || analyzeProfitabilityAndTrend({
    cvd5m,
    organicRatio
  });

  // 1. Calculate Win Score (0-100%)
  const safetyComponent = (100 - rugScore) * 0.20;
  const momentumComponent = (organicRatio * 100) * 0.25;
  const cleanlinessComponent = Math.max(0, 100 - (bundledPct + insiderPct)) * 0.25;
  const flowComponent = (cvd5m > 0 ? 15 : 0);
  const trendComponent = (profData.momentumImpulse === 'EXPLOSIVE' ? 15 : profData.momentumImpulse === 'BUILDING' ? 10 : 0);

  let winProbabilityScore = Math.round(safetyComponent + momentumComponent + cleanlinessComponent + flowComponent + trendComponent);
  winProbabilityScore = Math.min(100, Math.max(0, winProbabilityScore));

  // 2. Determine Actionable Verdict & Buy/Sell Guidance
  let actionableVerdict = {
    badgeText: 'NEUTRAL / WAIT',
    badgeClass: 'badge-gray',
    actionRecommendation: 'Hold off. Volume or order flow currently neutral.',
    description: 'Balanced order flow or insufficient history.'
  };

  if (rugScore > 70 || rugData.flags?.includes('HONEYPOT_DETECTED')) {
    actionableVerdict = {
      badgeText: 'DO NOT TRADE',
      badgeClass: 'badge-red',
      actionRecommendation: 'AVOID / EXIT IMMEDIATELY',
      description: 'Active contract vulnerability, honeypot, or high rug probability.'
    };
  } else if (divergence === 'BEARISH_DIVERGENCE' || bundlerData.alerts?.sniperDumping || profData.tradeZone === 'EXHAUSTION_EXIT') {
    actionableVerdict = {
      badgeText: 'TAKE PROFIT',
      badgeClass: 'badge-orange',
      actionRecommendation: 'SCALE OUT / LOCK IN GAINS',
      description: 'Buying pressure fading or insiders offloading into liquidity.'
    };
  } else if (profData.tradeZone === 'PRIME_ENTRY' || (winProbabilityScore >= 75 && rugScore <= 15 && bundledPct <= 10)) {
    actionableVerdict = {
      badgeText: 'AGGRESSIVE BUY',
      badgeClass: 'badge-green',
      actionRecommendation: 'HIGH CONVICTION ENTRY',
      description: 'Explosive volume acceleration with heavy organic taker buy pressure.'
    };
  } else if (profData.tradeZone === 'BREAKOUT_TRIGGER') {
    actionableVerdict = {
      badgeText: 'BREAKOUT ENTRY',
      badgeClass: 'badge-cyan',
      actionRecommendation: 'ENTER ON BREAKOUT',
      description: 'Volume building rapidly with strong buyer absorption.'
    };
  } else if (cvd5m > 0 && organicRatio >= 0.7) {
    actionableVerdict = {
      badgeText: 'QUICK SCALP',
      badgeClass: 'badge-yellow',
      actionRecommendation: 'TIGHT STOP SCALP',
      description: 'Short-term momentum present. Manage risk closely.'
    };
  }

  // 3. Risk / Reward Index
  const riskRewardIndex = parseFloat(((100 - rugScore) / Math.max(10, insiderPct + bundledPct)).toFixed(1));

  return {
    winProbabilityScore,
    actionableVerdict,
    riskRewardIndex,
    profitabilityData: profData
  };
}

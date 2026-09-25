/**
 * Probabilistic Run / Win Chance Engine
 * Synthesizes safety, insider control, and momentum into dynamic scores and actionable verdicts.
 */

export function calculateWinProbability({ rugData = {}, bundlerData = {}, momentumData = {} }) {
  const rugScore = rugData.overallRugRiskScore ?? 50;
  const bundledPct = bundlerData.bundledSupplyPercent ?? 0;
  const insiderPct = bundlerData.totalInsiderControlPercent ?? 0;
  const organicRatio = momentumData.organicVolumeRatio ?? 0.5;
  const cvd5m = momentumData.cvd5m ?? 0;
  const divergence = momentumData.divergence ?? 'NONE';

  // 1. Calculate Win Score (0-100%)
  const safetyComponent = (100 - rugScore) * 0.25;
  const momentumComponent = (organicRatio * 100) * 0.25;
  const cleanlinessComponent = Math.max(0, 100 - (bundledPct + insiderPct)) * 0.25;
  const flowComponent = (cvd5m > 0 ? 25 : 0);

  let winProbabilityScore = Math.round(safetyComponent + momentumComponent + cleanlinessComponent + flowComponent);
  winProbabilityScore = Math.min(100, Math.max(0, winProbabilityScore));

  // 2. Determine Actionable Verdict
  let actionableVerdict = {
    badgeText: 'NEUTRAL / WAIT',
    badgeClass: 'badge-gray',
    description: 'Balanced order flow or insufficient history.'
  };

  if (rugScore > 70 || rugData.flags?.includes('HONEYPOT_DETECTED')) {
    actionableVerdict = {
      badgeText: 'DO NOT TRADE / CRITICAL RISK',
      badgeClass: 'badge-red',
      description: 'Active authority risks, honeypot, or unlocked LP.'
    };
  } else if (divergence === 'BEARISH_DIVERGENCE' || bundlerData.alerts?.sniperDumping) {
    actionableVerdict = {
      badgeText: 'TAKE PROFIT / EXIT',
      badgeClass: 'badge-yellow',
      description: 'Bearish CVD divergence or insider wallet offloading detected.'
    };
  } else if (winProbabilityScore >= 75 && rugScore <= 15 && bundledPct <= 10) {
    actionableVerdict = {
      badgeText: 'STRONG BUY',
      badgeClass: 'badge-green',
      description: 'High organic momentum, low bundle %, clean contract.'
    };
  } else if (cvd5m > 0 && organicRatio >= 0.7) {
    actionableVerdict = {
      badgeText: 'SCALP ONLY',
      badgeClass: 'badge-yellow',
      description: 'Strong short-term buying pressure despite elevated insider concentration.'
    };
  }

  // 3. Risk / Reward Index
  const riskRewardIndex = parseFloat(((100 - rugScore) / Math.max(10, insiderPct + bundledPct)).toFixed(1));

  return {
    winProbabilityScore,
    actionableVerdict,
    riskRewardIndex
  };
}

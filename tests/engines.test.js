import test from 'node:test';
import assert from 'node:assert/strict';

import { extractTokenAddress, detectPlatform } from '../src/content/platform-detector.js';
import { evaluateRugRisk } from '../src/engines/rugpull.js';
import { analyzeBundlerAndInsiders } from '../src/engines/bundler.js';
import { calculateMomentumAndFlow } from '../src/engines/momentum.js';
import { analyzeProfitabilityAndTrend } from '../src/engines/profitability.js';
import { calculateWinProbability } from '../src/engines/winscore.js';

test('Platform Detector resolves token address from URL', () => {
  const url = 'https://axiom.trade/token/7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8u7ppump?chain=sol';
  const result = extractTokenAddress(url);
  assert.equal(result.address, '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8u7ppump');
  assert.equal(result.source, 'URL');
});

test('Platform Detector identifies host platforms correctly', () => {
  assert.equal(detectPlatform('axiom.trade'), 'Axiom');
  assert.equal(detectPlatform('trade.padre.gg'), 'Padre');
  assert.equal(detectPlatform('google.com'), 'Unknown');
});

test('Rugpull Engine evaluates risk scores and flags accurately', () => {
  const cleanToken = evaluateRugRisk({
    mintAuthorityRevoked: true,
    freezeAuthorityRevoked: true,
    lpBurnPercent: 100,
    top10Concentration: 15
  });
  assert.equal(cleanToken.overallRugRiskScore, 0);

  const riskyToken = evaluateRugRisk({
    mintAuthorityRevoked: false,
    freezeAuthorityRevoked: false,
    isHoneypot: true
  });
  assert.equal(riskyToken.overallRugRiskScore, 100);
  assert.ok(riskyToken.flags.includes('HONEYPOT_DETECTED'));
});

test('Bundler Engine sums bundle % and identifies sniper dump alerts', () => {
  const result = analyzeBundlerAndInsiders({
    launchTransactions: [
      { bundle: true, supplyPct: 10 },
      { jitoTip: true, supplyPct: 15 }
    ],
    walletClusters: [{ controlPct: 20 }],
    sniperRecentSellsPct: 20
  });

  assert.equal(result.bundledSupplyPercent, 25);
  assert.equal(result.totalInsiderControlPercent, 20);
  assert.equal(result.alerts.sniperDumping, true);
});

test('Profitability Engine calculates volume acceleration and run probabilities', () => {
  const prof = analyzeProfitabilityAndTrend({
    volume1m: 10000,
    volume5m: 20000,
    priceChange1mPct: 4.0,
    priceChange5mPct: 12.0,
    cvd5m: 15000,
    organicRatio: 0.9
  });

  assert.equal(prof.momentumImpulse, 'EXPLOSIVE');
  assert.equal(prof.tradeZone, 'PRIME_ENTRY');
  assert.ok(parseInt(prof.runProbabilities.prob2x) > 50);
});

test('Win Score Engine produces correct Verdict Badges and Action Guidance', () => {
  const strongBuyWin = calculateWinProbability({
    rugData: { overallRugRiskScore: 5 },
    bundlerData: { bundledSupplyPercent: 5, totalInsiderControlPercent: 10 },
    momentumData: { organicVolumeRatio: 0.9, cvd5m: 20000 },
    profitabilityData: { momentumImpulse: 'EXPLOSIVE', tradeZone: 'PRIME_ENTRY' }
  });

  assert.equal(strongBuyWin.actionableVerdict.badgeText, 'AGGRESSIVE BUY');
  assert.equal(strongBuyWin.actionableVerdict.actionRecommendation, 'HIGH CONVICTION ENTRY');

  const criticalRiskWin = calculateWinProbability({
    rugData: { overallRugRiskScore: 85, flags: ['HONEYPOT_DETECTED'] },
    bundlerData: { bundledSupplyPercent: 50 },
    momentumData: { organicVolumeRatio: 0.2 }
  });

  assert.equal(criticalRiskWin.actionableVerdict.badgeText, 'DO NOT TRADE');
});

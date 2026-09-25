/**
 * Profitability & Trend Velocity Engine
 * Evaluates volume acceleration, momentum impulse, multiplier run probabilities, and optimal entry/exit zones.
 */

export function analyzeProfitabilityAndTrend(data = {}) {
  const {
    volume1m = 5000,
    volume5m = 20000,
    volume15m = 40000,
    priceChange1mPct = 2.5,
    priceChange5mPct = 8.0,
    liquidityUSD = 25000,
    fdvUSD = 150000,
    cvd5m = 12000,
    organicRatio = 0.85,
    smartMoneyCount = 3
  } = data;

  // 1. Trend Momentum Velocity & Acceleration
  const avg1mVolIn5m = volume5m / 5;
  const volAccelerationRatio = avg1mVolIn5m > 0 ? parseFloat((volume1m / avg1mVolIn5m).toFixed(2)) : 1;

  let momentumImpulse = 'STABLE'; // 'EXPLOSIVE', 'BUILDING', 'STABLE', 'FADING'
  if (volAccelerationRatio > 2.0 && priceChange1mPct > 3) {
    momentumImpulse = 'EXPLOSIVE';
  } else if (volAccelerationRatio > 1.2 && priceChange5mPct > 5) {
    momentumImpulse = 'BUILDING';
  } else if (priceChange5mPct < -5 || volAccelerationRatio < 0.5) {
    momentumImpulse = 'FADING';
  }

  // 2. Multiplier & Profit Potential Estimator (2x / 5x / 10x Run Probability)
  const liqFdvRatio = fdvUSD > 0 ? (liquidityUSD / fdvUSD) * 100 : 0;

  let probability2x = Math.round(organicRatio * 40 + (cvd5m > 0 ? 30 : 0) + (smartMoneyCount * 10));
  if (liqFdvRatio < 3) probability2x -= 20; // Shallow pool ceiling
  probability2x = Math.min(95, Math.max(5, probability2x));

  let probability5x = Math.round(probability2x * 0.6 + (momentumImpulse === 'EXPLOSIVE' ? 20 : 0));
  probability5x = Math.min(85, Math.max(2, probability5x));

  let probability10x = Math.round(probability5x * 0.4);
  probability10x = Math.min(70, Math.max(1, probability10x));

  // 3. Entry & Exit Signal Zone
  let tradeZone = 'NEUTRAL_WAIT'; // 'PRIME_ENTRY', 'BREAKOUT_TRIGGER', 'SCALP_ZONE', 'EXHAUSTION_EXIT', 'NEUTRAL_WAIT'
  if (momentumImpulse === 'EXPLOSIVE' && organicRatio >= 0.8 && cvd5m > 0) {
    tradeZone = 'PRIME_ENTRY';
  } else if (momentumImpulse === 'BUILDING' && priceChange5mPct > 10) {
    tradeZone = 'BREAKOUT_TRIGGER';
  } else if (cvd5m > 0 && priceChange1mPct > 1) {
    tradeZone = 'SCALP_ZONE';
  } else if (momentumImpulse === 'FADING' && priceChange5mPct < 0) {
    tradeZone = 'EXHAUSTION_EXIT';
  }

  return {
    volAccelerationRatio,
    momentumImpulse,
    runProbabilities: {
      prob2x: `${probability2x}%`,
      prob5x: `${probability5x}%`,
      prob10x: `${probability10x}%`
    },
    tradeZone
  };
}

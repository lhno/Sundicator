/**
 * Smart Buy/Sell Momentum & Flow Engine
 * Filters wash trading, calculates CVD across timeframes, and identifies divergences.
 */

export function calculateMomentumAndFlow(data = {}) {
  const {
    takerBuyVolumeUSD = 0,
    takerSellVolumeUSD = 0,
    washVolumeUSD = 0,
    cvd1m = 0,
    cvd5m = 0,
    cvd15m = 0,
    priceTrend = 'NEUTRAL', // 'RISING', 'FALLING', 'NEUTRAL'
    uniqueBuyers = 10,
    uniqueSellers = 10,
    smartMoneyNetInflowUSD = 0
  } = data;

  const totalVolumeUSD = takerBuyVolumeUSD + takerSellVolumeUSD;
  const organicVolumeUSD = Math.max(0, totalVolumeUSD - washVolumeUSD);
  const organicVolumeRatio = totalVolumeUSD > 0 ? organicVolumeUSD / totalVolumeUSD : 1;

  // CVD Calculation
  const netCVD5m = cvd5m || (takerBuyVolumeUSD - takerSellVolumeUSD);

  // Divergence Detection
  let divergence = 'NONE';
  if (priceTrend === 'RISING' && netCVD5m < 0) {
    divergence = 'BEARISH_DIVERGENCE';
  } else if (priceTrend === 'FALLING' && netCVD5m > 0) {
    divergence = 'BULLISH_DIVERGENCE';
  }

  // Participant Quality
  const buyerSellerRatio = uniqueSellers > 0 ? uniqueBuyers / uniqueSellers : 1;

  return {
    organicVolumeUSD,
    washVolumeUSD,
    organicVolumeRatio: parseFloat(organicVolumeRatio.toFixed(2)),
    cvd1m,
    cvd5m: netCVD5m,
    cvd15m,
    divergence,
    buyerSellerRatio: parseFloat(buyerSellerRatio.toFixed(2)),
    smartMoneyNetInflowUSD
  };
}

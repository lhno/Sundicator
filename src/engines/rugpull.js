/**
 * Intelligent Rugpull & Scam Protection Engine
 * Calculates overall rug risk score (0-100%) and specific scam flags.
 */

export function evaluateRugRisk(telemetry = {}) {
  const {
    mintAuthorityRevoked = false,
    freezeAuthorityRevoked = false,
    isMetadataMutable = false,
    lpBurnPercent = 0,
    lpLockedPercent = 0,
    lpUnlockDaysRemaining = 999,
    liquidityUSD = 10000,
    fdvUSD = 100000,
    isHoneypot = false,
    buyTaxPercent = 0,
    sellTaxPercent = 0,
    hasDynamicTax = false,
    hasBlacklistFunction = false,
    top10Concentration = 0,
    maxSingleWalletHoldPercent = 0
  } = telemetry;

  let riskScore = 0;
  const flags = [];

  // 1. Authority Risks (30% max weight)
  if (!mintAuthorityRevoked) {
    riskScore += 30;
    flags.push('MINT_AUTHORITY_ACTIVE');
  }
  if (!freezeAuthorityRevoked) {
    riskScore += 30;
    flags.push('FREEZE_AUTHORITY_ACTIVE');
  }

  // 2. Metadata Integrity
  if (isMetadataMutable) {
    riskScore += 10;
    flags.push('MUTABLE_METADATA');
  }

  // 3. Liquidity Mechanics (25% max weight)
  const totalSafeLP = lpBurnPercent + lpLockedPercent;
  if (totalSafeLP < 80) {
    riskScore += 25;
    flags.push('UNLOCKED_LP');
  } else if (lpLockedPercent > 0 && lpUnlockDaysRemaining < 7) {
    riskScore += 15;
    flags.push('LP_UNLOCK_SOON');
  }

  const liqToFdvRatio = fdvUSD > 0 ? (liquidityUSD / fdvUSD) * 100 : 0;
  if (liqToFdvRatio < 5) {
    riskScore += 10;
    flags.push('SHALLOW_LIQUIDITY');
  }

  // 4. Honeypot & Tax Diagnostics (25% max weight)
  if (isHoneypot) {
    riskScore = 100;
    flags.push('HONEYPOT_DETECTED');
  }
  if (buyTaxPercent > 5 || sellTaxPercent > 5) {
    riskScore += 15;
    flags.push('HIGH_TAX');
  }
  if (hasDynamicTax) {
    riskScore += 20;
    flags.push('DYNAMIC_TAX');
  }
  if (hasBlacklistFunction) {
    riskScore += 15;
    flags.push('BLACKLIST_FUNCTION');
  }

  // 5. Holder Dispersion (20% max weight)
  if (top10Concentration > 30) {
    riskScore += 20;
    flags.push('HIGH_HOLDER_CONCENTRATION');
  }
  if (maxSingleWalletHoldPercent > 5) {
    riskScore += 15;
    flags.push('WHALE_CONCENTRATION');
  }

  // Clamp score between 0 and 100
  const finalRiskScore = Math.min(100, Math.max(0, riskScore));

  return {
    overallRugRiskScore: finalRiskScore,
    flags,
    authorityState: {
      mintAuthorityRevoked,
      freezeAuthorityRevoked
    },
    liquidityMetrics: {
      lpBurnPercent,
      lpLockedPercent,
      liqToFdvRatio
    },
    holderMetrics: {
      top10Concentration,
      maxSingleWalletHoldPercent
    }
  };
}

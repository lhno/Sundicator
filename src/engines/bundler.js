/**
 * Bundler & Insider Detection Engine
 * Identifies block-0 Jito/MEV bundles, wallet clusters, dev wallet sales, and sniper dumps.
 */

export function analyzeBundlerAndInsiders(data = {}) {
  const {
    launchTransactions = [],
    walletClusters = [],
    devWallet = { initialSupplyPct: 0, currentSupplyPct: 0, totalSoldPct: 0 },
    sniperRecentSellsPct = 0
  } = data;

  // 1. Calculate Genesis / Block-0 Bundled Supply %
  let bundledSupplyPercent = 0;
  let bundleTxCount = 0;

  launchTransactions.forEach((tx) => {
    if (tx.bundle || tx.jitoTip) {
      bundledSupplyPercent += tx.supplyPct || 0;
      bundleTxCount++;
    }
  });

  // 2. Wallet Cluster Analysis
  let totalInsiderControlPercent = 0;
  walletClusters.forEach((cluster) => {
    totalInsiderControlPercent += cluster.controlPct || 0;
  });

  // 3. Dev Wallet Tracking
  const devOffloaded = devWallet.totalSoldPct > 0;

  // 4. Sniper Dumping Alert Trigger
  const isSniperDumping = sniperRecentSellsPct > 15;

  return {
    bundledSupplyPercent: Math.min(100, bundledSupplyPercent),
    bundleTxCount,
    totalInsiderControlPercent: Math.min(100, totalInsiderControlPercent),
    devWalletStatus: {
      initialSupplyPct: devWallet.initialSupplyPct,
      currentSupplyPct: devWallet.currentSupplyPct,
      devOffloaded
    },
    alerts: {
      sniperDumping: isSniperDumping
    }
  };
}

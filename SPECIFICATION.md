# PRODUCT & TECHNICAL ARCHITECTURE SPECIFICATION
## High-Performance Real-Time Memecoin Intelligence Overlay (Chrome Extension)
**Document Version:** 1.0.0
**Role:** Principal Product Architect & Senior Trading Systems Designer
**Target Environments:** Axiom (`axiom.trade`), Padre (`trade.padre.gg`)

---

## Executive Summary
This document defines the functional, analytical, UX, and logic specifications for an enterprise-grade Chrome Extension designed to serve as an in-line, real-time intelligence overlay for DEX traders on Axiom and Padre. The system processes raw blockchain telemetry, mempool streams, transaction graphs, and order flow metrics to output instant risk flags, insider cluster metrics, momentum analytics, and probabilistic win scores without interrupting trading operations.

---

## 1. Platform Integration & Auto-Detection Architecture

### 1.1 Platform Support & Context Injection
* **Target Domains:**
  * `axiom.trade` (and associated subdomains/routes)
  * `trade.padre.gg` (and associated subdomains/routes)
* **Injection Strategy:**
  * Shadow DOM isolation to guarantee zero CSS/JS conflict with host site styling or event listeners.
  * Zero-latency DOM observer that detects route transitions, tab switches, and modal overlays within host Single Page Applications (SPAs).

### 1.2 Active Token Auto-Resolution Logic
* **Extraction Hierarchy:**
  1. **URL Route Parsing:** Instant extraction of Solana/EVM mint/contract addresses directly from URL path variables (e.g., `/token/{mint_address}`).
  2. **Active DOM Extraction:** Scrapes active page headings, trading pair selector buttons, contract copy buttons, and WebSocket frame payloads if URL path is ambiguous or dynamic.
  3. **Address Validation:** Real-time regex verification for base58 (Solana) and hexadecimal (EVM) standard address strings prior to triggering telemetry pipelines.
* **Resolution Failure Handling:** Fallback to fallback search widget inside the HUD if active token contract cannot be uniquely identified from page context.

### 1.3 Non-Intrusive HUD Overlay UX Specification
* **Layout Modes:**
  * **Floating Widget Mode:** Draggable overlay window anchored to user-defined screen coordinates. Position persistence saved across browser sessions per platform.
  * **Collapsible Sidebar Docking:** Anchored panel snap-docked to left or right screen edge with quick-toggle shortcut (`Alt + S` / `Cmd + Shift + S`).
  * **Compact Bar / HUD Header:** Single horizontal telemetry ribbon affixed to top/bottom chart boundary.
* **Non-Obstruction Guarantees:**
  * Auto-avoidance logic: Default positioning avoids active placement zones for host execution buttons (Buy/Sell/Quick Swap), price charts, and order books.
  * Configurable background opacity (0%–100%) and backplate backdrop filter blur.

### 1.4 Context Synchronization & State Lifecycle
* **Trigger Events:**
  * SPA URL route change (`pushState`, `replaceState`, `popstate`).
  * Token search / list item selection on host page.
  * Manual user address entry within overlay.
* **State Management Lifecycle:**
  1. **T0 (0 ms):** Lock UI, set indicators to skeleton loading state, display previous token cached snapshot if requested.
  2. **T1 (<100 ms):** Resolve contract address and initiate parallel RPC/telemetry queries.
  3. **T2 (<300 ms):** Hydrate Rug Risk, Authority, and Metadata states.
  4. **T3 (<500 ms):** Complete Bundle, Wallet Cluster, and CVD metrics calculation.
  5. **T4 (Continuous):** Maintain WebSocket telemetry stream updates at 100ms refresh tick rate.

---

## 2. Intelligent Rugpull & Scam Protection Engine

### 2.1 Overall Rug Risk Scoring Model
* **Output:** Scaled integer value from **0% (Safest)** to **100% (Guaranteed Scam / Dead Token)**.
* **Formula Confluence Weighting:**
  * Authority Risks (Mint/Freeze): 30% total score weight.
  * Liquidity Mechanics (Burn/Lock/FDV Ratio): 25% total score weight.
  * Honeypot & Tax Diagnostics: 25% total score weight.
  * Holder Concentration & Dispersion: 20% total score weight.

### 2.2 Telemetry Outputs & Safety Verification Matrix

| Parameter / Feature | Detection Logic & Rule Set | Required UI Visual Output | Risk Score Impact |
| :--- | :--- | :--- | :--- |
| **Mint Authority** | Inspect token mint account data for active delegate/owner keys. | Badge: `MINT REVOKED` (Green) vs. `MINT ACTIVE` (Red Flash) | +30% Risk if Active |
| **Freeze Authority** | Inspect token account freeze authority status. | Badge: `FREEZE REVOKED` (Green) vs. `FREEZE ACTIVE` (Red Flash) | +30% Risk if Active |
| **Metadata Integrity** | Verify immutability flag in token metadata header. | Badge: `IMMUTABLE METADATA` (Green) vs. `MUTABLE METADATA` (Yellow) | +10% Risk if Mutable |
| **LP Burn Verification** | Track LP tokens sent to standard burn addresses (`1111...1111`, Dead/Null address). | Metric: `LP Burned: XX.X%` (ProgressBar) | 0% Risk penalty if >95% burned |
| **LP Lock Verification** | Verify LP tokens locked in known locker contracts (Uncx, PinkSale, Team Finance, Streamflow, Raydium LP lock). | Metric: `LP Locked: XX.X%` + Countdown Timer (`Unlock in: Xd Xh`) | Warning Badge if Unlock < 7 Days |
| **Unlocked LP Warning** | Quantify percentage of LP residing in unlocked developer/unverified wallets. | Alarm Flag: `UNLOCKED LP: XX.X%` (Red) | +25% Risk if Unlocked > 10% |
| **Liquidity-to-FDV Ratio** | Ratio calculation: `(Total Pool Liquidity USD) / (Fully Diluted Valuation USD)`. | Metric: `Liq/FDV: X.XX%` | Flag `SHALLOW LIQUIDITY` if Ratio < 5% |
| **Honeypot Diagnostics** | Simulate test transaction execution in isolated local validator context. | Indicator: `HONEYPOT CLEAR` vs `HONEYPOT DETECTED` | +100% Risk if Honeypot |
| **Buy & Sell Taxes** | Extract actual realized taxes from contract transfer hooks / simulated swaps. | Metric: `Buy Tax: X% | Sell Tax: X%` | Flag `HIGH TAX` if Tax > 5% |
| **Dynamic/Asymmetric Tax** | Detect conditional fee structures (e.g., sell tax scaling with token hold duration). | Alert Badge: `DYNAMIC TAX DETECTED` | +20% Risk if detected |
| **Max Wallet / Tx Caps** | Evaluate max transfer limits imposed by token contract logic. | Metric: `Max Wallet: X% | Max Tx: X%` | Info Tag |
| **Whitelist / Blacklist** | Scan contract byte code for restriction/pause logic. | Alert Badge: `BLACKLIST FUNCTION PRESENT` | +15% Risk if present |
| **Holder Dispersion** | Sum percentage supply held by Top 10 and Top 20 non-DEX, non-burn, non-locker addresses. | Graph: `Top 10: XX% | Top 20: XX%` | High risk alert if Top 10 > 30% |
| **Whale Threshold Alert** | Detect single non-DEX wallet holding >5% circulating supply. | Metric: `Whale Alert: Wallet [Addr] holds X%` | Flag `WHALE CONCENTRATION` |

---

## 3. Bundler & Insider Detection Engine

### 3.1 Genesis / Block-0 Bundle Analytics
* **Block-0 Scanning Engine:**
  * Analyzes atomic transactions executed in the exact block slot where liquidity was added.
  * Identifies Jito tip accounts, MEV bundle signatures, and shared gas fees.
* **Outputs:**
  * **Bundled Supply Percentage:** Total percentage of token supply acquired via atomic multi-buy bundles at launch.
  * **Bundle Tx Count & Wallet Count:** Number of distinct wallets involved in the launch bundle execution.
  * **Average Entry Cost:** Volume-weighted average entry price achieved by bundled buyers vs. public buyers.

### 3.2 Wallet Cluster & Sybil Analysis
* **Clustering Criteria:**
  1. **Common Funder Tracking:** Grouping wallets funded by identical parent addresses within a 72-hour window prior to token launch.
  2. **Exchange Sub-Account Mapping:** Identifying multiple destination wallets receiving initial gas funding from single centralized exchange withdrawal slots or mixers (Tornado, ChangeNOW, FixedFloat).
  3. **Behavioral Co-Execution:** Grouping wallets that buy or sell within identical block slots using synchronized tip/gas configurations.
* **Outputs:**
  * **Total Insider Control %:** Combined circulating supply held across all identified insider clusters.
  * **Cluster Graph Breakdown:** Categorized breakdown showing Top Cluster 1 (e.g., 5 wallets holding 12.4%), Top Cluster 2, etc.

### 3.3 Developer Wallet Lifecycle Tracking
* **Deployer Trace Mechanics:**
  * Initial token percentage minted or transferred to dev address.
  * Active monitoring of dev wallet outbound transactions.
* **Output Signals:**
  * **Dev Retained Supply:** `Dev Wallet Balance: X.XX%`.
  * **Secondary Offloading Detection:** Tracks dev transfers to fresh unlinked wallets or automated market maker pools.
  * **Real-time Dev Action Badges:**
    * `DEV SOLD X%` (Red Alert Banner)
    * `DEV TRANSFERRED TO FRESH WALLET` (Yellow Caution Banner)
    * `DEV BURNT REMAINING SUPPLY` (Green Banner)

### 3.4 Sniper Dumping & Offload Warnings
* **Algorithm:** Monitors real-time sell transactions originating from identified sniper/bundled wallet sets.
* **Trigger Threshold:** Triggers `SNIPER DUMPING IN PROGRESS` alert when identified sniper cluster wallets sell >15% of their aggregate holdings within a rolling 3-minute period.

---

## 4. Smart Buy/Sell Momentum & Flow Engine

### 4.1 Wash Trading & Bot Filtering Pipeline
* **Wash Detection Heuristics:**
  * High-frequency ping-pong trading between wallet pairs within <2 seconds.
  * Repetitive identical volume transactions (e.g., $1.00 buys repeating continuously to fabricate transaction count).
  * Circular liquidity movements yielding zero net balance shift.
* **Output Metrics:**
  * **Volume Decomposition:**
    * **Organic Volume (USD):** Pure, non-synthetic trading volume.
    * **Synthetic/Wash Volume (USD):** Isolated bot/wash volume percentage.
  * **Adjusted Volume Bar:** Dual-color volume histogram visualizing organic vs. wash activity.

### 4.2 Cumulative Volume Delta (CVD) Engine
* **Calculation Methodology:**
  * Taker Buy Volume minus Taker Sell Volume over discrete rolling timeframes.
  * Discrete evaluation windows: **1m**, **5m**, **15m**.
* **Outputs:**
  * **CVD Value (USD / Tokens):** Delta metric for selected timeframe.
  * **Divergence Detection Engine:**
    * **Bearish CVD Divergence:** Price reaching Higher Highs while 5m CVD reaches Lower Lows (Signals aggressive market seller absorption or insider offloading into retail buying).
    * **Bullish CVD Divergence:** Price reaching Lower Lows while 5m CVD reaches Higher Highs (Signals aggressive market buyer absorption).
  * **Visual Output:** Mini inline CVD chart with overlay divergence indicators.

### 4.3 Participant Quality & Order Flow Dynamics
* **Metrics & Indicators:**
  * **Unique Buyer/Seller Ratio:** `Unique Buyers (15m) / Unique Sellers (15m)` (Identifies retail dispersion vs. concentrated distribution).
  * **Average Trade Size Ratio:** Comparison of average buy transaction size vs. average sell transaction size.
    * *Whale Accumulation Pattern:* Low unique buyer count + High avg buy size.
    * *Retail FOMO / Distribution Pattern:* High unique buyer count + Low avg buy size paired with Large avg sell size.

### 4.4 Smart Money Presence Signal
* **Definition:** Integration with a dynamic directory of verified, historically profitable meme-trading wallets (high Win Rate, high Sharpe Ratio traders).
* **Outputs:**
  * **Smart Money Net Flow:** Total capital inflows/outflows from tracked wallets over 1h/24h.
  * **Smart Entry Toast:** Real-time notification: `Smart Wallet [Alias/ShortAddr] BOUGHT $X,XXX (X.X SOL)`.

---

## 5. Probabilistic Run / Win Chance Engine

### 5.1 Moonshot / Win Probability Score (0%–100%)
* **Description:** A consolidated, dynamic confidence score estimating the probability of sustained upward price expansion vs. imminent collapse.
* **Weighting Algorithm Breakdown:**
  * **Safety Score (Rug Risk Inverse):** 25% Weight.
  * **Organic Momentum & CVD Trend:** 25% Weight.
  * **Bundle & Insider Cleanliness (Low Insider Control %):** 25% Weight.
  * **Liquidity & Holder Dispersion:** 15% Weight.
  * **Smart Money Net Inflows:** 10% Weight.

### 5.2 Actionable Signal Badges (Verdict Classification)

The HUD displays a prominent visual badge corresponding to current market structure:

```
+-----------------------------------------------------------------------+
|  [ STRONG BUY ]  |  [ SCALP ONLY ]  |  [ NEUTRAL / WAIT ]             |
|  [ TAKE PROFIT ] |  [ DO NOT TRADE / CRITICAL RISK ]                  |
+-----------------------------------------------------------------------+
```

* **Verdict Criteria Matrix:**
  * **`STRONG BUY` (Green):**
    * Win Probability Score ≥ 75%
    * Rug Risk ≤ 15%
    * Bundled Supply ≤ 10%
    * 5m CVD Positive & Organic Volume Ratio ≥ 80%
  * **`SCALP ONLY` (Yellow):**
    * High 1m/5m positive CVD & volume momentum
    * Insider Control % elevated (20%–45%) or Unlocked LP present
    * Rug Risk between 20% and 50%
  * **`NEUTRAL / WAIT` (Gray):**
    * Low volume delta, sideways CVD, or token age < 2 minutes with inconclusive order flow
  * **`TAKE PROFIT / EXIT` (Orange):**
    * Bearish CVD divergence detected
    * Identified sniper/dev wallets actively offloading (>5% insider supply sold in 5m)
    * Organic volume dropping while wash volume spikes
  * **`DO NOT TRADE / CRITICAL RISK` (Red Flash):**
    * Active Mint/Freeze Authority OR Honeypot detected OR LP Unlocked > 50% OR Rug Risk > 70%

### 5.3 Risk / Reward Index
* **Metric Output:** Numerical ratio `X.X : 1` (e.g., `3.4 : 1 R/R`).
* **Derivation:** Measures distance to next structural liquidity level/ATH vs. downside distance to LP floor and concentrated insider cost basis.

---

## 6. User Customization, Styling & Alert System

### 6.1 Visual & Audio Alert Configuration
* **Alert Triggers (User-Configurable Thresholds):**
  * Bundled Supply Threshold exceeded (e.g., Alert if > 20%).
  * Dev Wallet Sell Event exceeding user-defined threshold (e.g., Dev sells > 0.5% supply).
  * Smart Money Entry / Exit threshold.
  * Rug Risk score increase above target limit.
  * Verdict change (e.g., transition from `NEUTRAL` to `STRONG BUY`).
* **Output Mediums:**
  * **Audio Signals:** Custom spatial sound cues per alert severity (Low pitch warning vs. High pitch opportunity chime).
  * **Visual Cues:** Screen edge flash overlay (Red border pulse for critical risk, Green border pulse for strong entry signal).
  * **Browser Desktop Push Notifications:** Optional desktop notifications when extension runs in background tab.

### 6.2 Custom Weighting & Sensitivity Controls
* **Risk Tolerance Profiles:**
  * **Conservative:** Increases weight of LP locks, authorities, and holder dispersion.
  * **Balanced (Default):** Standard algorithmic weighting.
  * **Degen / High Risk:** Decreases penalty for insider concentration if short-term CVD momentum is extreme.
* **Sensitivity Sliders:** Manual sliders allowing traders to adjust thresholds for wash trading filters, cluster detection strictness, and CVD divergence sensitivity.

### 6.3 Native Dark Mode & Seamless Host UI Integration
* **Theme Matching:** Auto-detects active theme on `axiom.trade` and `trade.padre.gg`.
* **Design Standards:**
  * Color Palette: Deep dark backplates (`#0B0E14`, `#131722`), high-contrast typography (`#E0E6ED`), neon status accents (`#00F2FE`, `#FF0055`, `#00FF87`, `#FFB800`).
  * Typography: Monospaced numeric font for prices, percentages, and addresses (`JetBrains Mono` / `Roboto Mono`).
  * Compact Footprint: Minimizes screen real estate usage with expandable micro-sections.

---

## 7. Complete User Interface Layout & Component Specification

```
+-----------------------------------------------------------------+
| [=] MEMECOIN INTELLIGENCE HUD                 [Scale] [_] [X]   |
+-----------------------------------------------------------------+
| TOKEN: $TICKER (0x1234...abcd)             [SYNC: AXIOM OK]     |
| VERDICT:  >>> [ STRONG BUY ] <<<           WIN SCORE: 84%       |
| RUG RISK: [ 12% SAFE ]                     R/R INDEX: 3.8:1     |
+-----------------------------------------------------------------+
| 1. SCAM PROTECTION & AUTHORITIES                                |
|   Mint Auth:  [ REVOKED ]      Freeze Auth: [ REVOKED ]         |
|   Metadata:   [ IMMUTABLE ]    Honeypot:    [ PASSED ]          |
|   LP Status:  [ 98.5% BURNED ] Liq/FDV:     [ 14.2% ]           |
|   Taxes:      [ Buy 0% | Sell 0% ]                              |
|   Holders:    [ Top 10: 14.2% | Top 20: 22.1% ]                 |
+-----------------------------------------------------------------+
| 2. BUNDLER & INSIDER ANALYSIS                                   |
|   Block-0 Bundle: [ 8.4% Supply | 12 Wallets ]                  |
|   Total Insiders: [ 14.2% Supply across 3 Clusters ]            |
|   Dev Wallet:     [ Holds 0.0% | 0 Offloads Detected ]          |
|   Sniper Status:  [ HOLDING - No Dump Detected ]                |
+-----------------------------------------------------------------+
| 3. MOMENTUM & ORDER FLOW                                        |
|   Organic Vol: [ 88% ($142.5K) ]  Wash Vol: [ 12% ($19.4K) ]   |
|   CVD Delta:   [ 1m: +$12.4K | 5m: +$45.2K | 15m: +$82.0K ]     |
|   Divergence:  [ NONE (BULLISH CONFLUENCE) ]                    |
|   Smart Money: [ +2 Tracked Wallets Entered in last 5m ]        |
+-----------------------------------------------------------------+
| [ Settings ]  [ Audio: ON ]  [ Alerts: ACTIVE ]  [ Layout: DOCK ] |
+-----------------------------------------------------------------+
```

---

## 8. Summary of Data Outputs & Required Metrics

| Category | Field Name | Data Type / Format | Primary Source / Logic |
| :--- | :--- | :--- | :--- |
| Core | Active Mint Address | Base58 / Hex String | DOM / URL Parser |
| Core | Overall Rug Risk % | Percentage (0-100%) | Weighted Multi-factor Risk Engine |
| Safety | Mint / Freeze Status | Enum (REVOKED / ACTIVE) | Contract State RPC |
| Safety | LP Burn / Lock % | Percentage + Timer | Token Balance / Locker Contracts |
| Safety | Honeypot Check | Boolean (PASS / FAIL) | Simulation Transaction RPC |
| Insiders | Bundled Supply % | Percentage | Block-0 Jito/MEV Transaction Trace |
| Insiders | Wallet Cluster Control % | Percentage | Co-funding Graph Analysis |
| Momentum | Organic vs Wash Vol | USD / Percentage | Micro-trade/Loop Pattern Filter |
| Momentum | CVD (1m, 5m, 15m) | Signed USD Value | Taker Order Delta Stream |
| Predictive | Win Probability Score | Percentage (0-100%) | Confluence Engine |
| Predictive | Actionable Verdict | Enum (5 States) | Threshold Logic Engine |

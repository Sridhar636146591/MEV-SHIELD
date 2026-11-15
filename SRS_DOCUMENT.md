# Software Requirements Specification (SRS)
## MEV Shield & Real-Time Blockchain Mempool Attack Detection System
**Document Identifier:** SRS-MEV-2026-V1.0  
**Version:** 1.0.0  
**Status:** Approved / Production Baseline  
**Date:** November 2026  
**Standard Compliance:** IEEE Std 830-1998 / ISO/IEC/IEEE 29148:2018  
**Author:** Web3 Security & Trading Infrastructure Engineering Team  

---

## Executive Summary

Decentralized Finance (DeFi) on Ethereum and EVM-compatible blockchains processes billions of dollars in daily trade volume through automated market makers (AMMs) such as Uniswap, SushiSwap, and Curve. However, because public transactions are broadcast to an unencrypted peer-to-peer memory pool (mempool) prior to block inclusion, specialized algorithmic actors known as **MEV Searchers** exploit transaction visibility and block ordering. Through malicious extractable value strategies—primarily **Sandwich Attacks**, **Front-Running**, **Back-Running**, and **Generalized Front-Running**—searchers extract hundreds of millions of dollars annually from retail traders and institutional protocols in the form of elevated slippage, failed transactions, and gas fee griefing.

The **MEV Shield & Real-Time Blockchain Mempool Attack Detection System** ("MEV Detector") is an enterprise-grade full-stack security and analytics platform engineered to neutralize these threats. The system provides real-time mempool transaction ingestion, heuristic and statistical attack pattern recognition, dynamic trade risk scoring, multi-tier slippage calibration, private transaction relaying via the Flashbots network, comprehensive cryptocurrency market analytics, and interactive attack simulation. This document serves as the formal Software Requirements Specification (SRS), establishing the complete functional, external interface, performance, and security requirements of the system.

---

## 1. Introduction

### 1.1 Purpose
This Software Requirements Specification (SRS) details the functional and non-functional requirements for the **MEV Shield & Real-Time Mempool Attack Detection System**. It specifies the requirements for developers, QA engineers, security auditors, DevOps engineers, and protocol stakeholders for version 1.0.0 of both the backend monitoring engine and the frontend analytical dashboard.

### 1.2 Scope of the System
The MEV Detector platform comprises the following core components:
1. **Real-Time Mempool Ingestion Engine:** Captures pending transactions across Ethereum Mainnet and Sepolia testnet using Alchemy WebSocket streams (`alchemy_pendingTransactions`) with automated JSON-RPC polling fallback.
2. **Algorithmic MEV Detection Engine:** Performs transaction decoding, gas price priority differential analysis, and temporal nonce sequencing to classify sandwich attacks, front-running, back-running, and generalized MEV in under 100 milliseconds.
3. **Composite Risk Assessment & Slippage Calibration:** Calculates multi-factor risk scores (0–100%) and advises safe slippage bounds based on AMM pool reserves, trade size, and real-time market volatility.
4. **Flashbots Private Relay Integration:** Enables zero-revert, front-run-proof transaction routing directly to block builders through Flashbots Protect RPC (`https://rpc.flashbots.net`) and custom signed transaction bundles.
5. **Crypto Market Intelligence & Gas Fee Engine:** Synthesizes live market metrics from CoinMarketCap, CoinGecko, and Alternative.me, calculating 14-period RSI, MACD indicators, global crypto metrics, and EIP-1559 gas fee tier recommendations.
6. **Interactive MEV Attack Simulator:** Offers an educational sandbox allowing traders to model sandwich attacks, parameterize slippage and pool depth, and quantify potential financial exposure.
7. **Multi-Channel Alert Dispatcher:** Emits instant notifications through WebSockets (`ws://`), Web Push API, and SMTP email alerts for flagged addresses or high-severity attacks.
8. **Gamification & Leaderboard System:** Tracks user protected transactions, awards security badges, and maintains a community threat hunting leaderboard.

### 1.3 Document Conventions & RFC 2119
The keywords **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **MAY**, and **OPTIONAL** in this document are to be interpreted as described in **IETF RFC 2119**.
- Requirement identifiers are formatted as: `[REQ-CATEGORY-ID]`, such as `[REQ-DET-001]`, `[REQ-API-002]`, etc.

### 1.4 Intended Audience & Reading Suggestions
- **Blockchain & Security Engineers:** Focus on Section 2 (System Architecture), Section 4 (Functional Requirements), and Appendix A (Data Models).
- **Frontend Engineers:** Focus on Section 3 (External Interfaces) and Section 4.5 through 4.8.
- **QA & Security Auditors:** Focus on Section 5 (Non-Functional Requirements) and Section 6 (Verification & Acceptance Criteria).
- **Product Managers & Stakeholders:** Review Executive Summary, Section 1, and Section 2.

### 1.5 Glossary of Terms & Acronyms
- **MEV (Maximal / Miner Extractable Value):** The maximum value that can be extracted from block production beyond standard block rewards and gas fees by including, excluding, or changing the order of transactions.
- **Mempool:** The in-memory pool of unconfirmed, pending transactions waiting to be mined or included into a block by validators.
- **Sandwich Attack:** An attack where a searcher watches for a target DEX swap transaction, places a purchase transaction immediately before it with higher gas to drive the price up, and immediately places a sell transaction after it to take profit.
- **Front-Running:** Placing a transaction with higher gas fees to execute immediately ahead of a known pending transaction to capture an arbitrage or liquidation opportunity.
- **Back-Running:** Placing a transaction immediately after a target transaction to capture an arbitrage opportunity or pool imbalance created by that transaction.
- **Flashbots:** A research and development organization focused on mitigating the negative externalities of MEV through private transaction relays and open builder markets.
- **Searcher:** An algorithmic arbitrageur or MEV operator scanning the mempool for profitable opportunities.
- **Builder:** An entity in Ethereum's Proof-of-Stake architecture that bundles transactions and constructs whole blocks submitted to proposers.
- **EIP-1559:** Ethereum Improvement Proposal introducing base fee burns and optional priority tips (`maxFeePerGas`, `maxPriorityFeePerGas`).
- **Slippage:** The difference between the expected execution price of an AMM trade and the actual execution price when mined.
- **AMM (Automated Market Maker):** A decentralized exchange protocol utilizing mathematical formulas (e.g., $x \cdot y = k$) to price assets without centralized order books.

---

## 2. Overall System Description

### 2.1 Product Perspective & Context Architecture
The MEV Shield system operates as an intelligent intermediary layer between Ethereum's decentralized consensus layer and end-user Web3 interfaces. It ingests unconfirmed state mutations directly from the network, correlates transactions across smart contract routers, computes predictive risk metrics, and serves real-time insights to client interfaces.

```
+-----------------------------------------------------------------------------------+
|                            ETHEREUM BLOCKCHAIN NETWORK                            |
|       (Public P2P Mempool, Alchemy WSS / JSON-RPC, Block Builders, DEX AMMs)      |
+-----------------------------------------------------------------------------------+
                                        |  Alchemy WSS / Polling
                                        v
+-----------------------------------------------------------------------------------+
|                            BACKEND INGESTION & ANALYSIS                           |
|  +-----------------------------------------------------------------------------+  |
|  | Mempool Ingestion Service (alchemyMempoolService / mempoolService)          |  |
|  | - WSS alchemy_pendingTransactions stream                                    |  |
|  | - Fallback polling on eth_getBlockByNumber('pending')                       |  |
|  | - Transaction normalization & ABI method decoding                           |  |
|  +-----------------------------------------------------------------------------+  |
|                                       |                                           |
|  +-----------------------------------------------------------------------------+  |
|  | MEV Detection Engine (MEVDetector & mevDetector utils)                      |  |
|  | - Sandwich Attack Detector (Gas priority & sequence analysis)               |  |
|  | - Front-Running & Back-Running Heuristics                                   |  |
|  | - Composite Risk Scoring (0 - 100%)                                         |  |
|  | - Slippage Loss & Price Impact Estimation                                   |  |
|  +-----------------------------------------------------------------------------+  |
|                                       |                                           |
|  +------------------------------------+-------------------------------------+     |
|  |                                    |                                     |     |
|  v                                    v                                     v     |
|  +-------------------+    +--------------------+    +----------------------------+|
|  | Crypto Market     |    | Flashbots Relay    |    | Alert & Notification       ||
|  | Service           |    | Service            |    | Service                    ||
|  | - CoinMarketCap   |    | - Flashbots Protect|    | - WebSocket Broadcast (ws) ||
|  | - CoinGecko       |    | - Bundle Signing   |    | - Push Notifications       ||
|  | - Fear & Greed    |    | - Zero-Revert Sim  |    | - SMTP Email Alerts        ||
|  +-------------------+    +--------------------+    +----------------------------+|
|                                       |                                           |
|  +-----------------------------------------------------------------------------+  |
|  | Express HTTP REST APIs (Port 3001) & WebSocket Server                       |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
                                        |  REST HTTP / JSON & WebSocket (ws://)
                                        v
+-----------------------------------------------------------------------------------+
|                            FRONTEND WEB3 CLIENT (PORT 3000)                       |
|  +--------------------+  +--------------------+  +------------------------------+ |
|  | Dashboard / KPI    |  | Attack Detector    |  | Live Mempool Monitor         | |
|  | - MEV Saved        |  | - Real-time stream |  | - Pending tx stream          | |
|  | - Attack counters  |  | - Risk classification | - Gas price distribution     | |
|  +--------------------+  +--------------------+  +------------------------------+ |
|  +--------------------+  +--------------------+  +------------------------------+ |
|  | Crypto Market Hub  |  | MEV Simulator      |  | Flashbots Relay Config       | |
|  | - Fear & Greed     |  | - Sandwich Sandbox |  | - 1-Click MetaMask setup     | |
|  | - RSI / MACD       |  | - Slippage test    |  | - Private bundle submission  | |
|  +--------------------+  +--------------------+  +------------------------------+ |
|  +------------------------------------------------------------------------------+ |
|  | Web3 Wallet Connector (EIP-1193 MetaMask) & Gamified Rewards Leaderboard      | |
|  +------------------------------------------------------------------------------+ |
+-----------------------------------------------------------------------------------+
```

### 2.2 Product Functions
- **Real-Time Mempool Monitoring:** Ingest pending mempool transactions with sub-second latency.
- **Automated Threat Detection:** Identify front-running, back-running, and sandwich attack vectors.
- **Risk Assessment Scoring:** Quantify risk on a scale of 0 to 100 with category level tags (Low, Medium, High, Critical).
- **Private Route Protection:** Provide single-click routing configuration for Flashbots Protect RPC to prevent MEV exposure.
- **Educational Simulation:** Model attack scenarios to train users on slippage optimization and gas price management.
- **Market & Gas Intelligence:** Continuous monitoring of market trends, technical momentum, and dynamic gas pricing.
- **Incident Alerting:** Proactive user notifications when monitored addresses or tokens are targeted by searchers.

### 2.3 User Classes and Personas
1. **DeFi Retail Trader (Persona: Alice):** Executes swaps on Uniswap/SushiSwap. Vulnerable to sandwich attacks. Needs automated protection, slippage guidance, and easy MetaMask Flashbots setup.
2. **Professional / Institutional Arbitrageur (Persona: Bob):** Executes high-value cross-DEX trades. Requires low-latency mempool visibility, detailed risk scoring, and private transaction bundling.
3. **Protocol Security Auditor & Researcher (Persona: Charlie):** Analyzes historical and live MEV extraction patterns, monitors searcher bot addresses, and evaluates network gas dynamics.
4. **System Administrator / DevOps (Persona: Dave):** Monitors backend health, RPC rate limits, WebSocket connection stability, and service availability.

### 2.4 Operating Environment & Technology Stack
| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Backend Runtime** | Node.js | v20+ / v24+ | Server-side execution environment |
| **Backend Framework** | Express.js | 4.19+ | REST API server on port 3001 |
| **Language** | TypeScript | 5.3+ | Type-safe backend architecture |
| **Real-time Protocol**| WebSocket (`ws`) | 8.16+ | Bidirectional real-time event broadcasting |
| **Web3 Client Lib** | Ethers.js | 6.13+ | Blockchain interaction, ABI encoding/decoding |
| **MEV Private Relay**| Flashbots Provider | 0.6+ | Flashbots RPC & bundle submission |
| **RPC Provider** | Alchemy SDK | 3.1+ | Ethereum Mainnet/Sepolia WSS & JSON-RPC |
| **Frontend Framework**| React | 18.2+ | Client single-page application on port 3000 |
| **Styling Engine** | Tailwind CSS | 3.4+ | Utility-first responsive dark-mode styling |
| **Data Visualization**| Recharts | 2.12+ | Interactive charts, trendlines, and histograms |
| **Icons** | Lucide React | 0.344+ | Clean modern SVG iconography |
| **Market Data APIs** | CoinMarketCap / CoinGecko | v1 / v3 | Cryptocurrency market listings & metrics |
| **Sentiment Data** | Alternative.me API | v1 | Crypto Fear & Greed Index |

### 2.5 Design and Implementation Constraints
- **Consensus Slot Timing:** Ethereum PoS slot time is 12 seconds. Attack detection, risk calculation, and alert dispatch MUST complete in under 250 milliseconds from mempool arrival to ensure actionable intelligence before block inclusion.
- **Zero Custody Requirement:** The system MUST NOT collect, store, or transmit user private keys. All signing operations MUST be conducted client-side via EIP-1193 injected providers (e.g., MetaMask).
- **Graceful RPC Degradation:** Due to potential rate limits or network degradation on external APIs (Alchemy, CoinMarketCap), the backend MUST provide fallback heuristics, cached data, and realistic simulated telemetry without interrupting service.
- **Browser Compatibility:** Frontend MUST support modern evergreen web browsers (Google Chrome, Microsoft Edge, Mozilla Firefox, Brave, Safari) on desktop and mobile viewports.

---

## 3. External Interface Requirements

### 3.1 User Interfaces (UI Specifications)

#### UI-01: Executive Summary Dashboard
- **Component:** `mev-detector/src/components/Dashboard.tsx`
- **Features:**
  - KPI Summary Cards: Total MEV Attacks Detected (24h/All-time), Estimated Financial Losses Prevented ($), Average Network Gas Price (Gwei), and Real-time Mempool Congestion Level.
  - Live Attack Ticker: Real-time scrolling feed of the latest flagged transactions with color-coded risk pills.
  - Network Switcher: Toggle between Ethereum Mainnet (Chain ID 1) and Sepolia Testnet (Chain ID 11155111).
  - Quick-action buttons: Connect Wallet, Activate Flashbots Protect, Launch Simulator.

#### UI-02: Live Attack Detector
- **Component:** `mev-detector/src/components/AttackDetector.tsx`
- **Features:**
  - Tabular and card view of detected MEV exploits: Timestamp, Attack Type (Sandwich, Front-run, Back-run), Risk Score (0-100%), Slippage Loss (ETH/USD), Gas Price, Target Router, Attacker Address, Victim Address.
  - Interactive Filter controls: Filter by attack type, minimum risk score threshold, and time window (1h, 24h, 7d).
  - Transaction hash link to Etherscan for independent verification.

#### UI-03: Real-Time Mempool Explorer
- **Component:** `mev-detector/src/components/MempoolMonitor.tsx`
- **Features:**
  - Streaming table of unconfirmed transactions arriving via WebSocket.
  - Visual flags for high-value DEX swaps ($>1$ ETH) and anomalous gas bids.
  - Gas Price Distribution Chart: Histogram displaying pending transactions across gas fee bands.

#### UI-04: Crypto Market Intelligence & Gas Fee Radar
- **Component:** `mev-detector/src/components/CryptoMarketTrends.js`
- **Features:**
  - Interactive Fear & Greed Speedometer Gauge (0 to 100) with historical trend comparison.
  - Top 10 Cryptocurrency Market Watch: Real-time price, 24h change %, 24h volume, and 7-day sparkline.
  - Technical Momentum Indicators: Real-time RSI (Relative Strength Index) with Overbought (>70) and Oversold (<30) thresholds, and MACD signal indicators for BTC and ETH.
  - EIP-1559 Dynamic Gas Tracker: Live estimation for Rapid (<15s), Fast (<1m), Standard (<3m), and Slow (<5m) transaction tiers with base fee burn visualization.
  - Institutional ETF Flows tracker.

#### UI-05: Interactive MEV Simulator & Sandbox
- **Component:** `mev-detector/src/components/Simulator.js`
- **Features:**
  - Interactive parametric simulator: Trade size slider (0.1 to 50 ETH), slippage tolerance slider (0.1% to 10%), target DEX pool selector (ETH/USDC, ETH/USDT, WBTC/ETH).
  - Step-by-Step Visualizer: Shows the 3-step mechanics of a sandwich attack:
    1. Attacker Front-run Buy (Drives pool price up by $\Delta P$).
    2. Victim Swap Execution (Executes at worst allowable slippage price).
    3. Attacker Back-run Sell (Liquidates for risk-free profit).
  - Comparison Card: Financial outcome in Public Mempool vs. Private Flashbots Relay.

#### UI-06: Flashbots Private Relay Configuration
- **Component:** `mev-detector/src/components/FlashbotsProtection.js`
- **Features:**
  - 1-Click MetaMask RPC Setup: Triggers `wallet_addEthereumChain` to add Flashbots Protect RPC (`https://rpc.flashbots.net`).
  - Bundle simulation tester: Allows users to dry-run transaction bundles and inspect revert guarantees.

#### UI-07: Personalized Alerting & Settings Center
- **Component:** `mev-detector/src/components/EmailAlerts.js` & `PersonalizedDashboard.tsx`
- **Features:**
  - User wallet address watch list.
  - Threshold configuration: Minimum risk level trigger (Low, Medium, High, Critical) and minimum loss amount ($).
  - Delivery channel toggles: In-browser Web Push, WebSocket push, and SMTP Email.

#### UI-08: Gamification, Badges & Threat Leaderboard
- **Component:** `mev-detector/src/components/Rewards.js` & `Leaderboard.js`
- **Features:**
  - User XP, security level (Level 1: Novice to Level 5: Guardian), and earned badges.
  - Global leaderboard ranking users by protected transaction volume and threats reported.

### 3.2 Hardware Interfaces
- **Server:** Minimum 2 vCPUs, 4 GB RAM, 20 GB SSD storage, 100 Mbps network bandwidth. Recommended for production: 4 vCPUs, 8 GB RAM, 50 GB NVMe.
- **Client:** Any standard desktop, laptop, tablet, or smartphone supporting modern web standards with at least 2 GB available RAM.

### 3.3 Software Interfaces
1. **Ethereum Node / RPC Provider:**
   - Alchemy Enhanced API: WSS connection at `wss://eth-mainnet.g.alchemy.com/v2/{KEY}` and HTTPS at `https://eth-mainnet.g.alchemy.com/v2/{KEY}`.
   - Standard JSON-RPC 2.0 methods: `eth_blockNumber`, `eth_gasPrice`, `eth_getBlockByNumber`, `eth_sendRawTransaction`, `alchemy_pendingTransactions`.
2. **Flashbots Relay:**
   - HTTPS endpoint: `https://relay.flashbots.net` / `https://rpc.flashbots.net`.
   - Methods: `eth_sendBundle`, `eth_callBundle`, `flashbots_getUserStats`.
3. **Market Intelligence Providers:**
   - CoinMarketCap Professional API: Endpoints `/v1/cryptocurrency/listings/latest`, `/v1/global-metrics/quotes/latest`.
   - CoinGecko Public / Pro API: Endpoints `/simple/price`, `/coins/markets`.
   - Alternative.me API: Endpoint `https://api.alternative.me/fng/?limit=10`.
4. **Client Web3 Provider:**
   - EIP-1193 standard provider interface (MetaMask, Coinbase Wallet, WalletConnect).

### 3.4 Communication & Protocol Interfaces
- **REST API:** HTTP/1.1 and HTTP/2 over TLS (port 3001) exchanging `application/json` payloads.
- **WebSocket:** RFC 6455 standard `ws://` and `wss://` on port 3001 for low-latency bidirectional streaming.
- **Cross-Origin Resource Sharing (CORS):** Backend configured to accept authorized origins (`http://localhost:3000` in development, production domain in deployment).

---

## 4. System Features & Functional Requirements

### 4.1 Mempool Ingestion & Processing Subsystem

#### [REQ-ING-001] Real-Time Pending Transaction Ingestion
- **Description:** The system SHALL establish an active WebSocket connection to the Alchemy node infrastructure subscribed to `alchemy_pendingTransactions`.
- **Inputs:** Raw JSON-RPC transaction payloads from the network mempool.
- **Processing:** Extract `hash`, `from`, `to`, `value`, `gasPrice`, `gasLimit`, `nonce`, `input`, `maxFeePerGas`, `maxPriorityFeePerGas`, `type`, and reception `timestamp`.
- **Outputs:** Normalized `MempoolTransaction` objects dispatched to the detection queue.

#### [REQ-ING-002] Automated Polling Fallback
- **Description:** If the WebSocket connection fails or disconnects, the system SHALL immediately engage a fallback polling loop utilizing `eth_getBlockByNumber('pending', true)` every 2000 milliseconds until the WebSocket re-establishes.

#### [REQ-ING-003] Smart Contract Router ABI Decoding
- **Description:** The system SHALL decode transaction `input` bytecode matching known decentralized exchange router method signatures, including:
  - Uniswap V2 Router (`swapExactTokensForTokens`, `swapExactETHForTokens`, `swapTokensForExactTokens`).
  - Uniswap V3 SwapRouter and SwapRouter02 (`exactInputSingle`, `exactInput`, `multicall`).
  - 1inch Aggregation Router V5 / V6.
  - Curve Finance Swap Routers.

---

### 4.2 MEV Detection Engine Subsystem

#### [REQ-DET-001] Sandwich Attack Detection Algorithm
- **Description:** The system SHALL identify sandwich attack sequences within the sliding mempool window.
- **Mathematical Specification:**
  A transaction sequence $(Tx_{\text{front}}, Tx_{\text{victim}}, Tx_{\text{back}})$ is flagged as a sandwich attack if:
  1. $Tx_{\text{front}}$ and $Tx_{\text{victim}}$ target the same liquidity pool or router contract ($to_{\text{front}} = to_{\text{victim}}$).
  2. $GasPrice(Tx_{\text{front}}) > GasPrice(Tx_{\text{victim}})$ or $PriorityFee(Tx_{\text{front}}) > PriorityFee(Tx_{\text{victim}})$.
  3. $Nonce(Tx_{\text{front}}) < Nonce(Tx_{\text{victim}})$.
  4. There exists a subsequent transaction $Tx_{\text{back}}$ by the same attacker or builder bundle targeting the same pool with $Nonce(Tx_{\text{back}}) > Nonce(Tx_{\text{victim}})$ executing the inverse trade direction.

#### [REQ-DET-002] Front-Running Detection Algorithm
- **Description:** The system SHALL detect front-running attempts where an attacker attempts to preempt a target transaction.
- **Mathematical Specification:**
  $Tx_{\text{attacker}}$ is classified as front-running $Tx_{\text{victim}}$ if:
  $$to_{\text{attacker}} = to_{\text{victim}} \quad \land \quad GasPrice(Tx_{\text{attacker}}) \ge 1.10 \times GasPrice(Tx_{\text{victim}}) \quad \land \quad \text{ValueMatch}(Tx_{\text{attacker}}, Tx_{\text{victim}})$$

#### [REQ-DET-003] Back-Running & Liquidation Sniping Detection
- **Description:** The system SHALL identify back-running transactions that exploit price discrepancies or liquidation conditions immediately following a target swap.
- **Mathematical Specification:**
  $Tx_{\text{attacker}}$ is classified as back-running $Tx_{\text{victim}}$ if:
  $$to_{\text{attacker}} = to_{\text{victim}} \quad \land \quad GasPrice(Tx_{\text{attacker}}) \ge GasPrice(Tx_{\text{victim}}) \quad \land \quad t_{\text{attacker}} > t_{\text{victim}} \quad \land \quad \Delta t \le 200\text{ms}$$

---

### 4.3 Risk Scoring & Slippage Optimization Subsystem

#### [REQ-RSK-001] Composite Risk Score Calculation
- **Description:** The system SHALL compute a composite Risk Score $R \in [0, 100]$ for analyzed transactions using a multi-factor weighted heuristic model:
  $$R = \min\left(100, S_{\text{gas}} + S_{\text{value}} + S_{\text{congestion}} + S_{\text{pattern}}\right)$$
  - **Gas Factor ($S_{\text{gas}}$):** If $GasPrice > 2 \times Gas_{\text{normal}}$, $S_{\text{gas}} = 30$; if $GasPrice > Gas_{\text{normal}}$, $S_{\text{gas}} = 15$; else $S_{\text{gas}} = 0$.
  - **Value Factor ($S_{\text{value}}$):** If $Value_{\text{ETH}} > 10$, $S_{\text{value}} = 30$; if $Value_{\text{ETH}} > 1$, $S_{\text{value}} = 15$; else $S_{\text{value}} = 0$.
  - **Congestion Factor ($S_{\text{congestion}}$):** If $MempoolPending > 100$, $S_{\text{congestion}} = 20$; if $MempoolPending > 50$, $S_{\text{congestion}} = 10$; else $S_{\text{congestion}} = 0$.
  - **Pattern Factor ($S_{\text{pattern}}$):** If known MEV pattern detected, $S_{\text{pattern}} = 20$; else $0$.

#### [REQ-RSK-002] Risk Severity Classification
- **Description:** Risk scores SHALL map directly to four severity tiers:
  - $0 \le R \le 25$: **Low Risk** (Standard execution safe).
  - $26 \le R \le 50$: **Medium Risk** (Minor slippage or gas competition).
  - $51 \le R \le 75$: **High Risk** (Likely MEV target; private RPC recommended).
  - $76 \le R \le 100$: **Critical Risk** (Imminent sandwich attack; private RPC required).

#### [REQ-RSK-003] Dynamic Slippage Recommendation Engine
- **Description:** The system SHALL evaluate AMM pool reserves and market volatility to output bounded slippage recommendations:
  $$\text{PriceImpact (bps)} \approx \frac{\Delta x}{x + \Delta x} \times 10,000$$
  $$\text{Slippage}_{\text{recommended}} = \text{clamp}\left(1.15 \times \text{PriceImpact} + 1.10 \times \text{Volatility} + \text{Buffer}, 10, 5000\right)$$
  - Aggressive bound: $\text{clamp}(0.75 \times \text{Slippage}_{\text{recommended}}, 5, \text{recommended})$
  - Conservative bound: $\text{clamp}(1.35 \times \text{Slippage}_{\text{recommended}} + 10, \text{recommended}, 7500)$

---

### 4.4 Flashbots & Private Transaction Relay Subsystem

#### [REQ-FLB-001] Flashbots Protect Integration
- **Description:** The system SHALL provide configuration parameters and one-click RPC integration for Flashbots Protect:
  - RPC URL: `https://rpc.flashbots.net`
  - Chain ID: 1 (Mainnet) or 11155111 (Sepolia)
  - Revert protection: Zero transaction fees incurred on reverted transactions.

#### [REQ-FLB-002] Private Bundle Simulation
- **Description:** The backend SHALL support bundle simulation via Flashbots `eth_callBundle` to verify state transitions and gas requirements prior to on-chain submission.

---

### 4.5 Crypto Market Intelligence & Gas Fee Engine

#### [REQ-MKT-001] Multi-Provider Cryptocurrency Quotes
- **Description:** The system SHALL aggregate real-time prices, 24h percentage changes, market capitalization, and 24h trading volume for top cryptocurrencies via CoinMarketCap, automatically falling back to CoinGecko if the primary API key is omitted, exhausted, or unavailable.

#### [REQ-MKT-002] Technical Indicator Computation
- **Description:** The system SHALL calculate:
  - 14-period Relative Strength Index (RSI) using closing price series.
  - Moving Average Convergence Divergence (MACD) with 12-period EMA, 26-period EMA, and 9-period signal line.

#### [REQ-MKT-003] Alternative.me Fear & Greed Index
- **Description:** The system SHALL fetch and cache the daily Crypto Fear & Greed Index, providing a 0–100 integer score and classification (Extreme Fear, Fear, Neutral, Greed, Extreme Greed).

#### [REQ-MKT-004] EIP-1559 Dynamic Gas Fee Estimation
- **Description:** The system SHALL compute live gas fee recommendations across four urgency tiers:
  - Rapid (<15 sec): $1.25 \times \text{BaseFee} + \text{PriorityFee}_{\text{high}}$
  - Fast (<1 min): $1.15 \times \text{BaseFee} + \text{PriorityFee}_{\text{medium}}$
  - Standard (<3 min): $1.05 \times \text{BaseFee} + \text{PriorityFee}_{\text{normal}}$
  - Slow (<5 min): $1.00 \times \text{BaseFee} + \text{PriorityFee}_{\text{low}}$

---

### 4.6 Interactive MEV Attack Simulator

#### [REQ-SIM-001] Parametric Sandwich Attack Simulation
- **Description:** The simulator SHALL take user inputs for:
  - Trade Amount (ETH)
  - Target Token Pair
  - Slippage Tolerance (%)
  - Pool Depth / Liquidity ($)
- **Outputs Generated:**
  - Attacker Front-Run Purchase Volume and Gas Bribe.
  - Price Distortion Percentage ($\Delta P$).
  - Victim Slippage Loss in USD and ETH.
  - Attacker Back-Run Sell Revenue and Net Profit.
  - Financial Savings by using Flashbots Private RPC.

---

### 4.7 Notification & Alert Subsystem

#### [REQ-ALT-001] WebSocket Real-Time Broadcasting
- **Description:** The backend WebSocket server SHALL broadcast instant JSON events to connected clients when:
  - An attack is detected (`event: "attack_detected"`).
  - A high-risk transaction enters the mempool (`event: "high_risk_tx"`).
  - Dynamic gas prices fluctuate by more than 15% (`event: "gas_spike"`).

#### [REQ-ALT-002] SMTP Email & Push Notification Dispatch
- **Description:** The system SHALL dispatch email alerts via Nodemailer and Web Push notifications to subscribed users whose watched wallet address or custom threshold criteria match an incoming attack.

---

### 4.8 REST API Endpoint Specifications

| HTTP Verb | Endpoint Route | Request Parameters / Body | Response Status & Description |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/health` | None | `200 OK`: Server uptime, timestamp, active services status |
| **GET** | `/api/attacks` | Query: `limit`, `type`, `minRisk` | `200 OK`: Array of recent `MEVAttack` records |
| **GET** | `/api/stats` | None | `200 OK`: Total attacks, losses prevented, active monitoring stats |
| **GET** | `/api/mempool/transactions`| Query: `limit`, `network` | `200 OK`: Array of latest pending `MempoolTransaction` objects |
| **GET** | `/api/crypto/market-trends`| None | `200 OK`: Global crypto market trends, top coins, and ETF flows |
| **GET** | `/api/crypto/fear-greed` | None | `200 OK`: Fear & Greed index value, label, and historical records |
| **GET** | `/api/crypto/global-metrics`| None | `200 OK`: Total market cap, 24h volume, BTC/ETH dominance |
| **GET** | `/api/crypto/top-coins` | Query: `limit` (default: 10) | `200 OK`: Top cryptocurrency listings with price & 24h changes |
| **GET** | `/api/crypto/technical-indicators/:symbol`| Param: `symbol` (e.g., `BTC`) | `200 OK`: RSI 14, MACD line, signal line, histogram |
| **GET** | `/api/crypto/gas-fees` | None | `200 OK`: Rapid, Fast, Standard, Slow gas tiers in Gwei |
| **POST** | `/api/flashbots/bundle` | Body: `{ transactions: string[], blockNumber: number }` | `200 OK`: Bundle submission receipt with simulation status |
| **POST** | `/api/simulate/sandwich`| Body: `{ tradeAmountEth, slippagePercent, poolLiquidity }` | `200 OK`: Detailed simulation output metrics |
| **GET** | `/api/rewards/leaderboard` | Query: `limit` | `200 OK`: Top user profiles ranked by protected volume |

---

## 5. Non-Functional Requirements (NFRs)

### 5.1 Performance Requirements
- **[NFR-PERF-001] Ingestion Latency:** The system SHALL ingest and parse incoming mempool transactions within 100 milliseconds of packet receipt from the RPC node.
- **[NFR-PERF-002] Detection Latency:** Heuristic and algorithmic attack classification SHALL complete within 150 milliseconds of transaction ingestion.
- **[NFR-PERF-003] Processing Throughput:** The backend SHALL sustain continuous analysis of at least 500 transactions per second under peak Ethereum network load without dropped messages.
- **[NFR-PERF-004] Client Render Performance:** The frontend UI SHALL maintain a smooth 60 frames per second (FPS) rendering rate during active WebSocket streaming updates.

### 5.2 Security Requirements
- **[NFR-SEC-001] Zero Key Custody:** The server SHALL NOT accept, ingest, or store user private keys or seed phrases under any circumstances.
- **[NFR-SEC-002] Secure Communications:** All external network communications SHALL enforce TLS 1.3 encryption (HTTPS and WSS).
- **[NFR-SEC-003] Input Sanitization:** All incoming REST parameters and WebSocket payloads SHALL undergo strict schema validation and sanitization to prevent injection vulnerabilities.
- **[NFR-SEC-004] CORS Policy:** The backend SHALL enforce strict Cross-Origin Resource Sharing policies, preventing unauthorized cross-site requests.
- **[NFR-SEC-005] Rate Limiting:** REST API endpoints SHALL enforce rate limiting to defend against Denial-of-Service (DoS) abuse.

### 5.3 Reliability & Availability
- **[NFR-REL-001] System Uptime:** The monitoring backend SHALL target 99.9% uptime (maximum 8.76 hours of unplanned downtime per annum).
- **[NFR-REL-002] Resilient Degradation:** If external market data or blockchain APIs become unresponsive, the backend SHALL serve cached or synthetic data seamlessly without service interruption.
- **[NFR-REL-003] WebSocket Auto-Reconnection:** Client and server WebSocket connections SHALL implement automated exponential backoff reconnection logic (1s, 2s, 4s, up to 30s max).

### 5.4 Scalability & Maintainability
- **[NFR-SCL-001] Horizontal Scalability:** The backend service architecture SHALL remain stateless with respect to HTTP requests, facilitating horizontal scaling across containerized instances.
- **[NFR-SCL-002] Codebase Maintainability:** Backend codebase SHALL maintain TypeScript strict typing mode with comprehensive interface definitions.

---

## 6. Verification, Validation & Acceptance Criteria

### 6.1 Testing Strategy
- **Unit Testing:** Individual algorithms (`detectSandwichAttack`, `detectFrontRunning`, `calculateRiskScore`, `recommendSlippageSettings`) SHALL achieve >90% code coverage.
- **Integration Testing:** Verification of end-to-end communication across Alchemy WSS, Flashbots relay, and REST routes.
- **Simulation Harness:** Replay of historical mainnet sandwich attacks to verify 100% detection accuracy on known exploit signatures.

### 6.2 Requirements Traceability Matrix

| Requirement ID | Requirement Description | Verification Method | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| **[REQ-ING-001]** | Mempool transaction stream | Integration Test | Ingests pending tx from Alchemy WSS within 100ms |
| **[REQ-DET-001]** | Sandwich attack detection | Unit & Replay Test | Correctly identifies front-run and back-run transaction pairs |
| **[REQ-DET-002]** | Front-running detection | Unit Test | Detects 10%+ gas price outbids on identical router targets |
| **[REQ-RSK-001]** | Composite risk scoring | Unit Test | Outputs bounded score between 0 and 100 matching formula |
| **[REQ-FLB-001]** | Flashbots Protect RPC | System Test | Injects Flashbots Protect chain config to MetaMask |
| **[REQ-MKT-001]** | Crypto market trends | API Integration Test | Returns valid quotes with CoinGecko fallback |
| **[REQ-SIM-001]** | MEV attack simulator | Functional UI Test | Accurately calculates victim loss and attacker profit |
| **[REQ-ALT-001]** | WebSocket event stream | Integration Test | Broadcasts `attack_detected` to active socket clients |
| **[NFR-SEC-001]** | Zero key custody | Security Audit | No private keys accepted or stored across backend |

---

## 7. Appendices

### Appendix A: Core Data Models & TypeScript Interfaces

```typescript
export interface MEVAttack {
  hash: string;
  attackType: 'sandwich' | 'front-run' | 'back-run' | 'other';
  riskScore: number;
  slippageLoss: number;
  gasPrice: string;
  timestamp: string;
  attackerAddress?: string;
  victimAddress?: string;
  transactionDetails?: {
    from: string;
    to: string;
    value: string;
    gasLimit: string;
  };
  network?: string;
  source?: string;
  blockNumber?: number;
}

export interface RiskAssessment {
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: {
    gasPrice: number;
    slippageRisk: number;
    mempoolCongestion: number;
    attackDetected: number;
  };
}

export interface MempoolTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasPrice: string;
  gasLimit: string;
  nonce: number;
  blockNumber: number;
  timestamp: number;
  input?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  type?: number;
}
```

### Appendix B: API Error Codes & HTTP Mappings

| Error Code | HTTP Status | Meaning | Recovery / Mitigation |
| :--- | :--- | :--- | :--- |
| `ERR_INVALID_PARAMS` | 400 Bad Request | Required query/body parameter missing or malformed | Inspect schema & resubmit valid parameters |
| `ERR_RPC_RATE_LIMIT` | 429 Too Many Requests | Alchemy or external provider rate limit reached | Backend automatically throttles and serves cache |
| `ERR_SIMULATION_FAILED` | 422 Unprocessable Entity | Flashbots bundle simulation reverted | Inspect contract state and token allowance |
| `ERR_INTERNAL_SERVER` | 500 Internal Error | Unhandled backend exception | Check server error logs; retry with backoff |

---
*End of Software Requirements Specification Document.*

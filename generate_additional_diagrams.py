"""
Generate Additional High-Resolution Academic Diagrams for MEV Shield
1. UML Sequence Diagram
2. UML Class Diagram
3. AMM Constant Product Sandwich Attack Mechanics Curve
"""

import os
import tempfile
os.environ['MPLCONFIGDIR'] = os.path.join(tempfile.gettempdir(), 'mpl')

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, Rectangle, Circle, Polygon
import numpy as np

os.makedirs('report_diagrams', exist_ok=True)

C_PRIMARY = '#0F172A'
C_SECONDARY = '#1E293B'
C_ACCENT = '#0284C7'
C_ACCENT_LIGHT = '#E0F2FE'
C_GREEN = '#059669'
C_GREEN_LIGHT = '#ECFDF5'
C_AMBER = '#D97706'
C_AMBER_LIGHT = '#FFFBEB'
C_RED = '#DC2626'
C_RED_LIGHT = '#FEF2F2'
C_BG = '#F8FAFC'
C_BORDER = '#94A3B8'
C_TEXT = '#1E293B'


# ----------------------------------------------------------------------
# 1. SEQUENCE DIAGRAM
# ----------------------------------------------------------------------
def draw_sequence_diagram():
    fig, ax = plt.subplots(figsize=(11, 8), dpi=300)
    ax.set_xlim(0, 11)
    ax.set_ylim(0, 8.5)
    ax.axis('off')

    ax.text(5.5, 8.15, "UML Sequence Diagram: End-to-End MEV Detection & Private Relay Flow", 
            ha='center', va='center', fontsize=13, fontweight='bold', color=C_PRIMARY)

    # 5 Lifelines
    lifelines = [
        ("DeFi Trader\n(User/Client)", 1.2),
        ("MetaMask Wallet\n(EIP-1193)", 3.2),
        ("MEV Shield Backend\n(Node.js / Express)", 5.5),
        ("Ethereum Node\n(Alchemy WSS/RPC)", 7.8),
        ("Flashbots Builder\n(Private Relay)", 9.8)
    ]

    for name, x in lifelines:
        # Header box
        box = FancyBboxPatch((x - 0.9, 7.3), 1.8, 0.55, boxstyle="round,pad=0.06,rounding_size=0.08",
                             fc=C_PRIMARY, ec=C_ACCENT, lw=1.2)
        ax.add_patch(box)
        ax.text(x, 7.57, name, ha='center', va='center', fontsize=7.2, fontweight='bold', color='#FFFFFF')
        # Dashed Lifeline
        ax.plot([x, x], [0.6, 7.3], color='#CBD5E1', lw=1.2, linestyle='--')

    # Activations / Steps
    steps = [
        # (y, from_x, to_x, label, color, is_return, style)
        (6.8, 7.8, 5.5, "1. wss.on('alchemy_pendingTransactions', tx)", C_AMBER, False, '-'),
        (6.3, 5.5, 5.5, "2. Decode Calldata ABI & Match Heuristics", C_PRIMARY, False, 'self'),
        (5.8, 5.5, 5.5, "3. Compute Composite Risk Score (85% Critical)", C_RED, False, 'self'),
        (5.3, 5.5, 1.2, "4. ws.send('attack_detected', risk_alert_payload)", C_RED, False, '-'),
        (4.8, 1.2, 3.2, "5. Click 'Protect with Flashbots' (wallet_addEthereumChain)", C_ACCENT, False, '-'),
        (4.3, 3.2, 1.2, "6. RPC Network Updated to https://rpc.flashbots.net", C_GREEN, True, '--'),
        (3.8, 1.2, 3.2, "7. Submit Token Swap (Sign Private Tx)", C_PRIMARY, False, '-'),
        (3.3, 3.2, 5.5, "8. Forward Signed Bundle (eth_sendBundle)", C_ACCENT, False, '-'),
        (2.8, 5.5, 5.5, "9. Validate Bundle Simulation (eth_callBundle)", C_PRIMARY, False, 'self'),
        (2.3, 5.5, 9.8, "10. Relay Bundle directly to Block Builder", C_GREEN, False, '-'),
        (1.8, 9.8, 7.8, "11. Package in Mined Block (No Mempool Leak)", C_GREEN, False, '-'),
        (1.3, 7.8, 5.5, "12. Block Finalized on Ethereum Mainnet", C_AMBER, True, '--'),
        (0.8, 5.5, 1.2, "13. Push Trade Confirmation & Saved Capital ($48.20)", C_GREEN, True, '--'),
    ]

    for y, x1, x2, label, col, is_ret, style in steps:
        if style == 'self':
            # Self-call loop
            ax.plot([x1, x1 + 0.5, x1 + 0.5, x1], [y + 0.12, y + 0.12, y - 0.12, y - 0.12], color=col, lw=1.2)
            ax.annotate("", xy=(x1, y - 0.12), xytext=(x1 + 0.1, y - 0.12),
                        arrowprops=dict(arrowstyle="->", color=col, lw=1.2))
            ax.text(x1 + 0.6, y, label, ha='left', va='center', fontsize=6.8, fontweight='bold', color=col)
        else:
            # Directed message arrow
            ls = '--' if is_ret else '-'
            ax.plot([x1, x2], [y, y], color=col, lw=1.2, linestyle=ls)
            ax.annotate("", xy=(x2, y), xytext=(x1 + (0.05 if x2 > x1 else -0.05), y),
                        arrowprops=dict(arrowstyle="->", color=col, lw=1.2))
            mid_x = (x1 + x2) / 2
            ax.text(mid_x, y + 0.12, label, ha='center', va='bottom', fontsize=6.8, fontweight='bold', color=col)

    plt.tight_layout()
    plt.savefig('report_diagrams/sequence_diagram.png', bbox_inches='tight')
    plt.close()
    print("Generated: report_diagrams/sequence_diagram.png")


# ----------------------------------------------------------------------
# 2. CLASS DIAGRAM
# ----------------------------------------------------------------------
def draw_class_diagram():
    fig, ax = plt.subplots(figsize=(11, 8.5), dpi=300)
    ax.set_xlim(0, 11)
    ax.set_ylim(0, 8.5)
    ax.axis('off')

    ax.text(5.5, 8.2, "UML Class Diagram: MEV Shield Domain Model & Services", 
            ha='center', va='center', fontsize=13, fontweight='bold', color=C_PRIMARY)

    def draw_class(x, y, w, h, class_name, attributes, methods, header_bg=C_PRIMARY):
        # Container
        box = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.04,rounding_size=0.06",
                             fc='#FFFFFF', ec=C_BORDER, lw=1.2)
        ax.add_patch(box)
        # Class Header Box
        header_h = 0.45
        header_box = FancyBboxPatch((x, y + h - header_h), w, header_h,
                                   boxstyle="round,pad=0.02,rounding_size=0.06",
                                   fc=header_bg, ec=C_BORDER, lw=1.2)
        ax.add_patch(header_box)
        ax.text(x + w/2, y + h - header_h/2, class_name, ha='center', va='center', 
                fontsize=7.5, fontweight='bold', color='#FFFFFF')

        # Divider between attrs and methods
        curr_y = y + h - header_h - 0.12
        for attr in attributes:
            ax.text(x + 0.12, curr_y, attr, ha='left', va='center', fontsize=6.2, fontfamily='monospace', color=C_TEXT)
            curr_y -= 0.18

        # Line divider
        ax.plot([x, x + w], [curr_y - 0.04, curr_y - 0.04], color=C_BORDER, lw=0.8)
        curr_y -= 0.18

        for meth in methods:
            ax.text(x + 0.12, curr_y, meth, ha='left', va='center', fontsize=6.2, fontfamily='monospace', color=C_ACCENT_DARK if 'C_ACCENT_DARK' in globals() else C_PRIMARY)
            curr_y -= 0.18

    # Class 1: MempoolTransaction
    draw_class(0.4, 4.8, 3.1, 3.0, "MempoolTransaction", [
        "+ hash: string",
        "+ from: string",
        "+ to: string",
        "+ value: BigNumber",
        "+ gasPrice: BigNumber",
        "+ maxPriorityFeePerGas: BigNumber",
        "+ nonce: number",
        "+ inputCalldata: string",
        "+ timestamp: number"
    ], [
        "+ decodeCalldata(): SwapData",
        "+ getGasGwei(): number",
        "+ isDexRouter(): boolean"
    ], C_PRIMARY)

    # Class 2: MEVDetector
    draw_class(4.0, 4.8, 3.3, 3.0, "MEVDetector", [
        "- slidingBuffer: MempoolTransaction[]",
        "- alertThreshold: number",
        "- gasMultiplierFactor: number"
    ], [
        "+ detectSandwichAttack(tx, buf): boolean",
        "+ detectFrontRunning(tx, buf): boolean",
        "+ detectBackRunning(tx, buf): boolean",
        "+ calculateRiskScore(tx): RiskAssessment",
        "+ estimateSlippageLoss(tx): number",
        "+ recommendSlippage(pool, trade): Bounds"
    ], C_ACCENT)

    # Class 3: MEVAttack
    draw_class(7.7, 4.8, 2.9, 3.0, "MEVAttack", [
        "+ attackId: string",
        "+ attackType: AttackType",
        "+ riskScore: number",
        "+ estimatedSlippageLoss: number",
        "+ attackerAddress: string",
        "+ victimAddress: string",
        "+ targetPool: string",
        "+ timestamp: string"
    ], [
        "+ formatReport(): object",
        "+ getSeverityLevel(): Severity",
        "+ calculateSavedUsd(): number"
    ], C_RED)

    # Class 4: AlchemyMempoolService
    draw_class(0.4, 1.0, 3.1, 3.2, "AlchemyMempoolService", [
        "- wsClient: WebSocket",
        "- alchemyApiKey: string",
        "- pollingIntervalMs: number",
        "- isConnected: boolean"
    ], [
        "+ connectWss(): Promise<void>",
        "+ startPollingFallback(): void",
        "+ handleIncomingTx(tx): void",
        "+ onDisconnect(err): void",
        "+ getQueueHealth(): QueueStats"
    ], C_PRIMARY)

    # Class 5: FlashbotsService
    draw_class(4.0, 1.0, 3.3, 3.2, "FlashbotsService", [
        "- relayUrl: string",
        "- authSigner: Wallet",
        "- provider: JsonRpcProvider"
    ], [
        "+ submitPrivateBundle(bundle): Promise",
        "+ simulateBundle(bundle, block): Result",
        "+ getFlashbotsProtectConfig(): RpcConfig",
        "+ verifyZeroRevert(txHash): boolean"
    ], C_GREEN)

    # Class 6: CryptoMarketService
    draw_class(7.7, 1.0, 2.9, 3.2, "CryptoMarketService", [
        "- cmcApiKey: string",
        "- cacheTtlSeconds: number",
        "- historicalPrices: Map<string, number[]>"
    ], [
        "+ fetchMarketTrends(): Promise<Trends>",
        "+ calculateRSI(symbol, period=14): number",
        "+ calculateMACD(symbol): MACDResult",
        "+ getFearAndGreedIndex(): Promise<FnG>",
        "+ getDynamicGasTiers(): Promise<GasTiers>"
    ], C_SECONDARY)

    # Associations
    # MEVDetector -> MempoolTransaction (1 to many)
    ax.annotate("", xy=(3.5, 6.3), xytext=(4.0, 6.3),
                arrowprops=dict(arrowstyle="->", color=C_PRIMARY, lw=1.2))
    ax.text(3.75, 6.45, "analyzes", fontsize=6, fontweight='bold', color=C_PRIMARY, ha='center')

    # MEVDetector -> MEVAttack (creates)
    ax.annotate("", xy=(7.7, 6.3), xytext=(7.3, 6.3),
                arrowprops=dict(arrowstyle="->", color=C_RED, lw=1.2))
    ax.text(7.5, 6.45, "generates", fontsize=6, fontweight='bold', color=C_RED, ha='center')

    # AlchemyMempoolService -> MempoolTransaction (produces)
    ax.annotate("", xy=(1.9, 4.8), xytext=(1.9, 4.2),
                arrowprops=dict(arrowstyle="->", color=C_PRIMARY, lw=1.2))
    ax.text(2.1, 4.5, "ingests", fontsize=6, fontweight='bold', color=C_PRIMARY)

    # AlchemyMempoolService -> MEVDetector (feeds)
    ax.annotate("", xy=(4.0, 5.2), xytext=(3.5, 2.6),
                arrowprops=dict(arrowstyle="->", color=C_ACCENT, lw=1.2, linestyle='--'))

    # FlashbotsService -> MEVAttack (mitigates)
    ax.annotate("", xy=(8.5, 4.8), xytext=(6.5, 4.2),
                arrowprops=dict(arrowstyle="->", color=C_GREEN, lw=1.2, linestyle='--'))
    ax.text(7.7, 4.4, "mitigates", fontsize=6, fontweight='bold', color=C_GREEN)

    plt.tight_layout()
    plt.savefig('report_diagrams/class_diagram.png', bbox_inches='tight')
    plt.close()
    print("Generated: report_diagrams/class_diagram.png")


# ----------------------------------------------------------------------
# 3. AMM CONSTANT PRODUCT SANDWICH CURVE
# ----------------------------------------------------------------------
def draw_amm_sandwich_curve():
    fig, ax = plt.subplots(figsize=(10, 6.5), dpi=300)
    
    # Constant Product Curve: x * y = k
    k = 10000
    x = np.linspace(30, 250, 400)
    y = k / x

    ax.plot(x, y, color=C_PRIMARY, lw=2.5, label=r'Uniswap V2 AMM Invariant: $R_x \cdot R_y = k$')
    
    # Initial State P0
    x0, y0 = 100, 100
    ax.plot(x0, y0, 'o', color=C_PRIMARY, markersize=8)
    ax.text(x0 + 4, y0 + 4, r'State $P_0$ (Initial Pool Balance: $100X, 100Y$)' + '\n' + r'Price $P = 1.00$', fontsize=7.5, fontweight='bold', color=C_PRIMARY)

    # State P1: Attacker Front-Run Buy (Pumps price)
    x1, y1 = 70, k / 70
    ax.plot(x1, y1, 'o', color=C_RED, markersize=8)
    ax.annotate("", xy=(x1, y1), xytext=(x0, y0),
                arrowprops=dict(arrowstyle="->", color=C_RED, lw=2, linestyle='-'))
    ax.text(x1 - 38, y1 + 5, r'Step 1: Attacker Front-Run Buy ($Tx_A$)' + '\n' + r'Pumps Price to $P_1 = 2.04$ (+104%)', fontsize=7.5, fontweight='bold', color=C_RED)

    # State P2: Victim Swap Executed (Suffers maximum slippage)
    x2, y2 = 50, k / 50
    ax.plot(x2, y2, 'o', color=C_AMBER, markersize=8)
    ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle="->", color=C_AMBER, lw=2, linestyle='-'))
    ax.text(x2 - 42, y2 + 5, r'Step 2: Victim Swap ($Tx_V$)' + '\n' + r'Executes at Worst Price $P_2 = 4.00$' + '\n' + r'(Victim Slippage Loss = $1,840)', fontsize=7.5, fontweight='bold', color=C_AMBER)

    # State P3: Attacker Back-Run Sell (Extracts profit)
    x3, y3 = 100, 100
    ax.annotate("", xy=(x3, y3), xytext=(x2, y2),
                arrowprops=dict(arrowstyle="->", color=C_GREEN, lw=2, linestyle='--'))
    ax.text(80, 50, r'Step 3: Attacker Back-Run Sell ($Tx_B$)' + '\n' + r'Liquidates Asset $\Delta Y$' + '\n' + r'Net Attacker Profit $\Pi = \$1,215$', fontsize=8, fontweight='bold', color=C_GREEN)

    ax.set_title("Mathematical Mechanics of a Sandwich Attack on Constant Product AMM", fontsize=12, fontweight='bold', color=C_PRIMARY, pad=15)
    ax.set_xlabel("Reserve of Token X ($R_x$ in Pool)", fontsize=9, fontweight='bold', color=C_TEXT)
    ax.set_ylabel("Reserve of Token Y ($R_y$ in Pool)", fontsize=9, fontweight='bold', color=C_TEXT)
    ax.grid(True, linestyle=':', alpha=0.6)
    ax.legend(loc='upper right', fontsize=8)

    plt.tight_layout()
    plt.savefig('report_diagrams/sandwich_math_diagram.png', bbox_inches='tight')
    plt.close()
    print("Generated: report_diagrams/sandwich_math_diagram.png")


if __name__ == "__main__":
    draw_sequence_diagram()
    draw_class_diagram()
    draw_amm_sandwich_curve()
    print("All additional academic diagrams generated successfully!")

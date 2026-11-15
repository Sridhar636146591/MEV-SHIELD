"""
Generate High-Quality UML and System Architecture Diagrams for
Presidency University CSS2271 CA3 Mini Project Report: MEV Shield
"""

import os
import tempfile
os.environ['MPLCONFIGDIR'] = os.path.join(tempfile.gettempdir(), 'mpl')

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, Circle, Polygon, ConnectionPatch

os.makedirs('report_diagrams', exist_ok=True)

# Common Styling Constants
C_PRIMARY = '#0F172A'      # Deep Navy
C_SECONDARY = '#1E293B'    # Slate Dark
C_ACCENT = '#0284C7'       # Ocean Blue
C_ACCENT_LIGHT = '#E0F2FE' # Sky Light
C_GREEN = '#059669'        # Emerald Green
C_GREEN_LIGHT = '#ECFDF5'
C_AMBER = '#D97706'        # Amber
C_AMBER_LIGHT = '#FFFBEB'
C_RED = '#DC2626'          # Red
C_RED_LIGHT = '#FEF2F2'
C_BG = '#F8FAFC'           # Slate Light
C_BORDER = '#94A3B8'
C_TEXT = '#1E293B'


# ----------------------------------------------------------------------
# 1. USE CASE DIAGRAM
# ----------------------------------------------------------------------
def draw_use_case_diagram():
    fig, ax = plt.subplots(figsize=(11, 7.5), dpi=300)
    ax.set_xlim(0, 11)
    ax.set_ylim(0, 7.5)
    ax.axis('off')

    # Title
    ax.text(5.5, 7.2, "UML Use Case Diagram: MEV Shield System", 
            ha='center', va='center', fontsize=14, fontweight='bold', color=C_PRIMARY)
    
    # System Boundary Box
    system_box = FancyBboxPatch((2.2, 0.4), 6.6, 6.4, boxstyle="round,pad=0.1,rounding_size=0.15",
                                fc='#FFFFFF', ec=C_ACCENT, lw=2, linestyle='--')
    ax.add_patch(system_box)
    ax.text(5.5, 6.6, "System Boundary: MEV Shield & Attack Detection Platform", 
            ha='center', va='center', fontsize=10, fontweight='bold', color=C_ACCENT)

    # Helper function for Actor
    def draw_actor(x, y, label, role_color=C_PRIMARY):
        # Head
        circle = Circle((x, y + 0.35), 0.15, fc='#FFFFFF', ec=role_color, lw=1.8)
        ax.add_patch(circle)
        # Body
        ax.plot([x, x], [y + 0.2, y - 0.15], color=role_color, lw=1.8)
        # Arms
        ax.plot([x - 0.22, x + 0.22], [y + 0.08, y + 0.08], color=role_color, lw=1.8)
        # Legs
        ax.plot([x, x - 0.18], [y - 0.15, y - 0.45], color=role_color, lw=1.8)
        ax.plot([x, x + 0.18], [y - 0.15, y - 0.45], color=role_color, lw=1.8)
        # Label
        ax.text(x, y - 0.65, label, ha='center', va='top', fontsize=8.5, fontweight='bold', color=role_color)

    # Draw Primary Human Actors (Left)
    draw_actor(1.0, 5.4, "DeFi Trader\n(End User)", C_PRIMARY)
    draw_actor(1.0, 3.2, "Security Analyst /\nAuditor", C_PRIMARY)
    draw_actor(1.0, 1.2, "System Admin\n(DevOps)", C_PRIMARY)

    # Draw External Secondary System Actors (Right)
    draw_actor(10.0, 4.8, "Ethereum Mempool\n(Alchemy WSS)", C_ACCENT)
    draw_actor(10.0, 2.2, "Flashbots Relay\n(Block Builder)", C_GREEN)

    # Use Cases (Ellipses with text)
    use_cases = [
        ("UC-01: Ingest Pending Mempool Txs", 5.5, 6.0, C_ACCENT_LIGHT, C_ACCENT),
        ("UC-02: Detect Sandwich & Front-Run Attacks", 5.5, 5.25, C_RED_LIGHT, C_RED),
        ("UC-03: Compute Risk Score & Slippage", 5.5, 4.5, C_AMBER_LIGHT, C_AMBER),
        ("UC-04: Configure Flashbots Protect RPC", 5.5, 3.75, C_GREEN_LIGHT, C_GREEN),
        ("UC-05: Submit Private Bundle to Builder", 5.5, 3.0, C_GREEN_LIGHT, C_GREEN),
        ("UC-06: Simulate MEV Sandwich Attack", 5.5, 2.25, '#F1F5F9', C_SECONDARY),
        ("UC-07: Track Market Trends & Gas Fees", 5.5, 1.5, '#F1F5F9', C_SECONDARY),
        ("UC-08: Configure Multi-Channel Alerts", 5.5, 0.75, '#F1F5F9', C_SECONDARY),
    ]

    for label, x, y, fc, ec in use_cases:
        ellipse = patches.Ellipse((x, y), width=3.4, height=0.55, fc=fc, ec=ec, lw=1.4)
        ax.add_patch(ellipse)
        ax.text(x, y, label, ha='center', va='center', fontsize=8, fontweight='bold', color=C_TEXT)

    # Actor to Use Case Association Lines
    lines = [
        # Trader
        ((1.2, 5.4), (3.8, 4.5)),   # Compute Risk Score
        ((1.2, 5.4), (3.8, 3.75)),  # Configure Flashbots
        ((1.2, 5.4), (3.8, 2.25)),  # Simulate Attack
        ((1.2, 5.4), (3.8, 1.5)),   # Track Market Trends
        ((1.2, 5.4), (3.8, 0.75)),  # Configure Alerts
        # Analyst
        ((1.2, 3.2), (3.8, 5.25)),  # Detect Attacks
        ((1.2, 3.2), (3.8, 4.5)),   # Compute Risk
        ((1.2, 3.2), (3.8, 2.25)),  # Simulate Attack
        # Admin
        ((1.2, 1.2), (3.8, 6.0)),   # Ingest Txs
        ((1.2, 1.2), (3.8, 0.75)),  # Configure Alerts
        # External Systems (Right)
        ((9.8, 4.8), (7.2, 6.0)),   # Mempool to Ingest
        ((9.8, 4.8), (7.2, 5.25)),  # Mempool to Detect
        ((9.8, 2.2), (7.2, 3.75)),  # Flashbots to RPC
        ((9.8, 2.2), (7.2, 3.0)),   # Flashbots to Submit
    ]

    for start, end in lines:
        ax.annotate("", xy=end, xytext=start,
                    arrowprops=dict(arrowstyle="-", color='#64748B', lw=1.1, alpha=0.8))

    # <<include>> and <<extend>> relationships
    # UC-02 includes UC-01
    ax.annotate("", xy=(5.5, 5.55), xytext=(5.5, 5.7),
                arrowprops=dict(arrowstyle="->", color=C_ACCENT, lw=1.2, linestyle=':'))
    ax.text(5.95, 5.65, "<<include>>", fontsize=6.5, color=C_ACCENT, fontweight='bold')

    # UC-05 extends UC-04
    ax.annotate("", xy=(5.5, 3.45), xytext=(5.5, 3.3),
                arrowprops=dict(arrowstyle="->", color=C_GREEN, lw=1.2, linestyle=':'))
    ax.text(5.95, 3.4, "<<extend>>", fontsize=6.5, color=C_GREEN, fontweight='bold')

    plt.tight_layout()
    plt.savefig('report_diagrams/use_case_diagram.png', bbox_inches='tight')
    plt.close()
    print("Generated: report_diagrams/use_case_diagram.png")


# ----------------------------------------------------------------------
# 2. ACTIVITY DIAGRAM
# ----------------------------------------------------------------------
def draw_activity_diagram():
    fig, ax = plt.subplots(figsize=(10, 8.5), dpi=300)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 8.5)
    ax.axis('off')

    ax.text(5.0, 8.2, "UML Activity Diagram: Real-Time MEV Detection & Routing Flow", 
            ha='center', va='center', fontsize=13, fontweight='bold', color=C_PRIMARY)

    # Initial State (Solid Circle)
    init_circle = Circle((5.0, 7.7), 0.14, fc=C_PRIMARY, ec=C_PRIMARY)
    ax.add_patch(init_circle)
    ax.text(5.0, 7.92, "Start", ha='center', va='bottom', fontsize=7.5, fontweight='bold')

    # Helper for Action Node
    def draw_action(x, y, w, h, text, fc='#FFFFFF', ec=C_ACCENT):
        box = FancyBboxPatch((x - w/2, y - h/2), w, h, boxstyle="round,pad=0.08,rounding_size=0.1",
                             fc=fc, ec=ec, lw=1.3)
        ax.add_patch(box)
        ax.text(x, y, text, ha='center', va='center', fontsize=7.5, fontweight='bold', color=C_TEXT)

    # Helper for Decision Diamond
    def draw_decision(x, y, text):
        poly = Polygon([[x, y + 0.35], [x + 0.8, y], [x, y - 0.35], [x - 0.8, y]],
                       fc=C_AMBER_LIGHT, ec=C_AMBER, lw=1.3)
        ax.add_patch(poly)
        ax.text(x, y, text, ha='center', va='center', fontsize=7, fontweight='bold', color=C_TEXT)

    # Flow sequence
    # 1. Listen to Mempool
    draw_action(5.0, 7.0, 3.2, 0.45, "1. Ingest Pending Tx via Alchemy WSS / Poll", C_BG, C_ACCENT)
    ax.annotate("", xy=(5.0, 7.22), xytext=(5.0, 7.56),
                arrowprops=dict(arrowstyle="->", color=C_PRIMARY, lw=1.2))

    # 2. ABI Bytecode Decoding
    draw_action(5.0, 6.2, 3.2, 0.45, "2. Parse Calldata & Decode DEX Router ABI", C_BG, C_ACCENT)
    ax.annotate("", xy=(5.0, 6.42), xytext=(5.0, 6.78),
                arrowprops=dict(arrowstyle="->", color=C_PRIMARY, lw=1.2))

    # Fork Bar (Horizontal line)
    ax.plot([2.5, 7.5], [5.65, 5.65], color=C_PRIMARY, lw=3)
    ax.annotate("", xy=(5.0, 5.65), xytext=(5.0, 5.98),
                arrowprops=dict(arrowstyle="->", color=C_PRIMARY, lw=1.2))

    # 3 Parallel heuristic checks
    draw_action(2.8, 4.95, 2.2, 0.55, "3a. Evaluate Gas Outbid\n(Front-Running >= 10%)", C_RED_LIGHT, C_RED)
    draw_action(5.0, 4.95, 2.0, 0.55, "3b. Match Sequence\n(Sandwich TxA-TxV-TxB)", C_RED_LIGHT, C_RED)
    draw_action(7.2, 4.95, 2.2, 0.55, "3c. Detect Tail Swaps\n(Back-Run Liquidation)", C_RED_LIGHT, C_RED)

    ax.annotate("", xy=(2.8, 5.22), xytext=(2.8, 5.65), arrowprops=dict(arrowstyle="->", color=C_PRIMARY, lw=1.2))
    ax.annotate("", xy=(5.0, 5.22), xytext=(5.0, 5.65), arrowprops=dict(arrowstyle="->", color=C_PRIMARY, lw=1.2))
    ax.annotate("", xy=(7.2, 5.22), xytext=(7.2, 5.65), arrowprops=dict(arrowstyle="->", color=C_PRIMARY, lw=1.2))

    # Join Bar
    ax.plot([2.5, 7.5], [4.35, 4.35], color=C_PRIMARY, lw=3)
    ax.annotate("", xy=(2.8, 4.35), xytext=(2.8, 4.67), arrowprops=dict(arrowstyle="->", color=C_PRIMARY, lw=1.2))
    ax.annotate("", xy=(5.0, 4.35), xytext=(5.0, 4.67), arrowprops=dict(arrowstyle="->", color=C_PRIMARY, lw=1.2))
    ax.annotate("", xy=(7.2, 4.35), xytext=(7.2, 4.67), arrowprops=dict(arrowstyle="->", color=C_PRIMARY, lw=1.2))

    # 4. Compute Composite Risk Score & Dynamic Slippage
    draw_action(5.0, 3.8, 3.4, 0.45, "4. Compute Composite Risk Score (0-100%)\n& Calibrate Slippage Bounds", C_BG, C_ACCENT)
    ax.annotate("", xy=(5.0, 4.02), xytext=(5.0, 4.35), arrowprops=dict(arrowstyle="->", color=C_PRIMARY, lw=1.2))

    # Decision 1: High Risk?
    draw_decision(5.0, 2.9, "Score > 50% ?")
    ax.annotate("", xy=(5.0, 3.25), xytext=(5.0, 3.58), arrowprops=dict(arrowstyle="->", color=C_PRIMARY, lw=1.2))

    # Alert Branch (Yes - Right)
    draw_action(8.2, 2.9, 2.2, 0.5, "Dispatch Real-Time Alert\n(WebSocket + Email)", C_RED_LIGHT, C_RED)
    ax.annotate("", xy=(7.1, 2.9), xytext=(5.8, 2.9), arrowprops=dict(arrowstyle="->", color=C_RED, lw=1.2))
    ax.text(6.4, 3.02, "[Yes]", fontsize=7, fontweight='bold', color=C_RED)

    # Normal Flow (No - Down)
    ax.text(5.15, 2.35, "[No]", fontsize=7, fontweight='bold', color=C_GREEN)
    
    # Decision 2: User Action / Route Choice
    draw_decision(5.0, 1.8, "Route via\nFlashbots?")
    ax.annotate("", xy=(5.0, 2.15), xytext=(5.0, 2.55), arrowprops=dict(arrowstyle="->", color=C_PRIMARY, lw=1.2))
    # From alert back into routing decision
    ax.plot([8.2, 8.2, 5.8], [2.65, 1.8, 1.8], color=C_RED, lw=1.2, linestyle='--')
    ax.annotate("", xy=(5.8, 1.8), xytext=(6.2, 1.8), arrowprops=dict(arrowstyle="->", color=C_RED, lw=1.2))

    # Flashbots Route (Yes - Left)
    draw_action(2.0, 1.8, 2.4, 0.5, "Direct to Block Builder\n(Zero Revert / Private)", C_GREEN_LIGHT, C_GREEN)
    ax.annotate("", xy=(3.2, 1.8), xytext=(4.2, 1.8), arrowprops=dict(arrowstyle="->", color=C_GREEN, lw=1.2))
    ax.text(3.6, 1.95, "[Yes]", fontsize=7, fontweight='bold', color=C_GREEN)

    # Public Mempool (No - Down)
    draw_action(5.0, 0.9, 2.8, 0.45, "Submit to Public Mempool\n(Vulnerable to Extraction)", C_AMBER_LIGHT, C_AMBER)
    ax.annotate("", xy=(5.0, 1.12), xytext=(5.0, 1.45), arrowprops=dict(arrowstyle="->", color=C_AMBER, lw=1.2))
    ax.text(5.15, 1.3, "[No]", fontsize=7, fontweight='bold', color=C_AMBER)

    # End State
    # Final circle with ring
    final_outer = Circle((2.0, 0.9), 0.16, fc='#FFFFFF', ec=C_PRIMARY, lw=1.5)
    final_inner = Circle((2.0, 0.9), 0.10, fc=C_PRIMARY, ec=C_PRIMARY)
    ax.add_patch(final_outer)
    ax.add_patch(final_inner)
    ax.text(2.0, 0.62, "End / Mined", ha='center', va='top', fontsize=7.5, fontweight='bold')
    ax.annotate("", xy=(2.0, 1.06), xytext=(2.0, 1.55), arrowprops=dict(arrowstyle="->", color=C_PRIMARY, lw=1.2))
    ax.annotate("", xy=(2.16, 0.9), xytext=(3.6, 0.9), arrowprops=dict(arrowstyle="->", color=C_PRIMARY, lw=1.2))

    plt.tight_layout()
    plt.savefig('report_diagrams/activity_diagram.png', bbox_inches='tight')
    plt.close()
    print("Generated: report_diagrams/activity_diagram.png")


# ----------------------------------------------------------------------
# 3. SWIMLANE DIAGRAM
# ----------------------------------------------------------------------
def draw_swimlane_diagram():
    fig, ax = plt.subplots(figsize=(11, 7.5), dpi=300)
    ax.set_xlim(0, 11)
    ax.set_ylim(0, 7.5)
    ax.axis('off')

    ax.text(5.5, 7.2, "UML Swimlane Diagram: Transaction Protection Lifecycle", 
            ha='center', va='center', fontsize=13, fontweight='bold', color=C_PRIMARY)

    # 4 Swimlanes
    lanes = [
        ("User / Frontend Client\n(React 18 & MetaMask)", 0.2, 2.7, '#F8FAFC', C_ACCENT),
        ("MEV Detection Engine\n(Node.js & Express)", 2.9, 2.7, '#F1F5F9', C_PRIMARY),
        ("Public Ethereum Mempool\n(Alchemy WSS & Nodes)", 5.6, 2.5, '#FFFBEB', C_AMBER),
        ("Flashbots Builder Network\n(Private Block Builder)", 8.1, 2.7, '#ECFDF5', C_GREEN)
    ]

    for title, x, w, fc, tc in lanes:
        # Lane box
        lane_box = FancyBboxPatch((x, 0.5), w, 6.3, boxstyle="square,pad=0", fc=fc, ec='#CBD5E1', lw=1.2)
        ax.add_patch(lane_box)
        # Header box
        header_box = FancyBboxPatch((x, 6.2), w, 0.6, boxstyle="square,pad=0", fc=tc, ec='#CBD5E1', lw=1.2)
        ax.add_patch(header_box)
        ax.text(x + w/2, 6.5, title, ha='center', va='center', fontsize=7.5, fontweight='bold', color='#FFFFFF')

    # Helper for swimlane action node
    def draw_node(x, y, w, h, text, fc='#FFFFFF', ec=C_ACCENT):
        box = FancyBboxPatch((x - w/2, y - h/2), w, h, boxstyle="round,pad=0.06,rounding_size=0.08",
                             fc=fc, ec=ec, lw=1.1)
        ax.add_patch(box)
        ax.text(x, y, text, ha='center', va='center', fontsize=7, fontweight='bold', color=C_TEXT)

    # 1. User configures swap intent on Client UI
    draw_node(1.55, 5.7, 2.3, 0.45, "1. Configure Swap Intent\n(Token, Amount, Slippage)", '#FFFFFF', C_ACCENT)

    # 2. Alchemy streaming pending swaps
    draw_node(6.85, 5.7, 2.1, 0.45, "2. Broadcast Pending Tx\n(alchemy_pendingTransactions)", '#FFFFFF', C_AMBER)

    # 3. Detection Engine ingests & calculates risk
    draw_node(4.25, 4.9, 2.3, 0.5, "3. Ingest, Decode Calldata &\nDetect Sandwich Patterns", '#FFFFFF', C_PRIMARY)

    # 4. Engine evaluates high risk & calculates safe slippage
    draw_node(4.25, 4.1, 2.3, 0.5, "4. Compute Composite Risk (85%)\n& Calibrate Recommended Slippage", C_RED_LIGHT, C_RED)

    # 5. Alert pushed to Client UI
    draw_node(1.55, 4.1, 2.3, 0.45, "5. Display High-Risk Warning\n& Advise Flashbots Route", C_RED_LIGHT, C_RED)

    # 6. User chooses 1-Click Flashbots Protect
    draw_node(1.55, 3.1, 2.3, 0.45, "6. Sign Private Bundle via\nFlashbots Protect RPC", C_GREEN_LIGHT, C_GREEN)

    # 7. Engine packages & verifies bundle
    draw_node(4.25, 3.1, 2.3, 0.45, "7. Simulate & Validate\nBundle via eth_callBundle", '#FFFFFF', C_PRIMARY)

    # 8. Flashbots Relay receives bundle
    draw_node(9.45, 2.2, 2.3, 0.5, "8. Submit Directly to Builder\n(Bypasses Public Mempool)", C_GREEN_LIGHT, C_GREEN)

    # 9. Builder seals block
    draw_node(9.45, 1.3, 2.3, 0.45, "9. Package in Target Block\nwith Zero Revert Guarantee", C_GREEN_LIGHT, C_GREEN)

    # 10. Mined & Confirmed on UI
    draw_node(1.55, 1.3, 2.3, 0.45, "10. Transaction Confirmed!\nNo Slippage Exploitation ($ Saved)", '#FFFFFF', C_GREEN)

    # Directed Connectors between Swimlanes
    def connect_pts(p1, p2, col=C_PRIMARY, ls='-'):
        ax.annotate("", xy=p2, xytext=p1,
                    arrowprops=dict(arrowstyle="->", color=col, lw=1.2, linestyle=ls))

    # Connect 2 -> 3
    connect_pts((5.8, 5.7), (5.4, 5.0), C_AMBER)
    # Connect 3 -> 4
    connect_pts((4.25, 4.65), (4.25, 4.35), C_PRIMARY)
    # Connect 4 -> 5
    connect_pts((3.1, 4.1), (2.7, 4.1), C_RED)
    # Connect 5 -> 6
    connect_pts((1.55, 3.88), (1.55, 3.32), C_ACCENT)
    # Connect 6 -> 7
    connect_pts((2.7, 3.1), (3.1, 3.1), C_GREEN)
    # Connect 7 -> 8
    connect_pts((5.4, 3.1), (8.3, 2.35), C_GREEN)
    # Connect 8 -> 9
    connect_pts((9.45, 1.95), (9.45, 1.52), C_GREEN)
    # Connect 9 -> 10
    connect_pts((8.3, 1.3), (2.7, 1.3), C_GREEN)

    plt.tight_layout()
    plt.savefig('report_diagrams/swimlane_diagram.png', bbox_inches='tight')
    plt.close()
    print("Generated: report_diagrams/swimlane_diagram.png")


# ----------------------------------------------------------------------
# 4. SYSTEM ARCHITECTURE DIAGRAM
# ----------------------------------------------------------------------
def draw_system_architecture_diagram():
    fig, ax = plt.subplots(figsize=(11, 7.5), dpi=300)
    ax.set_xlim(0, 11)
    ax.set_ylim(0, 7.5)
    ax.axis('off')

    ax.text(5.5, 7.2, "High-Level System Architecture: MEV Shield Platform", 
            ha='center', va='center', fontsize=14, fontweight='bold', color=C_PRIMARY)

    # 5 Major Architectural Layers
    layers = [
        ("Layer 1: Presentation & User Interface (Port 3000)", 6.0, 0.9, '#EFF6FF', C_ACCENT, [
            ("Main Dashboard\n& KPI Cards", 1.8),
            ("Live Attack Feed\n& Inspector", 3.65),
            ("Mempool Radar\n& Gas Gauges", 5.5),
            ("Crypto Trends\n(RSI / MACD)", 7.35),
            ("Attack Simulator\n& Web3 Wallet", 9.2)
        ]),
        ("Layer 2: Application Routing & Real-Time Gateway (Port 3001)", 4.7, 0.8, '#F8FAFC', C_PRIMARY, [
            ("Express HTTP REST\nControllers (/api/*)", 2.7),
            ("WebSocket Broadcaster\n(ws://localhost:3001)", 5.5),
            ("Security, CORS &\nRate-Limit Middleware", 8.3)
        ]),
        ("Layer 3: Analytics, Threat Classification & Simulation Services", 3.4, 0.8, '#FEF2F2', C_RED, [
            ("MEV Detection Engine\n(Sandwich / Front-Run)", 2.3),
            ("Risk Scoring & Slippage\nCalibration Engine", 4.45),
            ("Crypto Market Intelligence\n& Technical Indicators", 6.6),
            ("Multi-Channel Alerting\n(Push & SMTP Email)", 8.75)
        ]),
        ("Layer 4: Ingestion, Decoding & Local State Cache", 2.1, 0.8, '#FFFBEB', C_AMBER, [
            ("Alchemy Ingestion Engine\n(WSS Subscription + Poller)", 3.2),
            ("ABI Bytecode Decoder\n(Uniswap V2/V3, 1inch, Curve)", 5.5),
            ("Memory Ring Buffer\n& Session Cache", 7.8)
        ]),
        ("Layer 5: External Blockchain Networks & Specialized APIs", 0.8, 0.8, '#ECFDF5', C_GREEN, [
            ("Ethereum Mainnet / Sepolia\n(Alchemy JSON-RPC & WSS)", 2.7),
            ("Flashbots Protect RPC\n& Builder Relay Network", 5.5),
            ("CoinMarketCap & CoinGecko\n+ Alternative.me Fear/Greed", 8.3)
        ])
    ]

    for title, y_center, h, bg, border_col, components in layers:
        # Layer Container
        box = FancyBboxPatch((0.5, y_center - h/2), 10.0, h, boxstyle="round,pad=0.06,rounding_size=0.1",
                             fc=bg, ec=border_col, lw=1.3)
        ax.add_patch(box)
        # Layer Header Label
        ax.text(0.65, y_center + h/2 - 0.12, title, fontsize=7.5, fontweight='bold', color=border_col)

        # Components inside layer
        w_comp = 1.7 if len(components) == 5 else (2.4 if len(components) == 3 else 2.0)
        h_comp = 0.52
        for comp_name, cx in components:
            c_box = FancyBboxPatch((cx - w_comp/2, y_center - h_comp/2 - 0.04), w_comp, h_comp,
                                  boxstyle="round,pad=0.04,rounding_size=0.06",
                                  fc='#FFFFFF', ec='#CBD5E1', lw=1.0)
            ax.add_patch(c_box)
            ax.text(cx, y_center - 0.04, comp_name, ha='center', va='center', fontsize=6.8, fontweight='bold', color=C_TEXT)

    # Inter-layer communication arrows
    for y_top in [5.55, 4.25, 2.95, 1.65]:
        ax.annotate("", xy=(5.5, y_top - 0.15), xytext=(5.5, y_top + 0.05),
                    arrowprops=dict(arrowstyle="<->", color='#64748B', lw=1.5))

    plt.tight_layout()
    plt.savefig('report_diagrams/system_architecture_diagram.png', bbox_inches='tight')
    plt.close()
    print("Generated: report_diagrams/system_architecture_diagram.png")


if __name__ == "__main__":
    draw_use_case_diagram()
    draw_activity_diagram()
    draw_swimlane_diagram()
    draw_system_architecture_diagram()
    print("All 4 report diagrams generated successfully in 'report_diagrams/' directory!")

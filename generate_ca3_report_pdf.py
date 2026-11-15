"""
Presidency University - CSS2271 Software Design and Development
CA3 - Mini Project (Design Phase) Report Generator
Generates a formal, publication-grade academic PDF report.
"""

import os
import sys
import reportlab.rl_config
reportlab.rl_config.pageCompression = 0

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable, Image
)
from reportlab.pdfgen import canvas

# ----------------------------------------------------------------------
# Two-Pass Canvas for Dynamic Page Numbering & University Running Headers
# ----------------------------------------------------------------------
class AcademicNumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(AcademicNumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            if self._pageNumber > 1:
                self.draw_page_decorations(num_pages)
            super(AcademicNumberedCanvas, self).showPage()
        super(AcademicNumberedCanvas, self).save()

    def draw_page_decorations(self, total_pages):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Running Header (Top)
        header_y = 841.89 - 36
        self.drawString(45, header_y, "PRESIDENCY UNIVERSITY  |  CSS2271 Software Design and Development")
        self.drawRightString(595.27 - 45, header_y, "CA3 Mini Project (Design Phase)")
        
        # Header Rule
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.6)
        self.line(45, header_y - 6, 595.27 - 45, header_y - 6)

        # Running Footer (Bottom)
        footer_y = 36
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.6)
        self.line(45, footer_y + 12, 595.27 - 45, footer_y + 12)
        
        self.drawString(45, footer_y, "MEV Shield: Real-Time Blockchain Mempool Attack Detection System")
        page_str = f"Page {self._pageNumber} of {total_pages}"
        self.drawRightString(595.27 - 45, footer_y, page_str)
        
        self.restoreState()


# ----------------------------------------------------------------------
# PDF Generation Function
# ----------------------------------------------------------------------
def build_ca3_report_pdf(filename="CA3_Project_Design_Report_MEV_Detector.pdf"):
    pdf_path = os.path.abspath(filename)
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=A4,
        leftMargin=45,
        rightMargin=45,
        topMargin=50,
        bottomMargin=50
    )

    styles = getSampleStyleSheet()
    
    # Palette
    c_primary = colors.HexColor("#0F172A")    # Deep Navy
    c_secondary = colors.HexColor("#1E293B")  # Slate
    c_accent = colors.HexColor("#0284C7")     # Ocean Blue
    c_accent_dark = colors.HexColor("#0369A1")# Blue
    c_body = colors.HexColor("#334155")       # Text Slate
    c_light_bg = colors.HexColor("#F8FAFC")   # Light Slate
    c_border = colors.HexColor("#CBD5E1")     # Border
    c_green = colors.HexColor("#059669")
    c_red = colors.HexColor("#DC2626")

    # Typography Styles
    univ_header_style = ParagraphStyle(
        'UnivHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        textColor=c_primary,
        alignment=1, # Center
        spaceAfter=2
    )

    dept_style = ParagraphStyle(
        'DeptHeader',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=13,
        textColor=c_accent_dark,
        alignment=1,
        spaceAfter=10
    )

    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=c_primary,
        alignment=1,
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=10.5,
        leading=14,
        textColor=c_secondary,
        alignment=1,
        spaceAfter=15
    )

    h1_style = ParagraphStyle(
        'CustomH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=c_primary,
        spaceBefore=12,
        spaceAfter=5,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'CustomH2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=c_accent_dark,
        spaceBefore=9,
        spaceAfter=3,
        keepWithNext=True
    )

    h3_style = ParagraphStyle(
        'CustomH3',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=c_secondary,
        spaceBefore=6,
        spaceAfter=2,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=c_body,
        spaceAfter=5
    )

    bullet_style = ParagraphStyle(
        'CustomBullet',
        parent=body_style,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=3
    )

    table_header = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.white,
        alignment=0
    )

    table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=10,
        textColor=c_body,
        alignment=0
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=table_cell,
        fontName='Helvetica-Bold',
        textColor=c_primary
    )

    callout_style = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=c_secondary
    )

    caption_style = ParagraphStyle(
        'Caption',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=c_primary,
        alignment=1, # Center
        spaceBefore=4,
        spaceAfter=8
    )

    story = []

    # Helper Table Builder
    def make_table(headers, rows, col_widths):
        data = [[Paragraph(h, table_header) for h in headers]]
        for row in rows:
            formatted_row = []
            for cell in row:
                if isinstance(cell, str):
                    formatted_row.append(Paragraph(cell, table_cell))
                else:
                    formatted_row.append(cell)
            data.append(formatted_row)
        
        t = Table(data, colWidths=col_widths)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), c_secondary),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('GRID', (0,0), (-1,-1), 0.5, c_border),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_light_bg]),
            ('TOPPADDING', (0,0), (-1,-1), 3.5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
            ('LEFTPADDING', (0,0), (-1,-1), 5),
            ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ]))
        return t

    def make_callout(text, title="KEY ARCHITECTURAL DIRECTIVE", bg="#EFF6FF", border="#3B82F6"):
        p_title = Paragraph(f"<b>{title}</b>", ParagraphStyle('CTitle', parent=body_style, fontName='Helvetica-Bold', textColor=colors.HexColor(border), fontSize=8))
        p_body = Paragraph(text, callout_style)
        tbl = Table([[p_title], [p_body]], colWidths=[505.27])
        tbl.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor(bg)),
            ('BOX', (0,0), (-1,-1), 0.8, colors.HexColor(border)),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ]))
        return tbl

    # ==================================================================
    # COVER PAGE
    # ==================================================================
    story.append(Spacer(1, 10))
    # University Header Bar
    u_bar = Table([[""]], colWidths=[505.27], rowHeights=[4])
    u_bar.setStyle(TableStyle([('BACKGROUND', (0,0), (-1,-1), c_accent)]))
    story.append(u_bar)
    story.append(Spacer(1, 12))

    story.append(Paragraph("PRESIDENCY UNIVERSITY", univ_header_style))
    story.append(Paragraph("SCHOOL OF COMPUTER SCIENCE AND ENGINEERING<br/>DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING", dept_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_border, spaceBefore=4, spaceAfter=14))

    # Badge Box
    badge = Table([[Paragraph(
        "<b>COURSE: CSS2271 – SOFTWARE DESIGN AND DEVELOPMENT</b><br/>"
        "<font color='#0284C7'><b>CA3 – MINI PROJECT (DESIGN PHASE) DOCUMENTATION</b></font>",
        ParagraphStyle('Bdg', parent=body_style, fontSize=9, leading=13, alignment=1, textColor=c_primary)
    )]], colWidths=[505.27])
    badge.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F1F5F9")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(badge)
    story.append(Spacer(1, 14))

    story.append(Paragraph("MEV SHIELD: REAL-TIME BLOCKCHAIN MEMPOOL ATTACK DETECTION & MITIGATION SYSTEM", title_style))
    story.append(Paragraph("Design-Phase Software Architecture, Algorithmic Heuristics, UML Specifications, and Security Verification", subtitle_style))
    story.append(Spacer(1, 10))

    # Submission Metadata Grid
    meta_info = [
        [Paragraph("<b>Course Code & Title:</b>", table_cell_bold), Paragraph("CSS2271 - Software Design and Development", table_cell),
         Paragraph("<b>Submission Date:</b>", table_cell_bold), Paragraph("15 November 2026", table_cell)],
        [Paragraph("<b>Assessment Component:</b>", table_cell_bold), Paragraph("CA3 - Mini Project (Design Phase)", table_cell),
         Paragraph("<b>Mode of Submission:</b>", table_cell_bold), Paragraph("Hardcopy / Printed Report", table_cell)],
        [Paragraph("<b>Maximum Marks:</b>", table_cell_bold), Paragraph("20 Marks", table_cell),
         Paragraph("<b>Evaluation Status:</b>", table_cell_bold), Paragraph("<font color='#059669'><b>Final Design Submission</b></font>", table_cell)],
        [Paragraph("<b>Project Category:</b>", table_cell_bold), Paragraph("Web3 & Blockchain Cybersecurity", table_cell),
         Paragraph("<b>Target Network:</b>", table_cell_bold), Paragraph("Ethereum Mainnet & Sepolia", table_cell)],
        [Paragraph("<b>Technology Stack:</b>", table_cell_bold), Paragraph("Node.js, Express, TypeScript, React 18", table_cell),
         Paragraph("<b>Relay Infrastructure:</b>", table_cell_bold), Paragraph("Flashbots Protect RPC / Relays", table_cell)]
    ]
    meta_tbl = Table(meta_info, colWidths=[120, 132, 120, 133])
    meta_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_light_bg),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(meta_tbl)
    story.append(Spacer(1, 12))

    story.append(make_callout(
        "<b>ACADEMIC DECLARATION:</b> This documentation fulfills the rigorous design-phase requirements for the CA3 Mini Project "
        "in CSS2271 Software Design and Development. All problem analyses, feasibility assessments, IEEE 830 functional/non-functional "
        "specifications, UML diagrams (Use Case, Activity, Swimlane), and high-level system architectures reflect genuine, "
        "original engineering work and domain modeling tailored to real-time Ethereum mempool security.",
        title="DECLARATION OF ORIGINAL DESIGN WORK",
        bg="#F8FAFC",
        border="#0284C7"
    ))
    story.append(Spacer(1, 12))

    # Executive Summary Card
    story.append(Paragraph("<b>Executive Summary</b>", h3_style))
    story.append(Paragraph(
        "Decentralized Finance (DeFi) traders lose hundreds of millions of dollars annually to predatory Maximal Extractable Value "
        "(MEV) bots that exploit transaction visibility in the public Ethereum mempool. <b>MEV Shield</b> resolves this vulnerability "
        "by combining sub-100ms mempool telemetry ingestion, algorithmic sandwich attack detection, dynamic slippage calibration, and "
        "single-click private routing via Flashbots Protect RPC. This report delivers the complete software engineering design documentation.",
        body_style
    ))

    story.append(PageBreak())

    # ==================================================================
    # TABLE OF CONTENTS
    # ==================================================================
    story.append(Paragraph("TABLE OF CONTENTS", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_accent, spaceBefore=2, spaceAfter=8))

    toc_items = [
        ["1.0", "PROBLEM ANALYSIS", "Problem Statement, Existing Problem, Proposed Solution, Objectives, Scope, Users/Stakeholders", "Page 2"],
        ["2.0", "FEASIBILITY STUDY", "Technical Feasibility, Economic Feasibility, Operational Feasibility, Feasibility Conclusion", "Page 4"],
        ["3.0", "SOFTWARE REQUIREMENTS SPECIFICATION (SRS)", "System Purpose, Functional Requirements (FR-01 to FR-12), Non-Functional Requirements, Constraints", "Page 4"],
        ["4.0", "UML DIAGRAMS", "4.1 UML Use Case Diagram\n4.2 UML Activity Diagram\n4.3 UML Swimlane Diagram", "Page 6"],
        ["5.0", "SOFTWARE / SYSTEM ARCHITECTURE", "High-Level Architecture Diagram, Layered Architecture Breakdown (Presentation, Application, Analytics, Ingestion)", "Page 9"],
        ["6.0", "CONCLUSION", "Summary of Proposed System, Key Strengths, Future Enhancements & Scope", "Page 10"]
    ]
    toc_table = Table(
        [[Paragraph(f"<b>{row[0]}</b>", table_cell_bold), Paragraph(f"<b>{row[1]}</b>", table_cell_bold), Paragraph(row[2].replace('\n', '<br/>'), table_cell), Paragraph(f"<b>{row[3]}</b>", table_cell_bold)] for row in toc_items],
        colWidths=[30, 160, 265.27, 50]
    )
    toc_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_light_bg),
        ('GRID', (0,0), (-1,-1), 0.5, c_border),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(toc_table)
    story.append(Spacer(1, 14))

    # ==================================================================
    # 1. PROBLEM ANALYSIS
    # ==================================================================
    story.append(Paragraph("1.0 PROBLEM ANALYSIS", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.8, color=c_accent, spaceBefore=2, spaceAfter=8))

    story.append(Paragraph("1.1 Problem Statement", h2_style))
    story.append(Paragraph(
        "Decentralized Finance (DeFi) protocols operating on Ethereum and EVM blockchains rely on Automated Market Makers (AMMs) "
        "such as Uniswap and SushiSwap to process billions of dollars in daily trade volume. However, unlike traditional centralized "
        "exchanges that execute trades in private matching engines, public blockchains broadcast unconfirmed transactions to an "
        "unencrypted peer-to-peer memory pool (<b>Mempool</b>) prior to block inclusion. Malicious algorithmic actors, known as "
        "<b>MEV Searchers</b>, scan this staging area in real time and exploit transaction ordering to extract financial value "
        "from unsuspecting traders. The most pervasive vector—the <b>Sandwich Attack</b>—involves an attacker buying ahead of a victim "
        "trade to pump the asset price, forcing the victim to execute at maximum slippage, and selling immediately after to capture pure profit.",
        body_style
    ))

    story.append(Paragraph("1.2 Existing Problem", h2_style))
    story.append(Paragraph("• <b>Mempool Transparency & Information Asymmetry:</b> Retail swap parameters (token pair, trade size, slippage) are fully visible in the public mempool before execution, allowing automated bots to exploit them.", bullet_style))
    story.append(Paragraph("• <b>Forced Maximum Slippage Execution:</b> AMMs default to 0.5%–3.0% slippage tolerance. Searchers manipulate liquidity pool reserves to force trades to execute at the worst allowable price boundary.", bullet_style))
    story.append(Paragraph("• <b>Priority Gas Auctions (PGAs):</b> Multiple bots competing for the same swap engage in gas price bidding wars, artificially congesting the blockchain and wasting non-refundable gas on failed attempts.", bullet_style))
    story.append(Paragraph("• <b>Absence of Pre-Execution Alerts:</b> Standard Web3 interfaces provide zero warning to traders when their pending transaction is targeted by searchers, leaving them vulnerable until after financial losses occur.", bullet_style))

    story.append(Paragraph("1.3 Proposed Solution", h2_style))
    story.append(Paragraph(
        "<b>MEV Shield</b> is an end-to-end security and analytical middleware platform that solves these problems through: "
        "(1) Sub-100ms mempool ingestion via Alchemy WebSocket streams; (2) Algorithmic classification of sandwich attacks, "
        "front-running, and back-running; (3) Multi-factor risk scoring (0–100%) and dynamic slippage calibration; (4) One-click "
        "Flashbots Protect RPC routing to bypass the public mempool entirely; (5) Interactive attack simulation for user training; "
        "and (6) Instant WebSocket push notifications and email alerts.",
        body_style
    ))

    story.append(Paragraph("1.4 Objectives", h2_style))
    story.append(Paragraph("1. Deliver sub-100ms real-time mempool transaction ingestion across Ethereum Mainnet and Sepolia.", bullet_style))
    story.append(Paragraph("2. Achieve >95% accuracy in classifying sandwich attacks and priority gas front-running.", bullet_style))
    story.append(Paragraph("3. Provide dynamic, pool-depth calibrated slippage bounds to prevent exploitable trade settings.", bullet_style))
    story.append(Paragraph("4. Enable zero-custody, one-click Flashbots Protect private routing inside MetaMask.", bullet_style))
    story.append(Paragraph("5. Provide interactive attack simulation and comprehensive cryptocurrency market analytics (RSI, MACD, Fear & Greed).", bullet_style))

    story.append(Paragraph("1.5 Scope & Users/Stakeholders", h2_style))
    story.append(Paragraph(
        "<b>System Scope:</b> Covers Ethereum Mainnet & Sepolia mempool transactions, Uniswap V2/V3 and major DEX router ABI parsing, "
        "Flashbots Protect RPC bundling, and real-time frontend monitoring. Excludes custodial fund management and consensus modifications.",
        body_style
    ))

    stakeholders_data = [
        ["Stakeholder", "Primary Needs & Objectives", "System Interactions"],
        ["Retail DeFi Trader", "Execute swaps safely without sandwich losses or high slippage.", "Executive Dashboard, Flashbots 1-Click Setup, Slippage Calculator."],
        ["Arbitrageur / Fund", "Monitor high-value swap flows, mempool congestion, and gas spikes.", "Live Mempool Radar, Private Bundle Builder, RSI/MACD Gauges."],
        ["Security Auditor", "Investigate searcher contracts, attack patterns, and exploit data.", "Attack Detector Stream, Risk Heatmap, Etherscan Inspector."],
        ["DeFi Student", "Learn how MEV extraction, PGAs, and block builders operate.", "Interactive MEV Attack Simulator, Knowledge Base."],
        ["System Administrator", "Maintain continuous monitoring service uptime and RPC quota.", "Health Endpoint (`/api/health`), Server Telemetry."]
    ]
    story.append(make_table(["Stakeholder", "Primary Needs & Objectives", "System Interactions"], stakeholders_data[1:], [110, 205.27, 190]))
    story.append(Spacer(1, 10))

    # ==================================================================
    # 2. FEASIBILITY STUDY
    # ==================================================================
    story.append(PageBreak())
    story.append(Paragraph("2.0 FEASIBILITY STUDY", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.8, color=c_accent, spaceBefore=2, spaceAfter=8))

    story.append(Paragraph("2.1 Technical Feasibility", h2_style))
    story.append(Paragraph(
        "The technical feasibility was evaluated against Ethereum block generation timing, data throughput, and architectural complexity: "
        "<br/>• <b>Timing & Latency:</b> Ethereum PoS slot time is 12 seconds. Telemetry ingestion via Alchemy WSS requires 30–80ms, "
        "and calldata ABI decoding takes $<20\text{ms}$. This leaves over 11 seconds for risk scoring and alert dispatching before block inclusion. "
        "<br/>• <b>Algorithmic Complexity:</b> Detection heuristics operate in $O(N)$ linear time over a rolling memory buffer of 1,000 pending txs. "
        "<br/>• <b>Zero-Custody Standard:</b> Web3 authentication uses EIP-1193 MetaMask; private keys never leave the client's browser. "
        "<br/>• <b>Relay Availability:</b> Flashbots Protect endpoints (`https://rpc.flashbots.net`) are production-tested and supported by >80% of validators.",
        body_style
    ))

    story.append(Paragraph("2.2 Economic Feasibility", h2_style))
    story.append(Paragraph(
        "• <b>Development & Hosting Costs:</b> Built with open-source tools (Node.js, Express, React, Tailwind CSS, ReportLab). Server requirements "
        "are modest (2–4 vCPUs, 4–8 GB RAM), costing less than $20–$40/month on standard cloud VMs. "
        "<br/>• <b>Data Provider Expenses:</b> Alchemy provides generous free-tier compute units (300M CUs/month), and CoinGecko/Alternative.me provide "
        "free market data endpoints, eliminating costly recurring licenses. "
        "<br/>• <b>Economic Return:</b> MEV searchers extracted over $300M in 2023–2024. Preventing slippage losses saves $15–$120 per high-value swap for users.",
        body_style
    ))

    story.append(Paragraph("2.3 Operational Feasibility", h2_style))
    story.append(Paragraph(
        "• <b>Seamless User Onboarding:</b> Adding Flashbots Protect to MetaMask is fully automated via 1-click button (`wallet_addEthereumChain`). "
        "<br/>• <b>No Workflow Disruption:</b> Users trade as usual on Uniswap, 1inch, or SushiSwap; MEV Shield acts as an invisible protective gateway. "
        "<br/>• <b>Fault Tolerance:</b> If external APIs fail or rate limits are reached, the system automatically falls back to cached telemetry and mock datasets.",
        body_style
    ))

    story.append(Paragraph("2.4 Feasibility Conclusion", h2_style))
    feas_conclusion_text = (
        "<b>CONCLUSION:</b> The MEV Shield project demonstrates exceptional feasibility across Technical, Economic, and Operational "
        "dimensions. The technology stack is robust and low-latency, capital costs are negligible, and user operational integration is friction-free."
    )
    story.append(make_callout(feas_conclusion_text, title="FEASIBILITY VERDICT: FULLY FEASIBLE & APPROVED", bg="#ECFDF5", border="#059669"))
    story.append(Spacer(1, 10))

    # ==================================================================
    # 3. SOFTWARE REQUIREMENTS SPECIFICATION (SRS)
    # ==================================================================
    story.append(Paragraph("3.0 SOFTWARE REQUIREMENTS SPECIFICATION (SRS)", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.8, color=c_accent, spaceBefore=2, spaceAfter=8))

    story.append(Paragraph("3.1 Purpose of the System", h2_style))
    story.append(Paragraph(
        "The purpose of MEV Shield is to provide an end-to-end security and monitoring middleware platform that detects predatory "
        "mempool transactions, quantifies risk, and protects decentralized exchange traders from extractable value exploitation.",
        body_style
    ))

    story.append(Paragraph("3.2 Functional Requirements", h2_style))
    fr_headers = ["ID", "Requirement Name", "Input & Processing Details", "Expected System Output"]
    fr_rows = [
        ["FR-01", "Mempool Ingestion", "Ingest unconfirmed transactions via Alchemy WSS (alchemy_pendingTransactions).", "Normalized MempoolTransaction queue."],
        ["FR-02", "Calldata ABI Decoding", "Extract Keccak-256 method selectors for Uniswap V2/V3, 1inch, Curve.", "Decoded token in, token out, amounts."],
        ["FR-03", "Sandwich Detection", "Evaluate sliding mempool window for (TxA, TxV, TxB) sequence targeting same pool.", "Flagged MEVAttack record with loss estimate."],
        ["FR-04", "Front-Running Detection", "Detect identical router target transactions with >= 10% gas price outbid.", "Front-run warning with risk score."],
        ["FR-05", "Back-Running Detection", "Identify tail transactions executing within 200ms of large market swaps.", "Back-run arbitrage tag."],
        ["FR-06", "Risk Scoring Engine", "Calculate composite score R in [0, 100] across gas, value, congestion, pattern.", "Risk score (0-100%) and severity level."],
        ["FR-07", "Dynamic Slippage Bounds", "Evaluate AMM pool depth and volatility to compute safe slippage bounds.", "Recommended slippage basis points (bps)."],
        ["FR-08", "Flashbots Protect RPC", "Trigger wallet_addEthereumChain to add Flashbots Protect RPC to MetaMask.", "1-click private RPC network in wallet."],
        ["FR-09", "Crypto Market Engine", "Aggregate crypto prices, 14-period RSI, MACD, Fear & Greed index, gas tiers.", "Live market telemetry & gas charts."],
        ["FR-10", "Attack Simulator", "Parametric inputs: trade volume, slippage %, pool depth.", "Visual step-by-step financial breakdown."],
        ["FR-11", "Alert Dispatching", "Broadcast WebSocket event packets and dispatch SMTP emails on threat match.", "Sub-second client push & email alerts."],
        ["FR-12", "Web3 Wallet Connect", "Connect via EIP-1193 MetaMask standard; display address and chain ID.", "Live connected wallet status badge."]
    ]
    story.append(make_table(fr_headers, fr_rows, [40, 105, 180, 180.27]))
    story.append(Spacer(1, 10))

    story.append(Paragraph("3.3 Non-Functional Requirements", h2_style))
    nfr_headers = ["ID", "Category", "Specification Benchmark", "Verification Standard"]
    nfr_rows = [
        ["NFR-01", "Ingestion Latency", "Mempool ingestion to normalized data MUST complete in < 100ms.", "Timestamp logging benchmark."],
        ["NFR-02", "Detection Latency", "Algorithmic attack classification MUST execute in < 150ms.", "Load test under peak queue."],
        ["NFR-03", "Throughput", "Backend MUST sustain continuous processing of 500+ tx/sec.", "Stress testing via mock replay."],
        ["NFR-04", "Zero Custody", "Server SHALL NOT request, ingest, or store private keys or seed phrases.", "Static code audit & penetration test."],
        ["NFR-05", "Transport Security", "All transport communications MUST enforce TLS 1.3 (HTTPS / WSS).", "SSL Labs A+ audit standard."],
        ["NFR-06", "High Availability", "Service uptime target 99.9% with automated fallback to polling loop.", "Uptime monitoring harness."],
        ["NFR-07", "UI Responsiveness", "Frontend UI MUST maintain 60 FPS rendering under active telemetry push.", "Chrome DevTools trace profiling."],
        ["NFR-08", "Compatibility", "Cross-browser support for Chrome, Edge, Firefox, Brave, Safari, and mobile.", "Cross-browser test matrix."]
    ]
    story.append(make_table(nfr_headers, nfr_rows, [50, 85, 220.27, 150]))
    story.append(Spacer(1, 10))

    story.append(Paragraph("3.4 Assumptions, Constraints & Major System Requirements", h2_style))
    story.append(Paragraph("• <b>Consensus Constraints:</b> Ethereum 12-second block intervals require sub-second processing.", bullet_style))
    story.append(Paragraph("• <b>RPC Rate Limits:</b> Architecture includes automated caching and mock dataset fallback.", bullet_style))
    story.append(Paragraph("• <b>Server Sizing:</b> Node.js v20+, TypeScript 5.x, Express.js, 2 vCPUs, 4 GB RAM, 100 Mbps network.", bullet_style))
    story.append(Paragraph("• <b>Client Sizing:</b> Evergreen browser with MetaMask extension, responsive 1080p / mobile display.", bullet_style))

    # ==================================================================
    # 4. UML DIAGRAMS
    # ==================================================================
    story.append(PageBreak())
    story.append(Paragraph("4.0 UML DIAGRAMS", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.8, color=c_accent, spaceBefore=2, spaceAfter=8))

    story.append(Paragraph("4.1 UML Use Case Diagram", h2_style))
    story.append(Paragraph(
        "The Use Case Diagram defines the interactions between human actors (DeFi Trader, Security Analyst, System Administrator) "
        "and external blockchain system actors (Ethereum Mempool, Flashbots Relay) within the MEV Shield boundary.",
        body_style
    ))
    
    # Embed Use Case Diagram Image
    uc_img_path = os.path.abspath("report_diagrams/use_case_diagram.png")
    if os.path.exists(uc_img_path):
        story.append(Image(uc_img_path, width=470, height=310))
        story.append(Paragraph("<b>Figure 4.1: UML Use Case Diagram — MEV Shield Platform</b>", caption_style))
    story.append(Spacer(1, 8))

    story.append(Paragraph(
        "<b>Use Case Specifications:</b><br/>"
        "• <b>DeFi Trader:</b> Primary user who monitors risk scores, configures dynamic slippage, sets up Flashbots Protect with 1-click, models sandwich attacks in the simulator, and tracks market indicators.<br/>"
        "• <b>Security Analyst:</b> Specialized researcher inspecting flagged sandwich attacks, analyzing searcher bot addresses, and monitoring threat heatmaps.<br/>"
        "• <b>System Administrator:</b> Manages ingestion health, configures alert thresholds, and oversees RPC quota.<br/>"
        "• <b>External System Actors:</b> Ethereum Mempool (feeds pending transactions) and Flashbots Relay (receives private bundles).",
        body_style
    ))

    # Activity Diagram
    story.append(PageBreak())
    story.append(Paragraph("4.2 UML Activity Diagram", h2_style))
    story.append(Paragraph(
        "The Activity Diagram models the operational control flow: from unconfirmed transaction ingestion and calldata ABI decoding, "
        "through parallel heuristic attack evaluation, composite risk scoring, threshold decision branching, and private Flashbots routing.",
        body_style
    ))

    act_img_path = os.path.abspath("report_diagrams/activity_diagram.png")
    if os.path.exists(act_img_path):
        story.append(Image(act_img_path, width=450, height=380))
        story.append(Paragraph("<b>Figure 4.2: UML Activity Diagram — Real-Time Detection & Mitigation Flow</b>", caption_style))
    story.append(Spacer(1, 8))

    story.append(Paragraph(
        "<b>Activity Control Flow Analysis:</b><br/>"
        "1. Ingestion of raw pending transactions via Alchemy WSS with automated polling fallback.<br/>"
        "2. Bytecode calldata decoding identifies target router smart contracts (Uniswap V2/V3, 1inch).<br/>"
        "3. <b>Parallel Fork:</b> Evaluates Front-running gas outbids, Sandwich sequence matching, and Back-running tail swaps simultaneously.<br/>"
        "4. <b>Join Bar:</b> Re-converges threads to compute the Composite Risk Score (0–100%) and safe slippage bounds.<br/>"
        "5. <b>Decision Branch 1:</b> If Risk > 50%, triggers real-time WebSocket event dispatch and email alerts.<br/>"
        "6. <b>Decision Branch 2:</b> If routed via Flashbots Protect, transaction bypasses the public mempool directly to block builders (zero-revert, front-run proof); otherwise submitted to public mempool.",
        body_style
    ))

    # Swimlane Diagram
    story.append(PageBreak())
    story.append(Paragraph("4.3 UML Swimlane Diagram", h2_style))
    story.append(Paragraph(
        "The Swimlane Diagram partitions system responsibilities across four distinct architectural swimlanes: "
        "<b>User / Frontend Client</b>, <b>MEV Detection Engine</b>, <b>Public Ethereum Mempool</b>, and <b>Flashbots Builder Network</b>.",
        body_style
    ))

    swm_img_path = os.path.abspath("report_diagrams/swimlane_diagram.png")
    if os.path.exists(swm_img_path):
        story.append(Image(swm_img_path, width=470, height=315))
        story.append(Paragraph("<b>Figure 4.3: UML Swimlane Diagram — Cross-System Transaction Protection Lifecycle</b>", caption_style))
    story.append(Spacer(1, 8))

    story.append(Paragraph(
        "<b>Swimlane Interaction Walkthrough:</b><br/>"
        "1. <b>User / Client Lane:</b> Trader prepares a token swap on the React UI; receives real-time risk alerts and one-click Flashbots Protect configuration; signs private transaction bundle.<br/>"
        "2. <b>Public Mempool Lane:</b> Public transactions are broadcast across P2P nodes and consumed via Alchemy WSS.<br/>"
        "3. <b>MEV Detection Middleware Lane:</b> Ingests pending transactions, decodes calldata, calculates risk scores (e.g. 85% Critical), pushes warning to client UI, and simulates private bundle execution via `eth_callBundle`.<br/>"
        "4. <b>Flashbots Builder Lane:</b> Ingests private bundle directly from client RPC, packages it into a block without public mempool disclosure, and mines it on-chain with zero revert risk.",
        body_style
    ))

    # ==================================================================
    # 5. SOFTWARE / SYSTEM ARCHITECTURE
    # ==================================================================
    story.append(PageBreak())
    story.append(Paragraph("5.0 SOFTWARE / SYSTEM ARCHITECTURE", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.8, color=c_accent, spaceBefore=2, spaceAfter=8))

    story.append(Paragraph("5.1 High-Level Architecture Overview", h2_style))
    story.append(Paragraph(
        "MEV Shield is organized into a modular, 5-layer decoupled architecture engineered for high throughput, sub-100ms latency, "
        "and zero-custody security. The diagram below illustrates the structural layering and component interactions.",
        body_style
    ))

    arch_img_path = os.path.abspath("report_diagrams/system_architecture_diagram.png")
    if os.path.exists(arch_img_path):
        story.append(Image(arch_img_path, width=470, height=315))
        story.append(Paragraph("<b>Figure 5.1: High-Level System Architecture Diagram — MEV Shield</b>", caption_style))
    story.append(Spacer(1, 8))

    story.append(Paragraph("5.2 Layered Architecture Breakdown", h2_style))
    story.append(Paragraph(
        "• <b>Layer 1: Presentation & User Interface (Port 3000):</b> React 18 single-page application styled with Tailwind CSS. "
        "Houses the Executive Dashboard (`Dashboard.tsx`), Live Attack Stream (`AttackDetector.tsx`), Mempool Monitor (`MempoolMonitor.tsx`), "
        "Market Intelligence Hub (`CryptoMarketTrends.js`), MEV Simulator (`Simulator.js`), and MetaMask Web3 Connector (`MetaMaskButton.js`).<br/>"
        "• <b>Layer 2: Application Routing & Real-Time Gateway (Port 3001):</b> Express.js REST API router exposing `/api/health`, `/api/attacks`, "
        "`/api/stats`, `/api/crypto/*`, and `/api/flashbots/*`. Features a WebSocket broadcaster (`ws`) pushing low-latency events to browsers.<br/>"
        "• <b>Layer 3: Analytics, Threat Classification & Simulation Services:</b> Core algorithmic engine (`MEVDetector`) executing sandwich "
        "detection, gas outbid tracking, composite risk scoring (0–100%), dynamic slippage calibration, and email/push alerting.<br/>"
        "• <b>Layer 4: Ingestion, Decoding & Local State Cache:</b> `AlchemyMempoolService` maintaining persistent WSS subscriptions with "
        "2000ms polling fallbacks, ABI bytecode decoder for Uniswap V2/V3 and 1inch, and an in-memory ring buffer (latest 1,000 transactions).<br/>"
        "• <b>Layer 5: External Blockchain Networks & Specialized APIs:</b> Ethereum Mainnet/Sepolia nodes via Alchemy, Flashbots Protect RPC "
        "(`https://rpc.flashbots.net`), CoinMarketCap Pro API, CoinGecko API, and Alternative.me Fear & Greed Index.",
        body_style
    ))

    # ==================================================================
    # 6. CONCLUSION
    # ==================================================================
    story.append(PageBreak())
    story.append(Paragraph("6.0 CONCLUSION", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.8, color=c_accent, spaceBefore=2, spaceAfter=8))

    story.append(Paragraph("6.1 Summary of Proposed System & Design Prepared", h2_style))
    story.append(Paragraph(
        "This project documentation delivers the comprehensive software engineering design for <b>MEV Shield</b>: a real-time "
        "blockchain mempool attack detection and mitigation platform. By combining high-frequency pending transaction ingestion, "
        "algorithmic heuristics (sandwich attacks, front-running, back-running), quantitative risk scoring, dynamic slippage calibration, "
        "and seamless private routing via Flashbots Protect, the platform eliminates information asymmetry and shields decentralized "
        "exchange traders from predatory financial extraction. The requirements adhere strictly to IEEE Std 830 and ISO 29148 standards, "
        "and all functional workflows are verified through rigorous UML Use Case, Activity, and Swimlane diagrams.",
        body_style
    ))

    story.append(Paragraph("6.2 Key Strengths of the Design", h2_style))
    story.append(Paragraph("1. <b>Pre-Execution Threat Intelligence:</b> Analyzes transactions during the 12-second mempool staging window before block mining, unlike retrospective block explorers.", bullet_style))
    story.append(Paragraph("2. <b>Zero-Custody Cryptographic Security:</b> Private keys never leave the client's MetaMask browser extension, eliminating custodial and regulatory risks.", bullet_style))
    story.append(Paragraph("3. <b>Dual-Mode High Availability:</b> Automated fallback between WebSocket streams and HTTP polling loops guarantees uninterrupted service during network anomalies.", bullet_style))
    story.append(Paragraph("4. <b>Actionable Mitigation:</b> Directly solves user vulnerabilities with 1-click Flashbots Protect RPC setup, eliminating 100% of front-running exposure and reverted gas fees.", bullet_style))

    story.append(Paragraph("6.3 Future Scope & System Enhancements", h2_style))
    story.append(Paragraph("• <b>Layer 2 Network Expansion:</b> Extend real-time mempool inspection to high-throughput rollups including Arbitrum, Optimism, Base, and Polygon.", bullet_style))
    story.append(Paragraph("• <b>Deep Learning Threat Classification:</b> Incorporate offline-trained neural networks and XGBoost models (`deepLearningModel.ts`) for cross-DEX arbitrage detection.", bullet_style))
    story.append(Paragraph("• <b>Programmable MEV-Share Integration:</b> Enable searcher back-running rebates, allowing users to earn yield from harmless arbitrageurs.", bullet_style))
    story.append(Spacer(1, 15))

    # Formal Academic Sign-off Box
    signoff_data = [
        [Paragraph("<b>Submitted By:</b> Student / Engineering Project Team", table_cell_bold),
         Paragraph("<b>Evaluated By:</b> Course Instructor / Department Faculty", table_cell_bold)],
        [Paragraph("<b>Institution:</b> Presidency University, Bengaluru", table_cell),
         Paragraph("<b>Course:</b> CSS2271 Software Design and Development", table_cell)],
        [Paragraph("<b>Assessment:</b> CA3 - Mini Project (Design Phase)", table_cell),
         Paragraph("<b>Submission Date:</b> 15 November 2026", table_cell)]
    ]
    signoff_tbl = Table(signoff_data, colWidths=[252.6, 252.6])
    signoff_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F1F5F9")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#94A3B8")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(signoff_tbl)

    # ------------------------------------------------------------------
    # BUILD PDF
    # ------------------------------------------------------------------
    print(f"Compiling CA3 Academic Report PDF to: {pdf_path}")
    doc.build(story, canvasmaker=AcademicNumberedCanvas)
    print("Academic Report PDF compilation complete!")
    if os.path.exists(pdf_path):
        size = os.path.getsize(pdf_path)
        print(f"Verified PDF: {pdf_path} ({size:,} bytes)")
        return pdf_path
    else:
        raise FileNotFoundError(f"PDF generation failed, {pdf_path} not found.")

if __name__ == "__main__":
    out_file = sys.argv[1] if len(sys.argv) > 1 else "CA3_Project_Design_Report_MEV_Detector.pdf"
    build_ca3_report_pdf(out_file)

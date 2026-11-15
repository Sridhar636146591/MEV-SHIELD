"""
MEV Shield & Real-Time Blockchain Mempool Attack Detection System
Software Requirements Specification (SRS) PDF Generator
Generates a publication-grade, professional IEEE 830 / ISO 29148 compliant PDF.
"""

import sys
import os
import reportlab.rl_config
reportlab.rl_config.pageCompression = 0
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

# ----------------------------------------------------------------------
# Two-Pass Canvas for Dynamic Total Page Numbering & Running Decorators
# ----------------------------------------------------------------------
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
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
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, total_pages):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Running Header (Top)
        header_y = 841.89 - 36
        self.drawString(45, header_y, "MEV Shield & Detector — Software Requirements Specification (SRS) v1.0.0")
        self.drawRightString(595.27 - 45, header_y, "IEEE Std 830-1998 / ISO 29148")
        
        # Header Rule
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.6)
        self.line(45, header_y - 6, 595.27 - 45, header_y - 6)

        # Running Footer (Bottom)
        footer_y = 36
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.6)
        self.line(45, footer_y + 12, 595.27 - 45, footer_y + 12)
        
        self.drawString(45, footer_y, "CONFIDENTIAL — WEB3 SECURITY & MEMPOOL PROTECTION ARCHITECTURE")
        page_str = f"Page {self._pageNumber} of {total_pages}"
        self.drawRightString(595.27 - 45, footer_y, page_str)
        
        self.restoreState()


# ----------------------------------------------------------------------
# PDF Document Builder
# ----------------------------------------------------------------------
def build_srs_pdf(filename="MEV_Detector_SRS_Document.pdf"):
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
    
    # Custom Palette
    c_primary = colors.HexColor("#0F172A")    # Deep Navy
    c_secondary = colors.HexColor("#1E293B")  # Slate Dark
    c_accent = colors.HexColor("#0284C7")     # Ocean Blue
    c_accent_dark = colors.HexColor("#0369A1")# Navy Accent
    c_body = colors.HexColor("#334155")       # Dark Slate Body
    c_light_bg = colors.HexColor("#F8FAFC")   # Off-white / light slate
    c_border = colors.HexColor("#E2E8F0")     # Light border
    c_success = colors.HexColor("#059669")    # Emerald Green
    c_warning = colors.HexColor("#D97706")    # Amber
    c_danger = colors.HexColor("#DC2626")     # Crimson Red

    # Custom Paragraph Styles
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=c_primary,
        alignment=0,
        spaceAfter=8
    )
    
    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=c_accent_dark,
        alignment=0,
        spaceAfter=15
    )

    h1_style = ParagraphStyle(
        'CustomH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        textColor=c_primary,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'CustomH2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=c_accent_dark,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    h3_style = ParagraphStyle(
        'CustomH3',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13,
        textColor=c_secondary,
        spaceBefore=7,
        spaceAfter=3,
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

    body_bold = ParagraphStyle(
        'CustomBodyBold',
        parent=body_style,
        fontName='Helvetica-Bold'
    )

    bullet_style = ParagraphStyle(
        'CustomBullet',
        parent=body_style,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=3
    )

    callout_style = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#1E293B")
    )

    code_style = ParagraphStyle(
        'CodeStyle',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7,
        leading=9.2,
        textColor=colors.HexColor("#0F172A")
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

    story = []

    # ------------------------------------------------------------------
    # HELPER FUNCTIONS
    # ------------------------------------------------------------------
    def make_callout(text, title="NOTE / ARCHITECTURAL DIRECTIVE", bg_color="#EFF6FF", border_color="#3B82F6"):
        p_title = Paragraph(f"<b>{title}</b>", ParagraphStyle('CalloutT', parent=body_style, fontName='Helvetica-Bold', textColor=colors.HexColor(border_color), fontSize=8.5, leading=11))
        p_body = Paragraph(text, callout_style)
        tbl = Table([[p_title], [p_body]], colWidths=[505.27])
        tbl.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor(bg_color)),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor(border_color)),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ]))
        return tbl

    def make_table(headers, rows, col_widths):
        data = [[Paragraph(h, table_header) for h in headers]]
        for row in rows:
            formatted_row = []
            for idx, cell in enumerate(row):
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
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('LEFTPADDING', (0,0), (-1,-1), 5),
            ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ]))
        return t

    # ------------------------------------------------------------------
    # COVER PAGE
    # ------------------------------------------------------------------
    story.append(Spacer(1, 15))
    
    # Decorative Accent Bar
    top_bar = Table([[""]], colWidths=[505.27], rowHeights=[6])
    top_bar.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_accent),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(top_bar)
    story.append(Spacer(1, 20))

    # Document Badge
    badge_data = [[
        Paragraph("<font color='#0284C7'><b>IEEE Std 830-1998</b></font> &nbsp;|&nbsp; "
                  "<font color='#059669'><b>ISO/IEC/IEEE 29148:2018</b></font> &nbsp;|&nbsp; "
                  "<font color='#E11D48'><b>SECURITY SPECIFICATION</b></font>", 
                  ParagraphStyle('BadgeStyle', parent=body_style, fontSize=8, leading=10, textColor=c_secondary))
    ]]
    badge_tbl = Table(badge_data, colWidths=[505.27])
    badge_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F1F5F9")),
        ('BOX', (0,0), (-1,-1), 0.8, colors.HexColor("#CBD5E1")),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(badge_tbl)
    story.append(Spacer(1, 15))

    story.append(Paragraph("SOFTWARE REQUIREMENTS SPECIFICATION (SRS)", title_style))
    story.append(Paragraph("MEV Shield & Real-Time Blockchain Mempool Attack Detection System", subtitle_style))
    story.append(Paragraph(
        "A Production-Grade Formal Specification for Algorithmic MEV Detection, High-Frequency Mempool Ingestion, "
        "Dynamic Slippage Risk Modeling, Flashbots Private Relays, and Real-Time Web3 Analytics.",
        body_style
    ))
    story.append(Spacer(1, 15))

    # Metadata Grid
    meta_data = [
        [Paragraph("<b>Document Identifier:</b>", table_cell_bold), Paragraph("SRS-MEV-2026-V1.0", table_cell),
         Paragraph("<b>Date of Release:</b>", table_cell_bold), Paragraph("November 2026", table_cell)],
        [Paragraph("<b>System Version:</b>", table_cell_bold), Paragraph("1.0.0 (Production Architecture)", table_cell),
         Paragraph("<b>Target Environment:</b>", table_cell_bold), Paragraph("Ethereum Mainnet & Sepolia", table_cell)],
        [Paragraph("<b>Backend Architecture:</b>", table_cell_bold), Paragraph("Node.js 20+ / Express / TypeScript / ws", table_cell),
         Paragraph("<b>Client Architecture:</b>", table_cell_bold), Paragraph("React 18 / Tailwind CSS / Recharts", table_cell)],
        [Paragraph("<b>Private Relay Provider:</b>", table_cell_bold), Paragraph("Flashbots Protect RPC / Relays", table_cell),
         Paragraph("<b>RPC Node Infrastructure:</b>", table_cell_bold), Paragraph("Alchemy WSS & JSON-RPC v2", table_cell)],
        [Paragraph("<b>Approval Status:</b>", table_cell_bold), Paragraph("<font color='#059669'><b>APPROVED / PRODUCTION</b></font>", table_cell),
         Paragraph("<b>Security Classification:</b>", table_cell_bold), Paragraph("Enterprise Web3 Infrastructure", table_cell)]
    ]
    meta_table = Table(meta_data, colWidths=[120, 132, 120, 133])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_light_bg),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 15))

    # Executive Summary Card
    story.append(make_callout(
        "<b>EXECUTIVE MANDATE:</b> Decentralized Finance (DeFi) traders lose hundreds of millions of dollars annually to "
        "predatory MEV (Maximal Extractable Value) searchers executing sandwich attacks, front-running, and liquidator sniping "
        "in the public mempool. This document formalizes the complete technical requirements for the MEV Detector platform: "
        "a zero-custody, sub-100ms real-time monitoring and defensive routing suite designed to guarantee price execution "
        "fairness and transaction privacy across EVM blockchains.",
        title="EXECUTIVE SUMMARY & SYSTEM MANDATE",
        bg_color="#F8FAFC",
        border_color="#0284C7"
    ))
    story.append(Spacer(1, 15))

    # Document Control Table
    story.append(Paragraph("<b>Document Revision History</b>", h3_style))
    rev_headers = ["Revision", "Release Date", "Primary Author", "Summary of Scope & Changes"]
    rev_rows = [
        ["v0.1.0", "Oct 15, 2026", "Web3 Security Team", "Initial draft of mempool ingestion and sandwich attack heuristics."],
        ["v0.8.0", "Nov 02, 2026", "DeFi Infrastructure Team", "Added Flashbots Protect RPC specification, dynamic gas tiers, and RSI/MACD metrics."],
        ["v1.0.0", "Nov 12, 2026", "Core Protocol Architecture", "Approved production baseline. Full IEEE 830 compliance, API schemas, and test matrix."]
    ]
    story.append(make_table(rev_headers, rev_rows, [45, 65, 110, 285.27]))

    story.append(PageBreak())

    # ------------------------------------------------------------------
    # TABLE OF CONTENTS / ROADMAP
    # ------------------------------------------------------------------
    story.append(Paragraph("TABLE OF CONTENTS", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_accent, spaceBefore=2, spaceAfter=10))

    toc_data = [
        ["1.0", "INTRODUCTION", "Purpose, Scope, RFC 2119 Conventions, Target Audience, Glossary", "Page 2"],
        ["2.0", "OVERALL SYSTEM DESCRIPTION", "Product Perspective, System Topology, User Classes, Tech Stack, Constraints", "Page 3"],
        ["3.0", "EXTERNAL INTERFACE REQUIREMENTS", "User Interfaces (UI-01 to UI-08), Hardware, Software & Protocols", "Page 4"],
        ["4.0", "SYSTEM FEATURES & FUNCTIONAL REQS", "Mempool Ingestion, Attack Detection Heuristics, Risk Scoring, REST API Catalog", "Page 5"],
        ["5.0", "NON-FUNCTIONAL REQUIREMENTS (NFRS)", "Performance Benchmarks, Zero-Custody Security, Fault Tolerance, Scalability", "Page 7"],
        ["6.0", "VERIFICATION & ACCEPTANCE MATRIX", "Testing Methodology, Test Harnesses, Requirements Traceability Matrix (RTM)", "Page 7"],
        ["7.0", "APPENDICES & ARCHITECTURAL SCHEMAS", "Appendix A: TypeScript Data Models | Appendix B: API Error Catalog | Sign-Off", "Page 8"]
    ]
    toc_tbl = Table(
        [[Paragraph(f"<b>{row[0]}</b>", table_cell_bold), Paragraph(f"<b>{row[1]}</b>", table_cell_bold), Paragraph(row[2], table_cell), Paragraph(f"<b>{row[3]}</b>", table_cell_bold)] for row in toc_data],
        colWidths=[30, 165, 260.27, 50]
    )
    toc_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_light_bg),
        ('GRID', (0,0), (-1,-1), 0.5, c_border),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(toc_tbl)
    story.append(Spacer(1, 15))

    # ------------------------------------------------------------------
    # SECTION 1: INTRODUCTION
    # ------------------------------------------------------------------
    story.append(Paragraph("1.0 INTRODUCTION", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.8, color=c_accent, spaceBefore=2, spaceAfter=8))

    story.append(Paragraph("1.1 Purpose", h2_style))
    story.append(Paragraph(
        "This Software Requirements Specification (SRS) establishes the authoritative technical foundation for the "
        "<b>MEV Shield & Real-Time Blockchain Mempool Attack Detection System</b> (Version 1.0.0). It defines functional "
        "algorithms, external interfaces, performance thresholds, and security parameters necessary to monitor unconfirmed "
        "EVM transactions, quantify risk, and protect decentralized exchange traders against malicious MEV extraction.",
        body_style
    ))

    story.append(Paragraph("1.2 Scope of the System", h2_style))
    story.append(Paragraph(
        "The system functions as a high-throughput, low-latency analytical middleware and responsive single-page web application. "
        "Its boundary encompasses: (1) Ingestion of unconfirmed Ethereum transactions via Alchemy WebSocket and polling fallbacks; "
        "(2) Real-time parsing of DEX swap call data; (3) Algorithmic classification of sandwich attacks, front-running, and back-running; "
        "(4) Dynamic slippage and risk score calculation; (5) Private transaction routing through the Flashbots Protect network; "
        "(6) Market momentum analytics (RSI, MACD, Fear & Greed Index); (7) Educational attack simulation; and (8) Multi-channel alerts.",
        body_style
    ))

    story.append(Paragraph("1.3 Document Conventions & RFC 2119", h2_style))
    story.append(Paragraph(
        "The keywords <b>MUST</b>, <b>MUST NOT</b>, <b>REQUIRED</b>, <b>SHALL</b>, <b>SHALL NOT</b>, <b>SHOULD</b>, and <b>RECOMMENDED</b> "
        "in this document adhere to IETF RFC 2119 definitions. Functional requirements are tagged with unique persistent keys: "
        "<code>[REQ-CAT-XXX]</code>, and non-functional requirements with <code>[NFR-CAT-XXX]</code>.",
        body_style
    ))

    story.append(Paragraph("1.4 Glossary & Acronyms", h2_style))
    glossary_headers = ["Term / Acronym", "Full Name", "Definition & Context in MEV Shield"]
    glossary_rows = [
        ["MEV", "Maximal Extractable Value", "Value extracted from block construction by reordering, injecting, or censoring transactions."],
        ["Mempool", "Memory Pool", "P2P staging area of unconfirmed transactions broadcast to Ethereum nodes prior to inclusion."],
        ["Sandwich Attack", "Three-Tx Exploit Pattern", "Searcher buys before victim to push price up, victim executes at worse price, searcher sells for profit."],
        ["Front-Running", "Priority Gas Bidding", "Submitting a matching or predatory transaction with higher gas fees to execute ahead of a victim."],
        ["Back-Running", "Immediate Tail Execution", "Submitting a transaction with identical or slightly lower gas to execute immediately after a victim trade."],
        ["Flashbots", "Flashbots Organization", "Research organisation providing private relays (Flashbots Protect) bypassing public mempools."],
        ["EIP-1559", "Ethereum Fee Market", "Specifies Base Fee (burned) and Priority Fee / Tip (paid to builder/validator)."],
        ["Slippage", "Execution Price Deviation", "Percentage variance between the expected swap price and final executed settlement price on an AMM."]
    ]
    story.append(make_table(glossary_headers, glossary_rows, [85, 110, 310.27]))
    story.append(Spacer(1, 10))

    # ------------------------------------------------------------------
    # SECTION 2: OVERALL SYSTEM DESCRIPTION
    # ------------------------------------------------------------------
    story.append(PageBreak())
    story.append(Paragraph("2.0 OVERALL SYSTEM DESCRIPTION", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.8, color=c_accent, spaceBefore=2, spaceAfter=8))

    story.append(Paragraph("2.1 Product Perspective & System Topology", h2_style))
    story.append(Paragraph(
        "MEV Shield is deployed as a dual-tier distributed system: an asynchronous event-driven backend service written in "
        "TypeScript running on Node.js, and an interactive modern client application built with React 18 and Tailwind CSS. "
        "The backend continuously consumes raw blockchain telemetry from Alchemy WSS endpoints, decodes bytecode, performs "
        "heuristic graph matching to detect MEV, and distributes processed state across WebSocket channels and REST APIs.",
        body_style
    ))

    # ASCII Architecture Diagram inside styled table
    arch_diagram = (
        "+-----------------------------------------------------------------------------------+\n"
        "|                             ETHEREUM BLOCKCHAIN NETWORK                           |\n"
        "|       [Public P2P Mempool]   <--->   [Alchemy WSS & RPC]   <--->   [Flashbots]    |\n"
        "+-----------------------------------------------------------------------------------+\n"
        "                                         |  JSON-RPC 2.0 / WSS (alchemy_pendingTransactions)\n"
        "                                         v\n"
        "+-----------------------------------------------------------------------------------+\n"
        "|                    BACKEND MONITORING & DETECTION ENGINE (PORT 3001)              |\n"
        "|  +---------------------------+  +---------------------------+  +---------------+  |\n"
        "|  | Alchemy Mempool Ingestion |  | MEV Detection Engine     |  | Market Trends |  |\n"
        "|  | - WSS Stream + Fallback   |  | - Sandwich Detector      |  | - CMC API     |  |\n"
        "|  | - ABI Method Decoder      |  | - Front/Back-Run Logic   |  | - CoinGecko   |  |\n"
        "|  | - Nonce & Gas Parser      |  | - Risk Score (0-100%)    |  | - Fear/Greed  |  |\n"
        "|  +---------------------------+  +---------------------------+  +---------------+  |\n"
        "|  +-----------------------------------------------------------------------------+  |\n"
        "|  | Express HTTP REST Controllers  |  WebSocket Broadcaster (ws://localhost:3001) |  |\n"
        "|  +-----------------------------------------------------------------------------+  |\n"
        "+-----------------------------------------------------------------------------------+\n"
        "                                         |  HTTP / JSON & Bidirectional WebSockets\n"
        "                                         v\n"
        "+-----------------------------------------------------------------------------------+\n"
        "|                        FRONTEND CLIENT DASHBOARD (PORT 3000)                      |\n"
        "|  [Executive Dashboard]  [Attack Detector Feed]  [Live Mempool]  [Market Trends]    |\n"
        "|  [MEV Attack Sandbox]   [Flashbots Setup Tool]  [Alert Center]  [Web3 Wallet Modal]|\n"
        "+-----------------------------------------------------------------------------------+"
    )
    story.append(Paragraph("<b>Figure 1: High-Level End-to-End System Topology</b>", h3_style))
    diag_tbl = Table([[Paragraph(f"<pre>{arch_diagram}</pre>", code_style)]], colWidths=[505.27])
    diag_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F8FAFC")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(diag_tbl)
    story.append(Spacer(1, 10))

    story.append(Paragraph("2.2 Technology Stack Specification", h2_style))
    tech_headers = ["Subsystem Tier", "Technology", "Version", "Functional Role in Architecture"]
    tech_rows = [
        ["Backend Runtime", "Node.js", "v20.x / v24.x", "Asynchronous JavaScript/TypeScript execution runtime."],
        ["HTTP Server", "Express.js", "4.19.x", "High-performance REST API routing and middleware management."],
        ["Type Safety", "TypeScript", "5.3.x", "Compile-time strict typing and shared domain interfaces."],
        ["Streaming Protocol", "ws (WebSocket)", "8.16.x", "Low-latency bidirectional push server for attacks & mempool updates."],
        ["Web3 Client Lib", "Ethers.js", "6.13.x", "Cryptographic hashing, ABI encoding/decoding, contract abstractions."],
        ["RPC Middleware", "Alchemy SDK", "3.1.x", "WebSocket mempool subscription and pending block queries."],
        ["Private Relay", "Flashbots Provider", "0.6.x", "Direct block builder bundle construction and simulation."],
        ["Frontend UI", "React", "18.2.x", "Declarative component-based reactive user interface."],
        ["Design System", "Tailwind CSS", "3.4.x", "Utility-first responsive dark-mode styling and layout engine."],
        ["Analytics Charts", "Recharts", "2.12.x", "Dynamic charting for attack trends, gas histograms, and RSI/MACD."],
        ["Market Data", "CoinMarketCap / CG", "REST v1/v3", "Crypto quotes, global metrics, 24h volume, price feeds."],
        ["Sentiment Engine", "Alternative.me", "REST v1", "Daily Crypto Fear & Greed Index score and historical tracking."]
    ]
    story.append(make_table(tech_headers, tech_rows, [85, 90, 60, 270.27]))
    story.append(Spacer(1, 10))

    story.append(Paragraph("2.3 User Classes & Operating Personas", h2_style))
    user_headers = ["User Class", "Skill Level", "Primary Objectives & System Usage"]
    user_rows = [
        ["Retail DeFi Trader", "Intermediate", "Wants to execute token swaps on DEXs without getting sandwiched; relies on Flashbots Protect and slippage advice."],
        ["High-Volume Arbitrageur", "Advanced", "Monitors mempool congestion, pending DEX swap sizes, and gas spikes to identify profitable routing paths."],
        ["Security Auditor / Analyst", "Expert", "Investigates searcher contract addresses, analyzes attack trends, and verifies threat mitigation effectiveness."],
        ["System Administrator", "Expert", "Maintains backend service health, manages RPC keys, monitors throughput, and oversees WebSocket client connections."]
    ]
    story.append(make_table(user_headers, user_rows, [110, 75, 320.27]))
    story.append(Spacer(1, 10))

    story.append(Paragraph("2.4 Design & Implementation Constraints", h2_style))
    story.append(Paragraph("• <b>Consensus Latency Constraint:</b> Ethereum slot intervals are 12 seconds. Attack detection and risk evaluation MUST complete within 150ms of mempool broadcast to provide actionable intelligence before block inclusion.", bullet_style))
    story.append(Paragraph("• <b>Zero-Custody Cryptographic Constraint:</b> Under no circumstances shall user private keys be transmitted to or stored on the backend. All transaction signing MUST occur within the client's EIP-1193 wallet (MetaMask).", bullet_style))
    story.append(Paragraph("• <b>Graceful Fallback Constraint:</b> External market APIs (CoinMarketCap, CoinGecko) and RPC providers enforce strict rate limits. The system MUST gracefully fall back to cached telemetry and mock datasets without throwing unhandled exceptions.", bullet_style))

    # ------------------------------------------------------------------
    # SECTION 3: EXTERNAL INTERFACE REQUIREMENTS
    # ------------------------------------------------------------------
    story.append(Spacer(1, 10))
    story.append(Paragraph("3.0 EXTERNAL INTERFACE REQUIREMENTS", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.8, color=c_accent, spaceBefore=2, spaceAfter=8))

    story.append(Paragraph("3.1 User Interfaces (UI Specifications)", h2_style))
    ui_headers = ["ID", "Screen Component", "Source Module", "Key Functional Elements"]
    ui_rows = [
        ["UI-01", "Executive Dashboard", "Dashboard.tsx", "KPI metric cards (attacks detected, USD saved, gas avg), live attack ticker, network selector."],
        ["UI-02", "Attack Detector Feed", "AttackDetector.tsx", "Real-time stream of classified attacks, filter controls (sandwich, front-run, risk score), tx inspector."],
        ["UI-03", "Live Mempool Explorer", "MempoolMonitor.tsx", "High-frequency table of pending transactions, gas price distribution bar chart, high-value swap badges."],
        ["UI-04", "Crypto Market Trends", "CryptoMarketTrends.js", "Fear & Greed gauge (0-100), top 10 coin prices with sparklines, RSI/MACD momentum charts, ETF flows."],
        ["UI-05", "MEV Attack Simulator", "Simulator.js", "Parametric sandwich model (trade size, slippage %, pool depth), step-by-step visual dissection, savings calc."],
        ["UI-06", "Flashbots Relay Setup", "FlashbotsProtection.js", "1-click MetaMask RPC configuration button, bundle builder, private route explanation."],
        ["UI-07", "Alerts & Notifications", "EmailAlerts.js", "Wallet address watch list, alert threshold sliders, email notification configuration."],
        ["UI-08", "Gamification & Leaderboard", "Rewards.js", "Protection badges (Guardian, Sentinel), user XP level, threat detection bounty board."]
    ]
    story.append(make_table(ui_headers, ui_rows, [35, 110, 110, 250.27]))
    story.append(Spacer(1, 10))

    story.append(Paragraph("3.2 Communication & Protocol Interfaces", h2_style))
    story.append(Paragraph(
        "The system communicates over three primary protocols: "
        "<b>(1) HTTP/REST (Port 3001)</b> utilizing JSON payloads for queries and historical statistics; "
        "<b>(2) WebSocket (Port 3001)</b> adhering to RFC 6455 for pushing real-time mempool events and threat broadcasts; "
        "and <b>(3) Ethereum JSON-RPC 2.0</b> over TLS (HTTPS/WSS) connecting to Alchemy nodes and the Flashbots Protect builder network.",
        body_style
    ))

    # ------------------------------------------------------------------
    # SECTION 4: SYSTEM FEATURES & FUNCTIONAL REQUIREMENTS
    # ------------------------------------------------------------------
    story.append(PageBreak())
    story.append(Paragraph("4.0 SYSTEM FEATURES & FUNCTIONAL REQUIREMENTS", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.8, color=c_accent, spaceBefore=2, spaceAfter=8))

    story.append(Paragraph("4.1 Mempool Ingestion Subsystem", h2_style))
    story.append(Paragraph(
        "<b>[REQ-ING-001] WebSocket Ingestion:</b> The backend service SHALL maintain a persistent WSS connection to "
        "Alchemy subscribing to <code>alchemy_pendingTransactions</code>. Transactions SHALL be ingested, validated, "
        "and normalized into structured <code>MempoolTransaction</code> objects within 100 milliseconds.",
        body_style
    ))
    story.append(Paragraph(
        "<b>[REQ-ING-002] Polling Fallback:</b> In the event of WebSocket disconnection, the service SHALL automatically "
        "engage an HTTP polling loop using <code>eth_getBlockByNumber('pending', true)</code> every 2000ms until "
        "socket re-establishment.",
        body_style
    ))
    story.append(Paragraph(
        "<b>[REQ-ING-003] ABI Bytecode Decoding:</b> The ingestion engine SHALL inspect transaction <code>input</code> bytecode "
        "and decode 4-byte function selectors for major DEX routers: Uniswap V2 (0x38ed1739), Uniswap V3 (0x414bf389, 0x5ae401dc), "
        "and 1inch Aggregation Router (0x12aa1464).",
        body_style
    ))

    story.append(Paragraph("4.2 Algorithmic MEV Detection Engine", h2_style))
    story.append(Paragraph(
        "The core detection engine (<code>MEVDetector</code>) inspects the pending transaction sequence and classifies "
        "exploitative patterns according to mathematical heuristics:",
        body_style
    ))

    det_headers = ["Attack Vector", "Detection Criteria & Mathematical Heuristic", "Severity"]
    det_rows = [
        [
            "Sandwich Attack\n[REQ-DET-001]",
            "Sequence (TxA, TxV, TxB) where:\n"
            "• target(TxA) == target(TxV) == target(TxB)\n"
            "• GasPrice(TxA) > GasPrice(TxV) and Nonce(TxA) < Nonce(TxV)\n"
            "• Nonce(TxB) > Nonce(TxV) executing inverse trade direction.",
            "Critical\n(80-100%)"
        ],
        [
            "Front-Running\n[REQ-DET-002]",
            "Two transactions (TxA, TxV) where:\n"
            "• target(TxA) == target(TxV)\n"
            "• GasPrice(TxA) >= 1.10 * GasPrice(TxV) (Priority fee outbid >= 10%)\n"
            "• Trade payload or target token pair matches.",
            "High\n(60-80%)"
        ],
        [
            "Back-Running\n[REQ-DET-003]",
            "Two transactions (TxV, TxA) where:\n"
            "• target(TxA) == target(TxV)\n"
            "• GasPrice(TxA) >= GasPrice(TxV)\n"
            "• timestamp(TxA) > timestamp(TxV) with delta <= 200ms.",
            "Medium\n(40-60%)"
        ],
        [
            "Generalized MEV\n[REQ-DET-004]",
            "Searcher transactions submitting complex multicalls or flash-loan arbitrage bundles to capture pool price imbalances.",
            "Medium\n(30-50%)"
        ]
    ]
    story.append(make_table(det_headers, det_rows, [95, 330.27, 80]))
    story.append(Spacer(1, 10))

    story.append(Paragraph("4.3 Composite Risk Scoring & Dynamic Slippage", h2_style))
    story.append(Paragraph(
        "<b>[REQ-RSK-001] Composite Risk Score Formula:</b> The system SHALL calculate an integer Risk Score $R \\in [0, 100]$: "
        "$$R = \\min\\left(100, S_{\\text{gas}} + S_{\\text{value}} + S_{\\text{congestion}} + S_{\\text{pattern}}\\right)$$ "
        "where: (1) $S_{\\text{gas}} \\in \\{0, 15, 30\\}$ based on gas multiplier relative to baseline; "
        "(2) $S_{\\text{value}} \\in \\{0, 15, 30\\}$ based on transaction ETH size ($>1$ ETH or $>10$ ETH); "
        "(3) $S_{\\text{congestion}} \\in \\{0, 10, 20\\}$ based on pending queue size ($>50$ or $>100$ txs); "
        "and (4) $S_{\\text{pattern}} = 20$ if an exploit heuristic matches.",
        body_style
    ))
    story.append(Paragraph(
        "<b>[REQ-RSK-002] Dynamic Slippage Calibration:</b> The system SHALL calculate the expected price impact in basis points "
        "using pool depth $(x, y)$ and recommend bounded slippage tolerances: "
        "$$\\text{PriceImpact (bps)} \\approx \\frac{\\Delta x}{x + \\Delta x} \\times 10,000$$ "
        "$$\\text{Slippage}_{\\text{rec}} = \\text{clamp}\\left(1.15 \\times \\text{PriceImpact} + 1.10 \\times \\text{Volatility} + \\text{Buffer}, 10, 5000\\right)$$ "
        "protecting users from setting dangerously wide tolerances that invite searcher sandwiches.",
        body_style
    ))

    # ------------------------------------------------------------------
    # REST API SPECIFICATIONS TABLE
    # ------------------------------------------------------------------
    story.append(PageBreak())
    story.append(Paragraph("4.4 Comprehensive REST API Specification", h2_style))
    story.append(Paragraph(
        "The Express backend exposes the following production REST endpoints on port 3001:",
        body_style
    ))

    api_headers = ["Method & Route", "Query / Body Params", "Success Response", "Description & Logic"]
    api_rows = [
        ["GET /api/health", "None", "200 OK (JSON)", "System uptime, timestamp, active service statuses."],
        ["GET /api/attacks", "limit, type, minRisk", "200 OK ([MEVAttack])", "Fetches recent detected attacks with optional filters."],
        ["GET /api/stats", "None", "200 OK (StatsObj)", "Aggregated metrics: attacks detected, USD saved, gas avg."],
        ["GET /api/mempool/transactions", "limit (def: 50)", "200 OK ([Tx])", "Returns latest pending transactions captured from mempool."],
        ["GET /api/crypto/market-trends", "None", "200 OK (TrendsObj)", "Synthesized crypto trends: global metrics, top coins, ETF flows."],
        ["GET /api/crypto/fear-greed", "None", "200 OK (FnGObj)", "Crypto Fear & Greed index score (0-100), label, and history."],
        ["GET /api/crypto/global-metrics", "None", "200 OK (MetricsObj)", "Total market cap, 24h volume, BTC/ETH dominance."],
        ["GET /api/crypto/top-coins", "limit (def: 10)", "200 OK ([Coin])", "Top cryptocurrency listings with live price, volume, 24h change."],
        ["GET /api/crypto/gas-fees", "None", "200 OK (GasObj)", "EIP-1559 gas fee tiers (Rapid, Fast, Standard, Slow) in Gwei."],
        ["POST /api/flashbots/bundle", "transactions[], block", "200 OK (BundleReceipt)", "Submits signed transaction bundle to Flashbots builder."],
        ["POST /api/simulate/sandwich", "tradeEth, slippage, pool", "200 OK (SimResult)", "Computes simulated sandwich impact, victim loss, profit."]
    ]
    story.append(make_table(api_headers, api_rows, [125, 95, 95, 190.27]))
    story.append(Spacer(1, 10))

    story.append(Paragraph("4.5 Flashbots Private Relay & Zero-Revert Guarantee", h2_style))
    story.append(Paragraph(
        "<b>[REQ-FLB-001] Private Routing:</b> The platform SHALL integrate Flashbots Protect RPC (<code>https://rpc.flashbots.net</code>). "
        "Transactions routed through this endpoint bypass the public P2P mempool, routing directly to trusted block builders. "
        "This completely eliminates transaction visibility to searchers, preventing front-running and sandwich attacks.",
        body_style
    ))
    story.append(Paragraph(
        "<b>[REQ-FLB-002] Zero Gas Waste on Revert:</b> Transactions submitted via Flashbots Protect that would otherwise "
        "revert (due to slippage limits or state changes) SHALL NOT be included in blocks, saving users 100% of failed gas fees.",
        body_style
    ))

    story.append(Paragraph("4.6 Crypto Market Intelligence & Momentum Indicators", h2_style))
    story.append(Paragraph(
        "<b>[REQ-MKT-001] Technical Momentum Engine:</b> The market intelligence subsystem SHALL calculate a 14-period "
        "Relative Strength Index (RSI) and Moving Average Convergence Divergence (MACD: 12-EMA, 26-EMA, 9-Signal) for major "
        "assets (BTC, ETH). Overbought ($RSI > 70$) and oversold ($RSI < 30$) conditions SHALL be visually surfaced.",
        body_style
    ))
    story.append(Paragraph(
        "<b>[REQ-MKT-002] Dynamic EIP-1559 Gas Recommendations:</b> The system SHALL evaluate pending block base fees and "
        "priority tips, outputting real-time recommendations across four urgency tiers: Rapid (<15s), Fast (<1m), "
        "Standard (<3m), and Slow (<5m).",
        body_style
    ))

    # ------------------------------------------------------------------
    # SECTION 5: NON-FUNCTIONAL REQUIREMENTS
    # ------------------------------------------------------------------
    story.append(PageBreak())
    story.append(Paragraph("5.0 NON-FUNCTIONAL REQUIREMENTS (NFRS)", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.8, color=c_accent, spaceBefore=2, spaceAfter=8))

    nfr_headers = ["ID", "Category", "Non-Functional Requirement Specification", "Verification Standard"]
    nfr_rows = [
        ["[NFR-PERF-001]", "Performance", "Mempool ingestion to normalized data transformation MUST complete in under 100ms.", "Timer benchmark harness"],
        ["[NFR-PERF-002]", "Performance", "Heuristic attack pattern classification MUST complete in under 150ms per transaction.", "Load test under peak queue"],
        ["[NFR-PERF-003]", "Throughput", "Backend MUST sustain continuous processing of 500+ tx/sec without dropping socket packets.", "Stress testing via mock replay"],
        ["[NFR-PERF-004]", "UI Rendering", "Frontend UI MUST maintain 60 FPS rendering under active WebSocket telemetry streaming.", "Chrome DevTools FPS profiling"],
        ["[NFR-SEC-001]", "Security", "Zero private key custody. Server MUST NOT request, ingest, or store user private keys or seed phrases.", "Static code audit & penetration test"],
        ["[NFR-SEC-002]", "Security", "All transport communications MUST enforce TLS 1.3 encryption (HTTPS and WSS).", "SSL Labs A+ audit standard"],
        ["[NFR-SEC-003]", "Security", "Backend REST endpoints MUST implement rate limiting and sanitize all user input against injection.", "OWASP Top 10 API Security compliance"],
        ["[NFR-REL-001]", "Reliability", "The monitoring service SHALL target 99.9% uptime (max 8.76 hours unscheduled downtime/yr).", "Continuous uptime monitor"],
        ["[NFR-REL-002]", "Fault Tolerance", "External API failures (CoinMarketCap/Alchemy) MUST gracefully degrade to cached/mock data.", "Fault injection test suite"],
        ["[NFR-REL-003]", "Resilience", "WebSocket client MUST implement automated exponential backoff reconnection (1s, 2s, 4s... 30s).", "Network disconnect simulation"]
    ]
    story.append(make_table(nfr_headers, nfr_rows, [70, 70, 270.27, 95]))
    story.append(Spacer(1, 15))

    # ------------------------------------------------------------------
    # SECTION 6: VERIFICATION & ACCEPTANCE MATRIX
    # ------------------------------------------------------------------
    story.append(Paragraph("6.0 VERIFICATION, VALIDATION & ACCEPTANCE CRITERIA", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.8, color=c_accent, spaceBefore=2, spaceAfter=8))

    story.append(Paragraph(
        "Verification ensures each requirement is rigorously validated through automated tests, simulation harnesses, "
        "and security audits before production release.",
        body_style
    ))

    rtm_headers = ["Req ID", "Description", "Verification Method", "Acceptance Criteria"]
    rtm_rows = [
        ["[REQ-ING-001]", "Mempool Stream", "Integration Test", "Captures pending tx from Alchemy WSS with latency < 100ms."],
        ["[REQ-DET-001]", "Sandwich Detection", "Historical Replay Test", "100% detection accuracy on 50 known historical sandwich exploits."],
        ["[REQ-DET-002]", "Front-Run Detection", "Unit Test", "Detects 10%+ gas outbids targeting identical router contracts."],
        ["[REQ-RSK-001]", "Risk Scoring", "Mathematical Verification", "Calculates score bounded in [0, 100] matching weighting formula."],
        ["[REQ-FLB-001]", "Flashbots Protect", "E2E MetaMask Test", "Adds Flashbots Protect chain via wallet_addEthereumChain."],
        ["[REQ-MKT-001]", "Crypto Trends", "API Integration Test", "Returns 10 top coins with CoinGecko fallback on CMC failure."],
        ["[REQ-SIM-001]", "MEV Simulator", "UI Functional Test", "Calculates victim loss, attacker profit, and private relay savings."],
        ["[REQ-ALT-001]", "WebSocket Alerts", "Socket Client Test", "Receives attack_detected within 50ms of classification."],
        ["[NFR-SEC-001]", "Zero Custody", "Security Code Audit", "Zero occurrences of private key variables or persistence logic."]
    ]
    story.append(make_table(rtm_headers, rtm_rows, [70, 110, 110, 215.27]))
    story.append(Spacer(1, 15))

    # ------------------------------------------------------------------
    # SECTION 7: APPENDICES
    # ------------------------------------------------------------------
    story.append(PageBreak())
    story.append(Paragraph("7.0 APPENDICES & DATA MODELS", h1_style))
    story.append(HRFlowable(width="100%", thickness=0.8, color=c_accent, spaceBefore=2, spaceAfter=8))

    story.append(Paragraph("Appendix A: Core TypeScript Interfaces (server/src/types.ts)", h2_style))
    ts_code = (
        "export interface MEVAttack {\n"
        "  hash: string;\n"
        "  attackType: 'sandwich' | 'front-run' | 'back-run' | 'other';\n"
        "  riskScore: number;             // Composite score 0 - 100%\n"
        "  slippageLoss: number;          // Estimated financial loss (ETH/USD)\n"
        "  gasPrice: string;              // Formatted in Gwei\n"
        "  timestamp: string;            // ISO 8601 string\n"
        "  attackerAddress?: string;      // Identified searcher address\n"
        "  victimAddress?: string;        // Targeted user address\n"
        "  transactionDetails?: {\n"
        "    from: string; to: string; value: string; gasLimit: string;\n"
        "  };\n"
        "  network?: string; source?: string; blockNumber?: number;\n"
        "}\n\n"
        "export interface RiskAssessment {\n"
        "  score: number;\n"
        "  level: 'low' | 'medium' | 'high' | 'critical';\n"
        "  factors: {\n"
        "    gasPrice: number; slippageRisk: number;\n"
        "    mempoolCongestion: number; attackDetected: number;\n"
        "  };\n"
        "}\n\n"
        "export interface MempoolTransaction {\n"
        "  hash: string; from: string; to: string; value: string;\n"
        "  gasPrice: string; gasLimit: string; nonce: number;\n"
        "  blockNumber: number; timestamp: number; input?: string;\n"
        "  maxFeePerGas?: string; maxPriorityFeePerGas?: string;\n"
        "}"
    )
    code_tbl = Table([[Paragraph(f"<pre>{ts_code}</pre>", code_style)]], colWidths=[505.27])
    code_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F8FAFC")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(code_tbl)
    story.append(Spacer(1, 15))

    story.append(Paragraph("Appendix B: Standard API Error Status Catalog", h2_style))
    err_headers = ["HTTP Status", "Error Code", "Condition & Root Cause", "Client Remediation Strategy"]
    err_rows = [
        ["400 Bad Request", "ERR_INVALID_PARAMS", "Missing or malformed query string or request body.", "Verify JSON payload adheres to API schema."],
        ["422 Unprocessable", "ERR_SIMULATION_FAILED", "Flashbots bundle simulation reverted during dry run.", "Check contract state, token allowance, or slippage."],
        ["429 Too Many Req", "ERR_RPC_RATE_LIMIT", "External RPC (Alchemy/CMC) rate threshold reached.", "Backend automatically throttles and serves cached data."],
        ["500 Internal Error", "ERR_INTERNAL_SERVER", "Unhandled server exception in detection pipeline.", "Review server logs; retry with exponential backoff."]
    ]
    story.append(make_table(err_headers, err_rows, [80, 110, 160, 155.27]))
    story.append(Spacer(1, 20))

    # Formal Sign-off Box
    signoff_data = [
        [Paragraph("<b>Prepared By:</b> Web3 Security Engineering Team", table_cell_bold),
         Paragraph("<b>Reviewed By:</b> Chief Information Security Officer (CISO)", table_cell_bold)],
        [Paragraph("<b>Status:</b> Production Baseline Approved", table_cell),
         Paragraph("<b>Effective Date:</b> November 12, 2026", table_cell)]
    ]
    signoff_tbl = Table(signoff_data, colWidths=[252.6, 252.6])
    signoff_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F1F5F9")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#94A3B8")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(signoff_tbl)

    # ------------------------------------------------------------------
    # BUILD PDF
    # ------------------------------------------------------------------
    print(f"Compiling SRS PDF document to: {pdf_path}")
    doc.build(story, canvasmaker=NumberedCanvas)
    print("SRS PDF compilation complete!")
    if os.path.exists(pdf_path):
        size_bytes = os.path.getsize(pdf_path)
        print(f"File verified: {pdf_path} ({size_bytes:,} bytes)")
        return pdf_path
    else:
        raise FileNotFoundError(f"PDF generation failed, {pdf_path} not found.")

if __name__ == "__main__":
    out_file = sys.argv[1] if len(sys.argv) > 1 else "MEV_Detector_SRS_Document.pdf"
    build_srs_pdf(out_file)

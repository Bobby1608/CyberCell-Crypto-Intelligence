import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from backend.services.attribution.vasp_engine import VASPDetectionResult

class LEADossierGenerator:
    @staticmethod
    def generate_dossier(
        case_id: str,
        ncrp_ack: str,
        suspect_address: str,
        risk_score: float,
        typologies: list[str],
        attribution: VASPDetectionResult,
        transactions: list[dict]
    ) -> io.BytesIO:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )
        story = []
        styles = getSampleStyleSheet()

        # Custom Styles
        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            fontSize=16,
            leading=20,
            textColor=colors.HexColor('#1e293b'),
            alignment=1
        )
        subtitle_style = ParagraphStyle(
            'SubTitleStyle',
            parent=styles['Normal'],
            fontSize=9,
            leading=12,
            textColor=colors.HexColor('#64748b'),
            alignment=1
        )
        section_style = ParagraphStyle(
            'SectionHeader',
            parent=styles['Heading2'],
            fontSize=11,
            leading=14,
            textColor=colors.HexColor('#0f172a'),
            spaceBefore=10,
            spaceAfter=4
        )
        body_style = ParagraphStyle(
            'Body',
            parent=styles['Normal'],
            fontSize=8,
            leading=10,
            textColor=colors.HexColor('#334155')
        )
        alert_style = ParagraphStyle(
            'Alert',
            parent=styles['Normal'],
            fontSize=8,
            leading=11,
            textColor=colors.HexColor('#991b1b')
        )

        # Header
        story.append(Paragraph("CYBER FRAUD INTELLIGENCE & FORENSIC ATTRIBUTION REPORT", title_style))
        story.append(Paragraph("STANDARD INVESTIGATION DOSSIER — SECTION 94 BNSS / SECTION 63 BSA COMPLIANT", subtitle_style))
        story.append(Spacer(1, 8))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0f172a'), spaceBefore=1, spaceAfter=8))

        # Metadata Table
        meta_data = [
            [Paragraph("<b>Case Reference ID:</b>", body_style), Paragraph(case_id, body_style), Paragraph("<b>Date & Time:</b>", body_style), Paragraph(datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"), body_style)],
            [Paragraph("<b>NCRP Ack Number:</b>", body_style), Paragraph(ncrp_ack, body_style), Paragraph("<b>Blockchain / Ecosystem:</b>", body_style), Paragraph("Ethereum / Sepolia", body_style)],
            [Paragraph("<b>Root Suspect Address:</b>", body_style), Paragraph(suspect_address, body_style), Paragraph("<b>Composite Risk Score:</b>", body_style), Paragraph(f"<b>{risk_score * 100:.1f} / 100</b>", alert_style)]
        ]
        meta_table = Table(meta_data, colWidths=[110, 160, 110, 160])
        meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        story.append(meta_table)
        story.append(Spacer(1, 10))

        # Section 1: Attribution & Freezing Target
        story.append(Paragraph("1. VASP / EXCHANGE ATTRIBUTION & LEGAL FREEZING TARGET", section_style))
        vasp_status = "IDENTIFIED" if attribution.is_vasp else "UNATTRIBUTED"
        target_vasp = attribution.vasp_name or "N/A"
        evidence_text = "<br/>".join([f"• {e}" for e in attribution.evidence]) if attribution.evidence else "• No direct exchange linkage detected within traversed hops."
        
        vasp_data = [
            [Paragraph("<b>Attribution Status:</b>", body_style), Paragraph(f"<b>{vasp_status}</b>", body_style), Paragraph("<b>Attributed VASP:</b>", body_style), Paragraph(f"<b>{target_vasp}</b>", body_style)],
            [Paragraph("<b>Confidence Level:</b>", body_style), Paragraph(f"{attribution.confidence_score * 100:.1f}%", body_style), Paragraph("<b>Entity Type:</b>", body_style), Paragraph(str(attribution.entity_type), body_style)],
            [Paragraph("<b>Target Deposit Wallet:</b>", body_style), Paragraph(attribution.attributed_address, body_style), Paragraph("<b>Nodal / Legal Contact:</b>", body_style), Paragraph(attribution.nodal_email or "N/A", body_style)],
            [Paragraph("<b>Forensic Evidence:</b>", body_style), Paragraph(evidence_text, body_style), "", ""]
        ]
        vasp_table = Table(vasp_data, colWidths=[110, 160, 110, 160])
        vasp_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f0fdf4' if attribution.is_vasp else '#fef2f2')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#86efac' if attribution.is_vasp else '#fca5a5')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#dcfce7' if attribution.is_vasp else '#fee2e2')),
            ('SPAN', (1, 3), (3, 3)),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        story.append(vasp_table)
        story.append(Spacer(1, 10))

        # Section 2: Laundering Typologies
        story.append(Paragraph("2. DETECTED LAUNDERING TYPOLOGIES & BEHAVIORAL PATTERNS", section_style))
        typo_text = "None detected." if not typologies else ", ".join(typologies)
        story.append(Paragraph(f"<b>Flagged Patterns:</b> {typo_text}", body_style))
        story.append(Spacer(1, 8))

        # Section 3: Transaction Trail Table
        story.append(Paragraph("3. CHRONOLOGICAL TRANSACTION AUDIT TRAIL (CRYPTOGRAPHIC PROOF)", section_style))
        tx_rows = [["Hop", "Tx Hash", "From", "To", "Amount", "Timestamp"]]
        for idx, tx in enumerate(transactions, start=1):
            tx_rows.append([
                str(idx),
                Paragraph(tx.get('tx_hash', '')[:14] + "...", body_style),
                Paragraph(tx.get('from', '')[:10] + "...", body_style),
                Paragraph(tx.get('to', '')[:10] + "...", body_style),
                f"{tx.get('amount', 0.0):.4f} {tx.get('asset', 'ETH')}",
                datetime.utcfromtimestamp(tx.get('timestamp', 0)).strftime("%H:%M:%S")
            ])
        
        tx_table = Table(tx_rows, colWidths=[25, 115, 100, 100, 100, 100])
        tx_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        story.append(tx_table)
        story.append(Spacer(1, 12))

        # Section 4: Recommended Section 94 BNSS Order Text
        story.append(Paragraph("4. DRAFT NOTICE UNDER SECTION 94 BNSS (ACTIONABLE DIRECTIVE)", section_style))
        directive_text = (
            f"<b>TO: Compliance Officer / Nodal Authority ({target_vasp})</b><br/>"
            f"1. You are hereby directed under Section 94 BNSS (erstwhile 91 CrPC) to immediately <b>FREEZE / DEBIT-FREEZE</b> "
            f"the wallet account associated with deposit address <b>{attribution.attributed_address}</b>.<br/>"
            f"2. Preserve and provide full KYC records, login IP audit logs, linked bank accounts, and withdrawal destination trails "
            f"associated with this account within 24 hours of receipt of this notice."
        )
        story.append(Paragraph(directive_text, body_style))

        doc.build(story)
        buffer.seek(0)
        return buffer

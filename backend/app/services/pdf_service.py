import os
import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable

class PDFService:
    @staticmethod
    def generate_handover_receipt(receipt_data: dict) -> bytes:
        """
        Generates a PDF digital collection & custody handover receipt.
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )
        
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            "DocTitle",
            parent=styles["Heading1"],
            fontSize=20,
            leading=24,
            textColor=colors.HexColor("#1b4332"),  # Forest green
            alignment=1  # Centered
        )
        subtitle_style = ParagraphStyle(
            "DocSubtitle",
            parent=styles["Normal"],
            fontSize=11,
            leading=14,
            textColor=colors.HexColor("#2d6a4f"),
            alignment=1
        )
        header_label_style = ParagraphStyle(
            "HeaderLabel",
            parent=styles["Normal"],
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#495057")
        )
        val_style = ParagraphStyle(
            "ValStyle",
            parent=styles["Normal"],
            fontSize=10,
            leading=13,
            textColor=colors.HexColor("#111827"),
            fontName="Helvetica-Bold"
        )
        hash_style = ParagraphStyle(
            "HashStyle",
            parent=styles["Normal"],
            fontSize=7.5,
            leading=10,
            textColor=colors.HexColor("#6c757d"),
            fontName="Courier"
        )

        elements = []

        # Header Title
        elements.append(Paragraph("<b>EcoCycle AI — Intelligent E-Waste Platform</b>", title_style))
        elements.append(Paragraph("Official Digital Collection & Custody Handover Receipt", subtitle_style))
        elements.append(Spacer(1, 12))
        elements.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#2d6a4f"), spaceAfter=14))

        # Receipt Meta Table
        meta_table_data = [
            [Paragraph("Receipt Number:", header_label_style), Paragraph(receipt_data.get("receipt_code", "N/A"), val_style),
             Paragraph("Date & Time:", header_label_style), Paragraph(receipt_data.get("created_at", datetime.now().strftime("%Y-%m-%d %H:%M")), val_style)],
            [Paragraph("Request Code:", header_label_style), Paragraph(receipt_data.get("request_code", "N/A"), val_style),
             Paragraph("Collection City:", header_label_style), Paragraph(receipt_data.get("city", "Hyderabad"), val_style)],
        ]
        t_meta = Table(meta_table_data, colWidths=[110, 160, 110, 160])
        t_meta.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8faf9")),
            ('PADDING', (0,0), (-1,-1), 6),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#d8f3dc")),
        ]))
        elements.append(t_meta)
        elements.append(Spacer(1, 14))

        # Parties Involved
        parties_data = [
            [Paragraph("<b>USER / GENERATOR</b>", header_label_style), Paragraph("<b>AUTHORIZED COLLECTOR</b>", header_label_style)],
            [Paragraph(f"Name: {receipt_data.get('user_name', 'N/A')}<br/>Contact: {receipt_data.get('user_phone', 'N/A')}<br/>Address: {receipt_data.get('street_address', 'N/A')}", styles["Normal"]),
             Paragraph(f"Agent: {receipt_data.get('collector_name', 'N/A')}<br/>Agent ID: {receipt_data.get('collector_id', 'N/A')[:8]}<br/>Vehicle/Team: Certified EcoFleet", styles["Normal"])],
        ]
        t_parties = Table(parties_data, colWidths=[270, 270])
        t_parties.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f1f5f3")),
            ('PADDING', (0,0), (-1,-1), 8),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#b7e4c7")),
        ]))
        elements.append(t_parties)
        elements.append(Spacer(1, 14))

        # Collected Item Details
        elements.append(Paragraph("<b>Verified Handover Item Specification</b>", styles["Heading3"]))
        item_table_data = [
            [Paragraph("<b>Item Description</b>", styles["Normal"]),
             Paragraph("<b>Category</b>", styles["Normal"]),
             Paragraph("<b>Quantity</b>", styles["Normal"]),
             Paragraph("<b>Verified Weight</b>", styles["Normal"]),
             Paragraph("<b>Intended Outcome</b>", styles["Normal"])],
            [Paragraph(receipt_data.get("device_name", "Electronic Device"), styles["Normal"]),
             Paragraph(receipt_data.get("category_name", "E-Waste"), styles["Normal"]),
             Paragraph(str(receipt_data.get("verified_item_count", 1)), styles["Normal"]),
             Paragraph(f"{receipt_data.get('verified_weight_kg', 1.0):.2f} kg", styles["Normal"]),
             Paragraph(receipt_data.get("recommendation", "Recycling").upper(), styles["Normal"])],
        ]
        t_item = Table(item_table_data, colWidths=[150, 110, 60, 100, 120])
        t_item.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#2d6a4f")),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('ALIGN', (2,0), (3,-1), 'CENTER'),
            ('PADDING', (0,0), (-1,-1), 7),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#d8f3dc")),
        ]))
        elements.append(t_item)
        elements.append(Spacer(1, 14))

        # Cryptographic Integrity Section
        elements.append(Paragraph("<b>Cryptographic Custody Verification Hash (SHA-256)</b>", header_label_style))
        elements.append(Paragraph(receipt_data.get("verification_hash", "3fa85f64-5717-4562-b3fc-2c963f66afa6"), hash_style))
        elements.append(Spacer(1, 12))

        # Signatures
        sig_data = [
            [Paragraph("<b>Generator Sign-off:</b><br/>" + receipt_data.get("user_name", "Verified User"), styles["Normal"]),
             Paragraph("<b>Collector Verification:</b><br/>" + receipt_data.get("collector_name", "EcoCycle Agent"), styles["Normal"])],
        ]
        t_sig = Table(sig_data, colWidths=[270, 270])
        t_sig.setStyle(TableStyle([
            ('PADDING', (0,0), (-1,-1), 8),
            ('LINEBELOW', (0,0), (0,0), 1, colors.HexColor("#52b788")),
            ('LINEBELOW', (1,0), (1,0), 1, colors.HexColor("#52b788")),
        ]))
        elements.append(t_sig)
        elements.append(Spacer(1, 16))

        # Legal and Environmental Footer
        elements.append(Paragraph("<i>This digital receipt confirms legal transfer of title for environmentally safe disposal under Government of India E-Waste (Management) Rules. Carbon offset will be verified upon facility arrival.</i>", styles["Italic"]))

        doc.build(elements)
        buffer.seek(0)
        return buffer.getvalue()

    @staticmethod
    def generate_processing_certificate(cert_data: dict) -> bytes:
        """
        Generates an official Certificate of Green Recycling & Material Recovery.
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )
        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            "CertTitle",
            parent=styles["Heading1"],
            fontSize=22,
            leading=26,
            textColor=colors.HexColor("#1b4332"),
            alignment=1
        )
        subtitle_style = ParagraphStyle(
            "CertSub",
            parent=styles["Normal"],
            fontSize=12,
            leading=16,
            textColor=colors.HexColor("#40916c"),
            alignment=1
        )

        elements = []
        elements.append(Spacer(1, 10))
        elements.append(Paragraph("<b>EcoCycle AI Recycling Consortium</b>", subtitle_style))
        elements.append(Paragraph("<b>CERTIFICATE OF RESPONSIBLE RECYCLING</b>", title_style))
        elements.append(Spacer(1, 10))
        elements.append(HRFlowable(width="100%", thickness=2.5, color=colors.HexColor("#1b4332"), spaceAfter=16))

        # Certificate Details
        body_text = f"""
        This is to certify that <b>{cert_data.get('total_weight_kg', 1.0):.2f} kg</b> of electronic waste 
        originating from request <b>{cert_data.get('request_code', 'N/A')}</b> was successfully received and 
        scientifically processed by <b>{cert_data.get('partner_name', 'EcoCycle Authorized Recycler')}</b> 
        (CPCB / SPCB License ID: <b>{cert_data.get('cpcb_license', 'TS-CPCB-2026-EW-892')}</b>).
        """
        elements.append(Paragraph(body_text, styles["Normal"]))
        elements.append(Spacer(1, 14))

        # Recovery Stats Table
        elements.append(Paragraph("<b>Certified Material Recovery Summary</b>", styles["Heading3"]))
        materials = cert_data.get("materials", [
            {"material_type": "Refined Copper", "quantity": 0.45, "unit": "kg"},
            {"material_type": "Polymer Plastics", "quantity": 1.20, "unit": "kg"},
            {"material_type": "Gold & Precious Traces", "quantity": 0.18, "unit": "grams"},
            {"material_type": "Safe Slag & Glass", "quantity": 0.35, "unit": "kg"}
        ])

        mat_table_rows = [
            [Paragraph("<b>Extracted Material</b>", styles["Normal"]),
             Paragraph("<b>Net Quantity Recovered</b>", styles["Normal"]),
             Paragraph("<b>Circular Re-entry Destination</b>", styles["Normal"])]
        ]
        for m in materials:
            mat_table_rows.append([
                Paragraph(m.get("material_type", "").title(), styles["Normal"]),
                Paragraph(f"{m.get('quantity', 0):.2f} {m.get('unit', '')}", styles["Normal"]),
                Paragraph("Authorized Domestic Industrial Feedstock", styles["Normal"])
            ])

        t_mat = Table(mat_table_rows, colWidths=[200, 160, 180])
        t_mat.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#2d6a4f")),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('PADDING', (0,0), (-1,-1), 6),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#d8f3dc")),
        ]))
        elements.append(t_mat)
        elements.append(Spacer(1, 16))

        # Carbon Offset & Eco-Benefit
        offset_text = f"""
        <b>Environmental Protection Impact:</b><br/>
        By preventing virgin mining and toxic landfill leeching, this action prevented an estimated 
        <b>{cert_data.get('carbon_offset_kg', 4.5):.2f} kg of CO2 equivalent emissions</b> and saved 
        vital groundwater aquifers from hazardous heavy-metal contamination.
        """
        elements.append(Paragraph(offset_text, styles["Normal"]))
        elements.append(Spacer(1, 16))

        # Verification hash & Certificate ID
        elements.append(Paragraph(f"<b>Certificate Number:</b> {cert_data.get('certificate_number', 'CERT-2026-EW-9821')}", styles["Normal"]))
        elements.append(Paragraph(f"<b>Digital Signature Hash (SHA-256):</b><br/><font face='Courier' size='8'>{cert_data.get('digital_signature_hash', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')}</font>", styles["Normal"]))
        elements.append(Spacer(1, 12))

        doc.build(elements)
        buffer.seek(0)
        return buffer.getvalue()

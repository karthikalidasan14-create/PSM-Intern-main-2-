from datetime import datetime
from io import BytesIO
from pathlib import Path

import qrcode
from reportlab.lib.colors import Color, HexColor
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas


def generate_qr_png(payload: str, dest_path: Path) -> Path:
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    image = qrcode.make(payload)
    image.save(dest_path)
    return dest_path


def generate_certificate_pdf(certificate, intern, internship, company, dest_path: Path, qr_path: Path) -> Path:
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    width, height = landscape(A4)
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=landscape(A4), pageCompression=0)

    navy = HexColor("#10264b")
    blue = HexColor("#245fcb")
    gold = HexColor("#c9a227")
    slate = HexColor("#445168")

    pdf.setFillColor(navy)
    pdf.rect(0, 0, width, height, fill=1, stroke=0)
    pdf.setFillColor(HexColor("#ffffff"))
    pdf.roundRect(28, 28, width - 56, height - 56, 12, fill=1, stroke=0)

    pdf.setStrokeColor(gold)
    pdf.setLineWidth(3)
    pdf.rect(42, 42, width - 84, height - 84)

    pdf.setFillColor(navy)
    pdf.setFont("Times-Bold", 18)
    company_name = company.company_name if company else "Problem Solving Mind"
    pdf.drawCentredString(width / 2, height - 88, company_name.upper())

    pdf.setFillColor(blue)
    pdf.setFont("Times-Italic", 13)
    pdf.drawCentredString(width / 2, height - 112, "Internship Completion Certificate")

    pdf.setFillColor(slate)
    pdf.setFont("Times-Roman", 12)
    pdf.drawCentredString(width / 2, height - 150, "This is to certify that")

    pdf.setFillColor(navy)
    pdf.setFont("Times-Bold", 28)
    pdf.drawCentredString(width / 2, height - 190, intern.full_name)

    pdf.setStrokeColor(gold)
    pdf.setLineWidth(1)
    pdf.line(width / 2 - 160, height - 200, width / 2 + 160, height - 200)

    duration = internship.duration_label if internship else "the internship period"
    domain = intern.domain
    body = (
        f"has successfully completed an internship in {domain} at {company_name} "
        f"during {duration}."
    )
    pdf.setFillColor(slate)
    pdf.setFont("Times-Roman", 13)
    pdf.drawCentredString(width / 2, height - 240, body)

    status_line = f"Certificate ID: {certificate.certificate_id}    Status: {certificate.status}"
    pdf.setFont("Times-Bold", 11)
    pdf.drawCentredString(width / 2, height - 270, status_line)

    issued = certificate.issued_at.strftime("%d %B %Y") if certificate.issued_at else datetime.utcnow().strftime("%d %B %Y")
    pdf.setFont("Times-Roman", 11)
    pdf.drawString(70, 90, f"Issued on: {issued}")
    pdf.drawString(70, 72, "Authorised by Problem Solving Mind")

    if qr_path.exists():
        pdf.drawImage(ImageReader(str(qr_path)), width - 170, 70, 90, 90, mask="auto")
        pdf.setFont("Times-Roman", 8)
        pdf.setFillColor(Color(0.3, 0.35, 0.4))
        pdf.drawCentredString(width - 125, 62, "Scan to verify")

    # If intern photo exists, draw framed photo on the certificate
    photo_path = getattr(intern, "photo_path", None)
    if photo_path:
        p = Path(photo_path)
        if p.exists():
            try:
                pw, ph = 75, 95
                px = width - 160
                py = height - 180
                # Decorative gold border
                pdf.setStrokeColor(gold)
                pdf.setLineWidth(2)
                pdf.rect(px - 2, py - 2, pw + 4, ph + 4, fill=0, stroke=1)
                pdf.drawImage(ImageReader(str(p)), px, py, pw, ph, preserveAspectRatio=True, mask="auto")
                pdf.setFont("Times-Bold", 8)
                pdf.setFillColor(navy)
                pdf.drawCentredString(px + pw / 2, py - 11, "VERIFIED INTERN")
            except Exception as e:
                print(f"Note: Could not draw photo on PDF: {e}")

    pdf.showPage()
    pdf.save()

    dest_path.write_bytes(buffer.getvalue())
    return dest_path

from datetime import datetime
from pathlib import Path

from flask import Blueprint, current_app, jsonify, request, send_file
from flask_jwt_extended import get_jwt

from extensions import db
from models import Certificate, CompanySettings, Intern
from services.audit import log_action
from services.certificate_service import generate_certificate_pdf, generate_qr_png
from utils import admin_required, get_intern_or_404

certificate_bp = Blueprint("certificates", __name__, url_prefix="/certificates")


def _unique_certificate_id(intern_id):
    stamp = datetime.utcnow().strftime("%Y%m%d")
    base = f"PSM-{intern_id}-{stamp}"
    candidate = base
    counter = 1
    while Certificate.query.filter_by(certificate_id=candidate).first():
        counter += 1
        candidate = f"{base}-{counter}"
    return candidate


def _issue_files(certificate, intern):
    frontend = current_app.config["FRONTEND_URL"].rstrip("/")
    payload = f"{frontend}/verify?id={certificate.certificate_id}"
    certificate.qr_payload = payload
    upload_root = Path(current_app.config["UPLOAD_FOLDER"])
    qr_path = upload_root / "qr" / f"{certificate.certificate_id}.png"
    pdf_path = upload_root / "certificates" / f"{certificate.certificate_id}.pdf"
    generate_qr_png(payload, qr_path)
    company = CompanySettings.query.first()
    generate_certificate_pdf(certificate, intern, intern.internship, company, pdf_path, qr_path)
    certificate.qr_image_path = str(qr_path)
    certificate.pdf_path = str(pdf_path)
    return certificate


@certificate_bp.get("")
@admin_required()
def list_certificates():
    records = Certificate.query.order_by(Certificate.created_at.desc()).all()
    return jsonify([item.to_dict() for item in records])


@certificate_bp.get("/<certificate_id>")
def get_certificate(certificate_id):
    certificate = Certificate.query.filter_by(certificate_id=certificate_id).first()
    if not certificate:
        return jsonify({"error": "Certificate not found."}), 404
    return jsonify(certificate.to_dict())


@certificate_bp.get("/<certificate_id>/pdf")
def download_pdf(certificate_id):
    certificate = Certificate.query.filter_by(certificate_id=certificate_id).first()
    if not certificate or not certificate.pdf_path:
        return jsonify({"error": "Certificate PDF not found."}), 404
    path = Path(certificate.pdf_path)
    if not path.exists():
        intern = certificate.intern
        _issue_files(certificate, intern)
        db.session.commit()
        path = Path(certificate.pdf_path)
    return send_file(path, as_attachment=True, download_name=f"{certificate.certificate_id}.pdf")


@certificate_bp.get("/<certificate_id>/qr")
def download_qr(certificate_id):
    certificate = Certificate.query.filter_by(certificate_id=certificate_id).first()
    if not certificate or not certificate.qr_image_path:
        return jsonify({"error": "QR code not found."}), 404
    path = Path(certificate.qr_image_path)
    if not path.exists():
        generate_qr_png(certificate.qr_payload, path)
    return send_file(path)


@certificate_bp.post("")
@admin_required()
def generate_certificate():
    data = request.get_json(silent=True) or {}
    intern = Intern.query.filter_by(intern_id=(data.get("intern_id") or "").strip()).first()
    if not intern:
        return jsonify({"error": "Intern not found."}), 404

    certificate = intern.certificate or Certificate(intern_pk=intern.id)
    certificate.certificate_id = (data.get("certificate_id") or "").strip() or _unique_certificate_id(
        intern.intern_id
    )
    if Certificate.query.filter(
        Certificate.certificate_id == certificate.certificate_id, Certificate.id != (certificate.id or 0)
    ).first():
        return jsonify({"error": "Certificate ID already exists."}), 409

    certificate.status = data.get("status") or "Pending"
    if data.get("expires_at"):
        certificate.expires_at = datetime.fromisoformat(data["expires_at"])
    _issue_files(certificate, intern)
    db.session.add(certificate)
    db.session.commit()
    log_action(get_jwt().get("email"), "generate_certificate", "Certificate", certificate.certificate_id)
    return jsonify(certificate.to_dict()), 201


@certificate_bp.post("/<certificate_id>/issue")
@admin_required()
def issue_certificate(certificate_id):
    certificate = Certificate.query.filter_by(certificate_id=certificate_id).first()
    if not certificate:
        return jsonify({"error": "Certificate not found."}), 404
    certificate.status = "Valid"
    certificate.issued_at = datetime.utcnow()
    _issue_files(certificate, certificate.intern)
    db.session.commit()
    log_action(get_jwt().get("email"), "issue_certificate", "Certificate", certificate.certificate_id)
    return jsonify(certificate.to_dict())


@certificate_bp.post("/<certificate_id>/revoke")
@admin_required()
def revoke_certificate(certificate_id):
    certificate = Certificate.query.filter_by(certificate_id=certificate_id).first()
    if not certificate:
        return jsonify({"error": "Certificate not found."}), 404
    data = request.get_json(silent=True) or {}
    reason = (data.get("reason") or "").strip()
    if not reason:
        return jsonify({"error": "A revocation reason is required."}), 400
    certificate.status = "Revoked"
    certificate.revocation_reason = reason
    db.session.commit()
    log_action(get_jwt().get("email"), "revoke_certificate", "Certificate", certificate.certificate_id, reason)
    return jsonify(certificate.to_dict())

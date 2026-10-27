from datetime import datetime

from flask import Blueprint, jsonify, request
from sqlalchemy import func

from extensions import db
from models import Certificate, CompanySettings, Intern

verification_bp = Blueprint("verification", __name__, url_prefix="/verify")


def _effective_status(certificate):
    if not certificate:
        return "Not Issued"
    if certificate.status == "Revoked":
        return "Revoked"
    if certificate.status == "Pending":
        return "Pending"
    if certificate.expires_at and certificate.expires_at < datetime.utcnow():
        return "Expired"
    return certificate.status


@verification_bp.get("")
def verify_certificate():
    raw_query = (request.args.get("certificate_id") or request.args.get("id") or "").strip()
    if not raw_query:
        return jsonify({"error": "certificate_id or id is required."}), 400

    certificate = Certificate.query.filter(func.lower(Certificate.certificate_id) == raw_query.lower()).first()
    intern = None

    if certificate:
        intern = certificate.intern
    else:
        intern = Intern.query.filter(func.lower(Intern.intern_id) == raw_query.lower()).first()
        if intern and intern.certificate:
            certificate = intern.certificate

    if not intern and not certificate:
        return jsonify({
            "valid": False,
            "status": "Not Found",
            "message": f"No certificate or intern profile found matching '{raw_query}'.",
            "certificate_id": raw_query,
        }), 404

    status = _effective_status(certificate) if certificate else "Not Issued"
    is_valid = status == "Valid"
    company = CompanySettings.query.first()

    # Prepare project data
    project_data = None
    if intern and intern.project:
        project_data = intern.project.to_dict()

    # Prepare mentor evaluation (only if published!)
    evaluation_data = None
    if intern and intern.evaluation and intern.evaluation.is_published:
        evaluation_data = intern.evaluation.to_dict(include_unpublished=False)

    intern_dict = intern.to_dict(public=True) if intern else {}
    cert_dict = certificate.to_dict() if certificate else None

    return jsonify({
        "valid": is_valid,
        "status": status,
        "certificate_id": certificate.certificate_id if certificate else None,
        "certificate": cert_dict,
        "intern": {
            "intern_id": intern.intern_id if intern else None,
            "full_name": intern.full_name if intern else None,
            "domain": intern.domain if intern else None,
            "photo_url": intern_dict.get("photo_url"),
            "organisation": intern.internship.organisation if intern and intern.internship else "Problem Solving Mind",
            "duration_label": intern.internship.duration_label if intern and intern.internship else None,
            "start_date": intern.internship.start_date.isoformat() if intern and intern.internship and intern.internship.start_date else None,
            "end_date": intern.internship.end_date.isoformat() if intern and intern.internship and intern.internship.end_date else None,
            "status": intern.internship.status if intern and intern.internship else None,
            "mentor": intern.mentor.to_dict() if intern and intern.mentor else None,
            "internship": intern.internship.to_dict() if intern and intern.internship else None,
        },
        "project": project_data,
        "evaluation": evaluation_data,
        "company": company.to_dict() if company else {
            "company_name": "Problem Solving Mind",
            "tagline": "Internship Certificate Verification Platform",
            "official_email": "hello@problemsolvingmind.org",
            "website": "https://problemsolvingmind.org",
        },
    })

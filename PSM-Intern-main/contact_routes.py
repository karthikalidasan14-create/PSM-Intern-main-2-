from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt

from extensions import db
from models import CompanySettings, Mentor
from services.audit import log_action
from utils import admin_only

contact_bp = Blueprint("contact", __name__, url_prefix="/contact")


@contact_bp.get("")
def get_contact():
    settings = CompanySettings.query.first()
    if not settings:
        return jsonify({"error": "Company information is not configured."}), 404
    mentors = Mentor.query.filter_by(is_active=True).all()
    return jsonify({**settings.to_dict(), "mentors": [item.to_dict() for item in mentors]})


@contact_bp.put("")
@admin_only()
def update_contact():
    data = request.get_json(silent=True) or {}
    settings = CompanySettings.query.first()
    if not settings:
        settings = CompanySettings(
            company_name="Problem Solving Mind",
            official_email="hello@problemsolvingmind.org",
        )
        db.session.add(settings)
    for field in ("company_name", "tagline", "official_email", "phone", "website", "address", "about"):
        if field in data:
            setattr(settings, field, data.get(field))
    db.session.commit()
    log_action(get_jwt().get("email"), "update_company", "CompanySettings", settings.id)
    return jsonify(settings.to_dict())

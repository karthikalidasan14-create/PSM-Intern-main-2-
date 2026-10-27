from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity

from extensions import db
from models import Admin, Certificate, Intern, Internship, Mentor, MentorEvaluation
from utils import admin_only, admin_required

admin_bp = Blueprint("admin", __name__, url_prefix="/admin")


@admin_bp.get("/dashboard")
@admin_required()
def dashboard():
    internships = Internship.query.all()
    certificates = Certificate.query.all()
    return jsonify(
        {
            "total_interns": Intern.query.count(),
            "active_interns": Intern.query.filter_by(is_active=True).count(),
            "completed_internships": sum(1 for item in internships if item.status == "Completed"),
            "ongoing_internships": sum(1 for item in internships if item.status == "Ongoing"),
            "incomplete_internships": sum(1 for item in internships if item.status == "Incomplete"),
            "certificates_issued": sum(1 for item in certificates if item.status == "Valid"),
            "pending_evaluations": (
                MentorEvaluation.query.filter_by(is_published=False).count()
                + Intern.query.outerjoin(MentorEvaluation).filter(MentorEvaluation.id.is_(None)).count()
            ),
            "revoked_certificates": sum(1 for item in certificates if item.status == "Revoked"),
            "mentors": Mentor.query.filter_by(is_active=True).count(),
        }
    )


@admin_bp.get("/profile")
@admin_required()
def profile():
    identity = int(get_jwt_identity())
    if get_jwt().get("role") == "mentor":
        mentor = Mentor.query.get(identity)
        return jsonify(mentor.to_dict() if mentor else {"error": "Profile not found."}), 404 if not mentor else 200
    admin = Admin.query.get(identity)
    if not admin:
        return jsonify({"error": "Profile not found."}), 404
    return jsonify(admin.to_dict())


@admin_bp.put("/profile")
@admin_only()
def update_profile():
    admin = Admin.query.get(int(get_jwt_identity()))
    if not admin:
        return jsonify({"error": "Admin not found."}), 404
    data = request.get_json(silent=True) or {}
    if data.get("name"):
        admin.name = data["name"].strip()
    if data.get("email"):
        admin.email = data["email"].strip().lower()
    db.session.commit()
    return jsonify(admin.to_dict())


@admin_bp.get("/mentors")
@admin_required()
def list_mentors():
    return jsonify([item.to_dict() for item in Mentor.query.order_by(Mentor.name).all()])

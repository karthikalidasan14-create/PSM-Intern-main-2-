from datetime import datetime
from pathlib import Path

from flask import Blueprint, jsonify, request, send_file
from flask_jwt_extended import get_jwt

from extensions import db
from models import Intern, Internship, Mentor
from services.audit import log_action
from utils import admin_required, get_intern_or_404, save_upload

intern_bp = Blueprint("interns", __name__, url_prefix="/interns")


def _parse_date(value, fallback=None):
    if not value:
        return fallback
    return datetime.strptime(value, "%Y-%m-%d").date()


def intern_payload(intern, include_private=False):
    data = intern.to_dict(public=not include_private)
    data["project"] = intern.project.to_dict() if intern.project else None
    evaluation = intern.evaluation
    if evaluation and (include_private or evaluation.is_published):
        data["evaluation"] = evaluation.to_dict(include_unpublished=include_private)
    else:
        data["evaluation"] = None
    cert = intern.certificate
    if cert:
        public_cert = cert.to_dict()
        if not include_private:
            public_cert.pop("revocation_reason", None)
        data["certificate"] = public_cert
    else:
        data["certificate"] = None
    return data


@intern_bp.get("")
def list_interns():
    include_private = False
    try:
        from flask_jwt_extended import verify_jwt_in_request

        verify_jwt_in_request(optional=True)
        claims = get_jwt()
        include_private = bool(claims) and claims.get("role") in ("admin", "mentor")
    except Exception:
        include_private = False

    query = Intern.query
    if not include_private:
        query = query.filter_by(is_active=True)
    search = (request.args.get("q") or "").strip()
    if search:
        like = f"%{search}%"
        query = query.filter(
            db.or_(
                Intern.full_name.ilike(like),
                Intern.intern_id.ilike(like),
                Intern.domain.ilike(like),
            )
        )
    records = query.order_by(Intern.created_at.desc()).all()
    return jsonify([intern_payload(item, include_private=include_private) for item in records])


@intern_bp.get("/<intern_id>")
def get_intern(intern_id):
    intern = get_intern_or_404(intern_id)
    if not intern or not intern.is_active:
        return jsonify({"error": "Intern not found."}), 404
    return jsonify(intern_payload(intern, include_private=False))


@intern_bp.get("/<intern_id>/photo")
def intern_photo(intern_id):
    from flask import current_app, redirect
    intern = get_intern_or_404(intern_id)
    if not intern or not intern.photo_path:
        return jsonify({"error": "Photo not found."}), 404
    if intern.photo_path.startswith("http://") or intern.photo_path.startswith("https://") or intern.photo_path.startswith("data:"):
        return redirect(intern.photo_path)
    path = Path(intern.photo_path)
    if not path.is_absolute():
        path = (Path(current_app.config["UPLOAD_FOLDER"]) / path).resolve()
    if not path.exists():
        fallback_p = Path(intern.photo_path).resolve()
        if fallback_p.exists():
            path = fallback_p
        else:
            return jsonify({"error": "Photo file missing."}), 404
    return send_file(str(path))


@intern_bp.get("/<intern_id>/qr")
def intern_qr(intern_id):
    from flask import current_app
    from services.certificate_service import generate_qr_png
    intern = get_intern_or_404(intern_id)
    if not intern:
        return jsonify({"error": "Intern not found."}), 404
    if intern.certificate and intern.certificate.qr_image_path:
        qp = Path(intern.certificate.qr_image_path)
        if qp.exists():
            return send_file(str(qp))
    frontend = current_app.config["FRONTEND_URL"].rstrip("/")
    cert_id = intern.certificate.certificate_id if intern.certificate else intern.intern_id
    payload = f"{frontend}/verify?id={cert_id}"
    qr_dir = Path(current_app.config["UPLOAD_FOLDER"]) / "qr"
    qr_dir.mkdir(parents=True, exist_ok=True)
    dest = qr_dir / f"{intern.intern_id}.png"
    generate_qr_png(payload, dest)
    return send_file(str(dest))


@intern_bp.get("/<intern_id>/id-card")
def get_id_card(intern_id):
    from models import CompanySettings
    intern = get_intern_or_404(intern_id)
    if not intern:
        return jsonify({"error": "Intern not found."}), 404
    company = CompanySettings.query.first()
    cert = intern.certificate
    qr_url = cert.to_dict().get("qr_url") if cert else f"/api/interns/{intern.intern_id}/qr"

    return jsonify({
        "intern_id": intern.intern_id,
        "full_name": intern.full_name,
        "domain": intern.domain,
        "email": intern.email,
        "photo_url": intern.to_dict().get("photo_url"),
        "duration_label": intern.internship.duration_label if intern.internship else "Internship",
        "start_date": intern.internship.start_date.isoformat() if intern.internship and intern.internship.start_date else None,
        "end_date": intern.internship.end_date.isoformat() if intern.internship and intern.internship.end_date else None,
        "status": intern.internship.status if intern.internship else "Active",
        "organisation": intern.internship.organisation if intern.internship else "Problem Solving Mind",
        "company_name": company.company_name if company else "Problem Solving Mind",
        "company_email": company.official_email if company else "hello@problemsolvingmind.org",
        "company_website": company.website if company else "https://problemsolvingmind.org",
        "company_phone": company.phone if company else "",
        "mentor_name": intern.mentor.name if intern.mentor else None,
        "certificate_id": cert.certificate_id if cert else None,
        "qr_url": qr_url,
    })


@intern_bp.post("")
@admin_required()
def create_intern():
    form = request.form if request.form else request.get_json(silent=True) or {}
    intern_id = (form.get("intern_id") or "").strip()
    full_name = (form.get("full_name") or "").strip()
    domain = (form.get("domain") or "").strip()
    if not intern_id or not full_name or not domain:
        return jsonify({"error": "intern_id, full_name and domain are required."}), 400
    from sqlalchemy import func
    if Intern.query.filter(func.lower(Intern.intern_id) == intern_id.lower()).first():
        return jsonify({"error": f"An intern with ID '{intern_id}' already exists."}), 409

    intern = Intern(
        intern_id=intern_id,
        full_name=full_name,
        email=(form.get("email") or "").strip() or None,
        domain=domain,
        mentor_id=int(form["mentor_id"]) if form.get("mentor_id") else None,
        is_active=str(form.get("is_active", "true")).lower() != "false",
    )
    if intern.mentor_id and not Mentor.query.get(intern.mentor_id):
        return jsonify({"error": "Mentor not found."}), 400

    if form.get("photo_url"):
        intern.photo_path = form.get("photo_url").strip()

    photo = request.files.get("photo")
    if photo:
        try:
            intern.photo_path = save_upload(photo, "photos", intern_id)
        except ValueError as exc:
            return jsonify({"error": str(exc)}), 400

    start_date = _parse_date(form.get("start_date"), datetime.utcnow().date())
    end_date = _parse_date(form.get("end_date"), datetime.utcnow().date())
    intern.internship = Internship(
        start_date=start_date,
        end_date=end_date,
        duration_label=form.get("duration_label") or f"{start_date} - {end_date}",
        status=form.get("internship_status") or "Ongoing",
        organisation=form.get("organisation") or "Problem Solving Mind",
    )
    db.session.add(intern)
    db.session.commit()
    log_action(get_jwt().get("email"), "create_intern", "Intern", intern.intern_id, intern.full_name)
    return jsonify(intern_payload(intern, include_private=True)), 201


@intern_bp.put("/<intern_id>")
@admin_required()
def update_intern(intern_id):
    intern = get_intern_or_404(intern_id)
    if not intern:
        return jsonify({"error": "Intern not found."}), 404
    form = request.form if request.form else request.get_json(silent=True) or {}

    from sqlalchemy import func
    if form.get("intern_id") and form.get("intern_id").strip().lower() != intern.intern_id.lower():
        new_id = form.get("intern_id").strip()
        if Intern.query.filter(func.lower(Intern.intern_id) == new_id.lower()).first():
            return jsonify({"error": f"An intern with ID '{new_id}' already exists."}), 409
        intern.intern_id = new_id

    intern.full_name = form.get("full_name", intern.full_name).strip()
    intern.email = (form.get("email") or intern.email or "").strip() or intern.email
    intern.domain = form.get("domain", intern.domain).strip()
    if "mentor_id" in form:
        intern.mentor_id = int(form["mentor_id"]) if form.get("mentor_id") else None
    if "is_active" in form:
        intern.is_active = str(form.get("is_active")).lower() != "false"

    if form.get("photo_url"):
        intern.photo_path = form.get("photo_url").strip()

    photo = request.files.get("photo")
    if photo:
        try:
            intern.photo_path = save_upload(photo, "photos", intern.intern_id)
        except ValueError as exc:
            return jsonify({"error": str(exc)}), 400

    if intern.internship:
        if form.get("start_date"):
            intern.internship.start_date = _parse_date(form.get("start_date"))
        if form.get("end_date"):
            intern.internship.end_date = _parse_date(form.get("end_date"))
        if form.get("duration_label"):
            intern.internship.duration_label = form.get("duration_label")
        if form.get("internship_status"):
            intern.internship.status = form.get("internship_status")
        if form.get("organisation"):
            intern.internship.organisation = form.get("organisation")
    db.session.commit()
    log_action(get_jwt().get("email"), "update_intern", "Intern", intern.intern_id)
    return jsonify(intern_payload(intern, include_private=True))


@intern_bp.delete("/<intern_id>")
@admin_required()
def delete_intern(intern_id):
    intern = get_intern_or_404(intern_id)
    if not intern:
        return jsonify({"error": "Intern not found."}), 404
    is_permanent = request.args.get("permanent", "false").lower() == "true"
    if is_permanent:
        db.session.delete(intern)
        db.session.commit()
        log_action(get_jwt().get("email"), "delete_intern_permanent", "Intern", intern_id)
        return jsonify({"message": f"Intern {intern_id} permanently removed."})
    else:
        intern.is_active = False
        db.session.commit()
        log_action(get_jwt().get("email"), "deactivate_intern", "Intern", intern.intern_id)
        return jsonify({"message": "Intern deactivated.", "intern": intern_payload(intern, include_private=True)})

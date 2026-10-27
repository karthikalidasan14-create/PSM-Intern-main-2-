from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt

from extensions import db
from models import Intern, Mentor, MentorEvaluation
from services.audit import log_action
from utils import admin_required, get_intern_or_404

evaluation_bp = Blueprint("evaluations", __name__, url_prefix="/evaluations")


def _score(data, key, max_val=20):
    try:
        val_raw = data.get(key)
        value = int(val_raw if val_raw is not None and str(val_raw).strip() != "" else 0)
    except (ValueError, TypeError):
        raise ValueError(f"{key.replace('_', ' ').title()} must be a valid integer.")
    if value < 0:
        raise ValueError(f"{key.replace('_', ' ').title()} cannot be negative.")
    if value > max_val:
        raise ValueError(f"{key.replace('_', ' ').title()} cannot exceed maximum of {max_val}.")
    return value


@evaluation_bp.get("")
@admin_required()
def list_evaluations():
    records = MentorEvaluation.query.order_by(MentorEvaluation.updated_at.desc()).all()
    return jsonify([item.to_dict(include_unpublished=True) for item in records])


@evaluation_bp.get("/intern/<intern_id>")
def get_evaluation(intern_id):
    intern = get_intern_or_404(intern_id)
    if not intern or not intern.evaluation or not intern.evaluation.is_published:
        return jsonify({"error": "Published evaluation not found."}), 404
    return jsonify(intern.evaluation.to_dict(include_unpublished=False))


@evaluation_bp.post("")
@admin_required()
def upsert_evaluation():
    data = request.get_json(silent=True) or {}
    intern = Intern.query.filter_by(intern_id=(data.get("intern_id") or "").strip()).first()
    if not intern:
        return jsonify({"error": "Intern not found."}), 404
    try:
        max_tech = int(data.get("max_technical_skills") or 20)
        max_ps = int(data.get("max_problem_solving") or 20)
        max_cq = int(data.get("max_code_quality") or 20)
        max_comm = int(data.get("max_communication") or 20)
        max_proj = int(data.get("max_project_evaluation") or 20)

        if any(m <= 0 for m in (max_tech, max_ps, max_cq, max_comm, max_proj)):
            return jsonify({"error": "Maximum marks for each category must be greater than zero."}), 400

        evaluation = intern.evaluation or MentorEvaluation(intern_pk=intern.id)
        evaluation.max_technical_skills = max_tech
        evaluation.max_problem_solving = max_ps
        evaluation.max_code_quality = max_cq
        evaluation.max_communication = max_comm
        evaluation.max_project_evaluation = max_proj

        evaluation.technical_skills = _score(data, "technical_skills", max_tech)
        evaluation.problem_solving = _score(data, "problem_solving", max_ps)
        evaluation.code_quality = _score(data, "code_quality", max_cq)
        evaluation.communication = _score(data, "communication", max_comm)

        proj_score = data.get("project_evaluation") if "project_evaluation" in data else data.get("teamwork", 0)
        evaluation.project_evaluation = _score({"project_evaluation": proj_score}, "project_evaluation", max_proj)
        evaluation.teamwork = evaluation.project_evaluation

        evaluation.feedback = data.get("feedback")
        evaluation.mentor_id = intern.mentor_id
        if data.get("mentor_id"):
            mentor = Mentor.query.get(int(data["mentor_id"]))
            if not mentor:
                return jsonify({"error": "Mentor not found."}), 400
            evaluation.mentor_id = mentor.id
        evaluation.calculate()
        if "is_published" in data:
            evaluation.is_published = bool(data.get("is_published"))
        db.session.add(evaluation)
        db.session.commit()
        log_action(get_jwt().get("email"), "upsert_evaluation", "MentorEvaluation", intern.intern_id)
        return jsonify(evaluation.to_dict(include_unpublished=True))
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400


@evaluation_bp.post("/<int:evaluation_id>/publish")
@admin_required()
def publish_evaluation(evaluation_id):
    evaluation = MentorEvaluation.query.get(evaluation_id)
    if not evaluation:
        return jsonify({"error": "Evaluation not found."}), 404
    evaluation.calculate()
    evaluation.is_published = True
    db.session.commit()
    intern_id = evaluation.intern.intern_id if evaluation.intern else evaluation.id
    log_action(get_jwt().get("email"), "publish_evaluation", "MentorEvaluation", intern_id)
    return jsonify(evaluation.to_dict(include_unpublished=True))

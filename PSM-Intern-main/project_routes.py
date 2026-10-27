from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt

from extensions import db
from models import Intern, Project
from services.audit import log_action
from utils import admin_required, get_intern_or_404

project_bp = Blueprint("projects", __name__, url_prefix="/projects")


@project_bp.get("")
@admin_required()
def list_projects():
    projects = Project.query.order_by(Project.updated_at.desc()).all()
    return jsonify([item.to_dict() for item in projects])


@project_bp.get("/intern/<intern_id>")
def get_project(intern_id):
    intern = get_intern_or_404(intern_id)
    if not intern or not intern.is_active or not intern.project:
        return jsonify({"error": "Project not found."}), 404
    return jsonify(intern.project.to_dict())


@project_bp.post("")
@admin_required()
def upsert_project():
    data = request.get_json(silent=True) or {}
    intern_id = (data.get("intern_id") or "").strip()
    intern = Intern.query.filter_by(intern_id=intern_id).first()
    if not intern:
        return jsonify({"error": "Intern not found."}), 404
    title = (data.get("title") or "").strip()
    if not title:
        return jsonify({"error": "Project title is required."}), 400

    project = intern.project or Project(intern_pk=intern.id)
    project.title = title
    project.description = data.get("description")
    project.technologies = data.get("technologies")
    project.github_url = data.get("github_url")
    project.live_url = data.get("live_url")
    project.achievements = data.get("achievements")
    project.status = data.get("status") or "In Progress"
    db.session.add(project)
    db.session.commit()
    log_action(get_jwt().get("email"), "upsert_project", "Project", intern.intern_id, title)
    return jsonify(project.to_dict())

from flask import Blueprint

from routes.auth_routes import auth_bp
from routes.intern_routes import intern_bp
from routes.project_routes import project_bp
from routes.evaluation_routes import evaluation_bp
from routes.certificate_routes import certificate_bp
from routes.verification_routes import verification_bp
from routes.contact_routes import contact_bp
from routes.admin_routes import admin_bp


def register_blueprints(app):
    api = Blueprint("api", __name__, url_prefix="/api")
    api.register_blueprint(auth_bp)
    api.register_blueprint(intern_bp)
    api.register_blueprint(project_bp)
    api.register_blueprint(evaluation_bp)
    api.register_blueprint(certificate_bp)
    api.register_blueprint(verification_bp)
    api.register_blueprint(contact_bp)
    api.register_blueprint(admin_bp)
    app.register_blueprint(api)

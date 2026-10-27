from datetime import date, datetime
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from sqlalchemy import create_engine, text

from config import Config
from extensions import db, jwt
from models import (
    Admin,
    Certificate,
    CompanySettings,
    Intern,
    Internship,
    Mentor,
    MentorEvaluation,
    Project,
)
from admin_routes import admin_bp
from auth_routes import auth_bp
from certificate_routes import certificate_bp
from contact_routes import contact_bp
from evaluation_routes import evaluation_bp
from intern_routes import intern_bp
from project_routes import project_bp
from verification_routes import verification_bp
from services.certificate_service import generate_certificate_pdf, generate_qr_png


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    Path(app.config["UPLOAD_FOLDER"]).mkdir(parents=True, exist_ok=True)

    sqlite_path = Path(__file__).resolve().parent / "psm.db"
    uri = app.config["SQLALCHEMY_DATABASE_URI"]
    if uri.startswith("mysql"):
        try:
            engine = create_engine(uri, pool_pre_ping=True)
            with engine.connect() as connection:
                connection.execute(text("SELECT 1"))
            engine.dispose()
        except Exception:
            app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{sqlite_path.as_posix()}"
            print("MySQL was unavailable. Using local SQLite at", sqlite_path)

    # Universal CORS setup allowing all frontends (localhost:5173, 5174, 5175, 3000, 5000, etc.)
    CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

    @app.after_request
    def add_cors_headers(response):
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
        response.headers["Access-Control-Allow-Methods"] = "GET,PUT,POST,DELETE,OPTIONS"
        return response
    
    db.init_app(app)
    jwt.init_app(app)

    # Register blueprints safely with their specific prefixes
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(auth_bp, url_prefix="/api")
    app.register_blueprint(certificate_bp, url_prefix="/api/certificates")
    app.register_blueprint(contact_bp, url_prefix="/api/contact")
    app.register_blueprint(evaluation_bp, url_prefix="/api/evaluations")
    app.register_blueprint(intern_bp, url_prefix="/api/interns")
    app.register_blueprint(project_bp, url_prefix="/api/projects")
    app.register_blueprint(verification_bp, url_prefix="/api/verify")

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok", "platform": "PSM Internship Certificate Verification"})

    @app.get("/uploads/<path:filename>")
    def public_uploads(filename):
        return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

    # Create tables and safely seed data without crashing
    with app.app_context():
        db.create_all()
        try:
            seed_data(app)
        except Exception as e:
            print(f"Seeding note (skipping if already initialized): {e}")

    return app


def seed_data(app):
    admin = Admin.query.first()
    if not admin:
        admin = Admin(name="PSM Administrator", email=app.config["ADMIN_EMAIL"], role="admin")
        admin.set_password(app.config["ADMIN_PASSWORD"])
        db.session.add(admin)

    mentor = Mentor.query.first()
    if not mentor:
        mentor = Mentor(
            name="Ananya Rao",
            email="mentor@problemsolvingmind.org",
            domain="Full Stack Development",
            phone="+91 98765 43210",
        )
        mentor.set_password("Mentor@123")
        db.session.add(mentor)

    company = CompanySettings.query.first()
    if not company:
        company = CompanySettings(
            company_name="Problem Solving Mind",
            tagline="Internship Certificate Verification Platform",
            official_email="hello@problemsolvingmind.org",
            phone="+91 90000 11111",
            website="https://problemsolvingmind.org",
            address="India",
            about=(
                "Problem Solving Mind (PSM) trains students through structured internships, "
                "mentorship and verifiable completion certificates."
            ),
        )
        db.session.add(company)

    upload_root = Path(app.config["UPLOAD_FOLDER"])
    photo_file = upload_root / "photos" / "PSM001.jpeg"
    photo_str = str(photo_file.resolve()) if photo_file.exists() else "uploads/photos/PSM001.jpeg"

    intern = Intern.query.filter_by(intern_id="PSM001").first()
    if not intern:
        intern = Intern(
            intern_id="PSM001",
            full_name="Karthikeyan K",
            email="karthikalidasan14@gmail.com",
            domain="Full Stack Development",
            photo_path=photo_str,
            mentor=mentor,
            is_active=True,
        )
        intern.internship = Internship(
            start_date=date(2025, 10, 6),
            end_date=date(2026, 4, 6),
            duration_label="6 October 2025 - 6 April 2026",
            status="Completed",
            organisation="Problem Solving Mind",
        )
        intern.project = Project(
            title="PSM Internship Certificate Verification Platform",
            description=(
                "A public verification portal and admin console for intern profiles, "
                "project records, mentor evaluations and tamper-evident certificates with ID cards."
            ),
            technologies="React, Vite, Flask, SQLite/MySQL, ReportLab, QR codes",
            github_url="https://github.com/problemsolvingmind/internship-verification-platform",
            live_url=app.config["FRONTEND_URL"],
            status="Completed",
        )
        intern.evaluation = MentorEvaluation(
            mentor=mentor,
            technical_skills=19,
            problem_solving=18,
            code_quality=19,
            communication=18,
            teamwork=18,
            feedback="Outstanding dedication, excellent full stack problem solving abilities, and high code quality delivered throughout the internship.",
            is_published=True,
        )
        intern.evaluation.calculate()
        db.session.add(intern)
        db.session.flush()

    frontend = app.config["FRONTEND_URL"].rstrip("/")
    cert_id = "PSM-CERT-PSM001"
    payload = f"{frontend}/verify?id={cert_id}"
    
    certificate = Certificate.query.filter_by(certificate_id=cert_id).first()
    if not certificate:
        certificate = Certificate(
            intern=intern,
            certificate_id=cert_id,
            qr_payload=payload,
            status="Valid",
            issued_at=datetime.utcnow(),
        )
    
    qr_dir = upload_root / "qr"
    cert_dir = upload_root / "certificates"
    qr_dir.mkdir(parents=True, exist_ok=True)
    cert_dir.mkdir(parents=True, exist_ok=True)

    qr_path = qr_dir / f"{cert_id}.png"
    pdf_path = cert_dir / f"{cert_id}.pdf"
    
    generate_qr_png(payload, qr_path)
    generate_certificate_pdf(certificate, intern, intern.internship, company, pdf_path, qr_path)
    
    certificate.qr_image_path = str(qr_path)
    certificate.pdf_path = str(pdf_path)
    db.session.add(certificate)
    db.session.commit()
    

def prepare_database(app):
    with app.app_context():
        try:
            db.create_all()
            print("Database tables created successfully!")
        except Exception as e:
            print(f"Database initialization note: {e}")


app = create_app()
prepare_database(app)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

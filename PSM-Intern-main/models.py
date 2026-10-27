from datetime import datetime
from werkzeug.security import check_password_hash, generate_password_hash
from extensions import db
class Admin(db.Model):
    __tablename__ = "admins"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(190), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(40), nullable=False, default="admin")
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "is_active": self.is_active,
        }
class Mentor(db.Model):
    __tablename__ = "mentors"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(190), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    domain = db.Column(db.String(120))
    phone = db.Column(db.String(40))
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "domain": self.domain,
            "phone": self.phone,
            "is_active": self.is_active,
        }
class CompanySettings(db.Model):
    __tablename__ = "company_settings"
    id = db.Column(db.Integer, primary_key=True)
    company_name = db.Column(db.String(180), nullable=False)
    tagline = db.Column(db.String(255))
    official_email = db.Column(db.String(190), nullable=False)
    phone = db.Column(db.String(40))
    website = db.Column(db.String(255))
    address = db.Column(db.Text)
    about = db.Column(db.Text)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    def to_dict(self):
        return {
            "id": self.id,
            "company_name": self.company_name,
            "tagline": self.tagline,
            "official_email": self.official_email,
            "phone": self.phone,
            "website": self.website,
            "address": self.address,
            "about": self.about,
        }
class Intern(db.Model):
    __tablename__ = "interns"
    id = db.Column(db.Integer, primary_key=True)
    intern_id = db.Column(db.String(40), unique=True, nullable=False)
    full_name = db.Column(db.String(160), nullable=False)
    email = db.Column(db.String(190))
    domain = db.Column(db.String(120), nullable=False)
    photo_path = db.Column(db.String(255))
    mentor_id = db.Column(db.Integer, db.ForeignKey("mentors.id"))
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    mentor = db.relationship("Mentor", backref="interns")
    internship = db.relationship("Internship", backref="intern", uselist=False, cascade="all, delete-orphan")
    project = db.relationship("Project", backref="intern", uselist=False, cascade="all, delete-orphan")
    evaluation = db.relationship(
        "MentorEvaluation", backref="intern", uselist=False, cascade="all, delete-orphan"
    )
    certificate = db.relationship(
        "Certificate", backref="intern", uselist=False, cascade="all, delete-orphan"
    )
    def to_dict(self, public=False):
        photo_url = None
        if self.photo_path:
            if self.photo_path.startswith("http://") or self.photo_path.startswith("https://") or self.photo_path.startswith("data:"):
                photo_url = self.photo_path
            else:
                photo_url = f"/api/interns/{self.intern_id}/photo"
        data = {
            "id": self.id,
            "intern_id": self.intern_id,
            "full_name": self.full_name,
            "email": None if public else self.email,
            "domain": self.domain,
            "photo_url": photo_url,
            "is_active": self.is_active,
            "mentor": self.mentor.to_dict() if self.mentor else None,
            "internship": self.internship.to_dict() if self.internship else None,
        }
        if public:
            data.pop("email", None)
        return data
class Internship(db.Model):
    __tablename__ = "internships"
    id = db.Column(db.Integer, primary_key=True)
    intern_pk = db.Column(db.Integer, db.ForeignKey("interns.id"), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    duration_label = db.Column(db.String(120), nullable=False)
    status = db.Column(db.String(40), nullable=False, default="Ongoing")
    organisation = db.Column(db.String(180), nullable=False, default="Problem Solving Mind")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    def to_dict(self):
        return {
            "id": self.id,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "duration_label": self.duration_label,
            "status": self.status,
            "organisation": self.organisation,
        }
class Project(db.Model):
    __tablename__ = "projects"
    id = db.Column(db.Integer, primary_key=True)
    intern_pk = db.Column(db.Integer, db.ForeignKey("interns.id"), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    technologies = db.Column(db.String(255))
    github_url = db.Column(db.String(500))
    live_url = db.Column(db.String(500))
    achievements = db.Column(db.Text)
    status = db.Column(db.String(40), nullable=False, default="In Progress")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    def to_dict(self):
        return {
            "id": self.id,
            "intern_pk": self.intern_pk,
            "intern_id": self.intern.intern_id if self.intern else None,
            "intern_name": self.intern.full_name if self.intern else None,
            "title": self.title,
            "description": self.description,
            "technologies": self.technologies,
            "github_url": self.github_url,
            "live_url": self.live_url,
            "achievements": self.achievements,
            "status": self.status,
        }
class MentorEvaluation(db.Model):
    __tablename__ = "mentor_evaluations"
    id = db.Column(db.Integer, primary_key=True)
    intern_pk = db.Column(db.Integer, db.ForeignKey("interns.id"), nullable=False)
    mentor_id = db.Column(db.Integer, db.ForeignKey("mentors.id"))
    technical_skills = db.Column(db.Integer, nullable=False, default=0)
    problem_solving = db.Column(db.Integer, nullable=False, default=0)
    code_quality = db.Column(db.Integer, nullable=False, default=0)
    communication = db.Column(db.Integer, nullable=False, default=0)
    project_evaluation = db.Column(db.Integer, nullable=False, default=0)
    teamwork = db.Column(db.Integer, nullable=False, default=0)
    max_technical_skills = db.Column(db.Integer, nullable=False, default=20)
    max_problem_solving = db.Column(db.Integer, nullable=False, default=20)
    max_code_quality = db.Column(db.Integer, nullable=False, default=20)
    max_communication = db.Column(db.Integer, nullable=False, default=20)
    max_project_evaluation = db.Column(db.Integer, nullable=False, default=20)
    max_total_marks = db.Column(db.Integer, nullable=False, default=100)
    total_marks = db.Column(db.Integer, nullable=False, default=0)
    percentage = db.Column(db.Numeric(5, 2), nullable=False, default=0)
    grade = db.Column(db.String(10))
    feedback = db.Column(db.Text)
    is_published = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    mentor = db.relationship("Mentor")
    def calculate(self):
        m_tech = self.max_technical_skills or 20
        m_ps = self.max_problem_solving or 20
        m_cq = self.max_code_quality or 20
        m_comm = self.max_communication or 20
        m_proj = self.max_project_evaluation or 20
        self.max_total_marks = m_tech + m_ps + m_cq + m_comm + m_proj
        if self.max_total_marks <= 0:
            self.max_total_marks = 100

        proj_val = self.project_evaluation if self.project_evaluation is not None else (self.teamwork or 0)
        self.project_evaluation = proj_val
        self.teamwork = proj_val

        scores = [
            self.technical_skills or 0,
            self.problem_solving or 0,
            self.code_quality or 0,
            self.communication or 0,
            proj_val,
        ]
        self.total_marks = sum(scores)
        self.percentage = round((self.total_marks / self.max_total_marks) * 100, 2)
        pct = float(self.percentage)
        if pct >= 90:
            self.grade = "A+"
        elif pct >= 80:
            self.grade = "A"
        elif pct >= 70:
            self.grade = "B"
        elif pct >= 60:
            self.grade = "C"
        else:
            self.grade = "D"
    def to_dict(self, include_unpublished=False):
        if not include_unpublished and not self.is_published:
            return None
        proj_val = self.project_evaluation if self.project_evaluation is not None else (self.teamwork or 0)
        return {
            "id": self.id,
            "intern_pk": self.intern_pk,
            "intern_id": self.intern.intern_id if self.intern else None,
            "intern_name": self.intern.full_name if self.intern else None,
            "mentor": self.mentor.to_dict() if self.mentor else None,
            "mentor_name": self.mentor.name if self.mentor else None,
            "technical_skills": self.technical_skills,
            "max_technical_skills": self.max_technical_skills or 20,
            "problem_solving": self.problem_solving,
            "max_problem_solving": self.max_problem_solving or 20,
            "code_quality": self.code_quality,
            "max_code_quality": self.max_code_quality or 20,
            "communication": self.communication,
            "max_communication": self.max_communication or 20,
            "project_evaluation": proj_val,
            "teamwork": proj_val,
            "max_project_evaluation": self.max_project_evaluation or 20,
            "total_marks": self.total_marks,
            "max_total_marks": self.max_total_marks or 100,
            "percentage": float(self.percentage or 0),
            "grade": self.grade,
            "feedback": self.feedback if (self.is_published or include_unpublished) else None,
            "is_published": self.is_published,
        }
class Certificate(db.Model):
    __tablename__ = "certificates"
    id = db.Column(db.Integer, primary_key=True)
    intern_pk = db.Column(db.Integer, db.ForeignKey("interns.id"), nullable=False)
    certificate_id = db.Column(db.String(60), unique=True, nullable=False)
    qr_payload = db.Column(db.String(500), nullable=False)
    qr_image_path = db.Column(db.String(255))
    pdf_path = db.Column(db.String(255))
    status = db.Column(db.String(40), nullable=False, default="Pending")
    issued_at = db.Column(db.DateTime)
    expires_at = db.Column(db.DateTime)
    revocation_reason = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    def to_dict(self):
        photo_url = None
        if self.intern and self.intern.photo_path:
            if self.intern.photo_path.startswith("http://") or self.intern.photo_path.startswith("https://") or self.intern.photo_path.startswith("data:"):
                photo_url = self.intern.photo_path
            else:
                photo_url = f"/api/interns/{self.intern.intern_id}/photo"
        return {
            "id": self.id,
            "intern_pk": self.intern_pk,
            "intern_id": self.intern.intern_id if self.intern else None,
            "intern_name": self.intern.full_name if self.intern else None,
            "domain": self.intern.domain if self.intern else None,
            "photo_url": photo_url,
            "certificate_id": self.certificate_id,
            "qr_payload": self.qr_payload,
            "qr_url": f"/api/certificates/{self.certificate_id}/qr",
            "pdf_url": f"/api/certificates/{self.certificate_id}/pdf",
            "status": self.status,
            "issued_at": self.issued_at.isoformat() if self.issued_at else None,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "revocation_reason": self.revocation_reason,
            "internship": self.intern.internship.to_dict() if self.intern and self.intern.internship else None,
        }
class AuditLog(db.Model):
    __tablename__ = "audit_logs"
    id = db.Column(db.Integer, primary_key=True)
    actor_email = db.Column(db.String(190))
    action = db.Column(db.String(120), nullable=False)
    entity_type = db.Column(db.String(80))
    entity_id = db.Column(db.String(80))
    details = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    def to_dict(self):
        return {
            "id": self.id,
            "actor_email": self.actor_email,
            "action": self.action,
            "entity_type": self.entity_type,
            "entity_id": self.entity_id,
            "details": self.details,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
    
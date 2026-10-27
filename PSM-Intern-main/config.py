import os
from datetime import timedelta
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

class Config:
    SECRET_KEY = os.getenv("FLASK_SECRET_KEY", "psm-dev-secret-key-super-secure-session-key-32b")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "psm-dev-jwt-secret-key-super-secure-token-32b")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "mysql+pymysql://root:password@127.0.0.1:3306/psm_internship",
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
    ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@problemsolvingmind.org")
    ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "Admin@123")
    UPLOAD_FOLDER = BASE_DIR / os.getenv("UPLOAD_FOLDER", "uploads")
    MAX_CONTENT_LENGTH = 8 * 1024 * 1024

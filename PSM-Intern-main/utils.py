from functools import wraps
from pathlib import Path

from flask import current_app, jsonify
from flask_jwt_extended import get_jwt, verify_jwt_in_request
from werkzeug.utils import secure_filename

from models import Intern

ALLOWED_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5 MB


def admin_required():
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            if claims.get("role") not in ("admin", "mentor"):
                return jsonify({"error": "Administrator access required."}), 403
            if fn.__name__.startswith("delete") or "revoke" in fn.__name__ or "settings" in fn.__name__:
                if claims.get("role") != "admin" and fn.__name__ not in (
                    "list_evaluations",
                    "upsert_evaluation",
                ):
                    pass
            return fn(*args, **kwargs)

        return wrapper

    return decorator


def admin_only():
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            if claims.get("role") != "admin":
                return jsonify({"error": "Admin role required."}), 403
            return fn(*args, **kwargs)

        return wrapper

    return decorator


def get_intern_or_404(intern_id):
    intern = Intern.query.filter_by(intern_id=intern_id).first()
    return intern


def save_upload(file_storage, subfolder, filename_stem):
    if not file_storage or not file_storage.filename:
        return None
    filename = file_storage.filename
    if "." not in filename:
        raise ValueError("Invalid file. Please upload an image with a valid extension (PNG, JPG, JPEG, WEBP).")
    ext = filename.rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise ValueError(f"Invalid file format '.{ext}'. Only PNG, JPG, JPEG, or WEBP images are allowed.")
    
    file_storage.seek(0, 2)
    file_size = file_storage.tell()
    file_storage.seek(0)
    if file_size > MAX_IMAGE_SIZE:
        raise ValueError(f"File size ({round(file_size / (1024 * 1024), 2)} MB) exceeds the 5 MB limit.")
        
    folder = Path(current_app.config["UPLOAD_FOLDER"]) / subfolder
    folder.mkdir(parents=True, exist_ok=True)
    filename = secure_filename(f"{filename_stem}.{ext}")
    dest = folder / filename
    file_storage.save(dest)
    return str(dest)

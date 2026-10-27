from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import Admin, Mentor
from extensions import db

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/auth/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")
    
    # Check Admin credentials
    admin = Admin.query.filter_by(email=email).first()
    if admin and admin.check_password(password):
        token = create_access_token(identity=str(admin.id), additional_claims={"role": admin.role, "email": admin.email})
        user_data = {
            "id": admin.id,
            "name": admin.name,
            "email": admin.email,
            "role": admin.role
        }
        return jsonify({
            "token": token,
            "access_token": token,
            "role": admin.role,
            "name": admin.name,
            "user": user_data
        }), 200
        
    # Check Mentor credentials
    mentor = Mentor.query.filter_by(email=email).first()
    if mentor and mentor.check_password(password):
        token = create_access_token(identity=str(mentor.id), additional_claims={"role": "mentor", "email": mentor.email})
        user_data = {
            "id": mentor.id,
            "name": mentor.name,
            "email": mentor.email,
            "role": "mentor"
        }
        return jsonify({
            "token": token,
            "access_token": token,
            "role": "mentor",
            "name": mentor.name,
            "user": user_data
        }), 200
        
    return jsonify({"error": "Invalid email or password"}), 401

@auth_bp.get("/auth/me")
@jwt_required()
def me():
    uid = int(get_jwt_identity())
    admin = Admin.query.get(uid)
    if admin:
        return jsonify({
            "id": admin.id,
            "name": admin.name,
            "email": admin.email,
            "role": admin.role
        }), 200
    mentor = Mentor.query.get(uid)
    if mentor:
        return jsonify({
            "id": mentor.id,
            "name": mentor.name,
            "email": mentor.email,
            "role": "mentor"
        }), 200
    return jsonify({"error": "User not found"}), 404

@auth_bp.post("/auth/change-password")
@jwt_required()
def change_password():
    uid = int(get_jwt_identity())
    data = request.get_json() or {}
    cur_pwd = data.get("current_password")
    new_pwd = data.get("new_password")
    if not cur_pwd or not new_pwd:
        return jsonify({"error": "Current and new password required"}), 400
    admin = Admin.query.get(uid)
    if admin:
        if not admin.check_password(cur_pwd):
            return jsonify({"error": "Incorrect current password"}), 400
        admin.set_password(new_pwd)
        db.session.commit()
        return jsonify({"message": "Password changed successfully"}), 200
    mentor = Mentor.query.get(uid)
    if mentor:
        if not mentor.check_password(cur_pwd):
            return jsonify({"error": "Incorrect current password"}), 400
        mentor.set_password(new_pwd)
        db.session.commit()
        return jsonify({"message": "Password changed successfully"}), 200
    return jsonify({"error": "User not found"}), 404

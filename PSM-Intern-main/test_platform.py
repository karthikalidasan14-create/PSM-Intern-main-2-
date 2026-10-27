import json
import io
from app import create_app
from extensions import db
from models import Admin, Intern, Certificate, MentorEvaluation, Project

def run_all_tests():
    app = create_app()
    client = app.test_client()

    print("\n--- TEST 1: Health Check ---")
    res = client.get("/api/health")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    print("Health check OK:", res.get_json())

    print("\n--- TEST 2: Admin Authentication ---")
    login_res = client.post("/api/auth/login", json={
        "email": "admin@problemsolvingmind.org",
        "password": "Admin@123"
    })
    assert login_res.status_code == 200, f"Login failed: {login_res.data}"
    login_data = login_res.get_json()
    token = login_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Admin authentication successful. Token received.")

    print("\n--- TEST 3: Query Interns & Photo URL ---")
    interns_res = client.get("/api/interns", headers=headers)
    assert interns_res.status_code == 200
    interns = interns_res.get_json()
    psm001 = next((i for i in interns if i["intern_id"] == "PSM001"), None)
    assert psm001 is not None, "PSM001 record missing!"
    assert psm001["photo_url"] is not None, "PSM001 photo_url missing!"
    print(f"PSM001 found. Name: {psm001['full_name']}, Photo URL: {psm001['photo_url']}")

    print("\n--- TEST 4: Fetch Intern Photo Bytes ---")
    photo_res = client.get(psm001["photo_url"])
    assert photo_res.status_code == 200, f"Photo failed: {photo_res.status_code}"
    assert len(photo_res.data) > 0, "Photo data empty"
    print(f"Photo fetched successfully: {len(photo_res.data)} bytes, Content-Type: {photo_res.content_type}")

    print("\n--- TEST 5: Public Verification Endpoint via Intern ID (PSM001) ---")
    verify_res = client.get("/api/verify?id=PSM001")
    assert verify_res.status_code == 200, f"Verify failed: {verify_res.data}"
    v_data = verify_res.get_json()
    assert v_data["valid"] is True, "Expected valid to be True"
    assert v_data["status"] == "Valid"
    assert v_data["intern"]["full_name"] == "Ananya Iyer"
    assert v_data["intern"]["photo_url"] is not None
    assert v_data["project"] is not None
    assert "github.com" in v_data["project"]["github_url"]
    assert v_data["evaluation"] is not None
    assert v_data["evaluation"]["percentage"] is not None
    print("Public verification for PSM001 verified successfully!")
    print(f"Marks: Tech={v_data['evaluation']['technical_skills']}, PS={v_data['evaluation']['problem_solving']}, CQ={v_data['evaluation']['code_quality']}, Comm={v_data['evaluation']['communication']}, Proj={v_data['evaluation']['project_evaluation']}")
    print(f"Total: {v_data['evaluation']['total_marks']}/{v_data['evaluation']['max_total_marks']}, Pct: {v_data['evaluation']['percentage']}%, Grade: {v_data['evaluation']['grade']}")

    print("\n--- TEST 6: Public Verification Endpoint via Certificate ID ---")
    cert_id = v_data["certificate"]["certificate_id"]
    verify_cert_res = client.get(f"/api/verify?id={cert_id}")
    assert verify_cert_res.status_code == 200
    v_cert_data = verify_cert_res.get_json()
    assert v_cert_data["valid"] is True
    assert v_cert_data["intern"]["intern_id"] == "PSM001"
    print(f"Verification by Certificate ID ({cert_id}) passed!")

    print("\n--- TEST 7: Verification of Unknown/Invalid ID (404 Not Found) ---")
    unknown_res = client.get("/api/verify?id=UNKNOWN-999")
    assert unknown_res.status_code == 404
    u_data = unknown_res.get_json()
    assert u_data["valid"] is False
    assert u_data["status"] == "Not Found"
    print("Unknown certificate handled correctly:", u_data)

    print("\n--- TEST 8: Mentor Marks Validation (Negative and Exceeding Max) ---")
    # Test negative marks
    bad_res1 = client.post("/api/evaluations", headers=headers, json={
        "intern_id": "PSM001",
        "technical_skills": -5,
        "max_technical_skills": 20
    })
    assert bad_res1.status_code == 400, "Negative marks should be rejected!"
    print("Negative marks rejected:", bad_res1.get_json()["error"])

    # Test marks exceeding maximum
    bad_res2 = client.post("/api/evaluations", headers=headers, json={
        "intern_id": "PSM001",
        "technical_skills": 25,
        "max_technical_skills": 20
    })
    assert bad_res2.status_code == 400, "Marks exceeding max should be rejected!"
    print("Exceeding marks rejected:", bad_res2.get_json()["error"])

    print("\n--- TEST 9: Configured Maximum Marks & Recalculation ---")
    # Save custom marks with configured maximum of 25 each (total 125)
    save_eval_res = client.post("/api/evaluations", headers=headers, json={
        "intern_id": "PSM001",
        "technical_skills": 23,
        "max_technical_skills": 25,
        "problem_solving": 24,
        "max_problem_solving": 25,
        "code_quality": 23,
        "max_code_quality": 25,
        "communication": 22,
        "max_communication": 25,
        "project_evaluation": 23,
        "max_project_evaluation": 25,
        "feedback": "Exceptional full-stack architecture and engineering performance.",
        "is_published": True
    })
    assert save_eval_res.status_code == 200, f"Evaluation save failed: {save_eval_res.data}"
    eval_saved = save_eval_res.get_json()
    assert eval_saved["total_marks"] == 115
    assert eval_saved["max_total_marks"] == 125
    assert eval_saved["percentage"] == 92.0 # (115/125)*100 = 92%
    assert eval_saved["grade"] == "A+"
    print(f"Configured max calculation passed: {eval_saved['total_marks']}/{eval_saved['max_total_marks']} = {eval_saved['percentage']}% (Grade: {eval_saved['grade']})")

    # Restore standard 20-point scale for PSM001 (18, 17, 18, 16, 17 -> 86/100, 86%, Grade A)
    client.post("/api/evaluations", headers=headers, json={
        "intern_id": "PSM001",
        "technical_skills": 18,
        "max_technical_skills": 20,
        "problem_solving": 17,
        "max_problem_solving": 20,
        "code_quality": 18,
        "max_code_quality": 20,
        "communication": 16,
        "max_communication": 20,
        "project_evaluation": 17,
        "max_project_evaluation": 20,
        "feedback": "Outstanding dedication, excellent full stack problem solving abilities, and high code quality delivered throughout the internship.",
        "is_published": True
    })

    print("\n--- TEST 10: Revoke Certificate & Public Status Verification ---")
    revoke_res = client.post(f"/api/certificates/{cert_id}/revoke", headers=headers, json={
        "reason": "Test audit: Credential pending secondary administrative review"
    })
    assert revoke_res.status_code == 200
    revoked_cert = revoke_res.get_json()
    assert revoked_cert["status"] == "Revoked"
    assert revoked_cert["revocation_reason"] == "Test audit: Credential pending secondary administrative review"

    # Verify public endpoint now shows Revoked and valid=False
    verify_revoked = client.get(f"/api/verify?id={cert_id}")
    assert verify_revoked.status_code == 200
    vr_data = verify_revoked.get_json()
    assert vr_data["valid"] is False, "Revoked certificate must NEVER be valid!"
    assert vr_data["status"] == "Revoked"
    assert vr_data["certificate"]["revocation_reason"] is not None
    print("Revocation correctly reflected on public profile: status='Revoked', valid=False")

    # Re-issue certificate to Valid
    issue_res = client.post(f"/api/certificates/{cert_id}/issue", headers=headers)
    assert issue_res.status_code == 200
    issued_cert = issue_res.get_json()
    assert issued_cert["status"] == "Valid"
    verify_restored = client.get(f"/api/verify?id={cert_id}").get_json()
    assert verify_restored["valid"] is True
    assert verify_restored["status"] == "Valid"
    print("Re-issuance verified: status restored to 'Valid', valid=True")

    print("\n--- TEST 11: Photo File Validation (Invalid format & size) ---")
    bad_file = (io.BytesIO(b"fake executable data"), "script.exe")
    bad_upload_res = client.post("/api/interns", headers=headers, data={
        "intern_id": "TEST_INVALID",
        "full_name": "Test Intern",
        "domain": "Web Development",
        "photo": bad_file
    }, content_type="multipart/form-data")
    assert bad_upload_res.status_code == 400
    print("Non-image file rejected:", bad_upload_res.get_json()["error"])

    print("\n--- TEST 12: Duplicate Intern ID Prevention ---")
    dup_res = client.post("/api/interns", headers=headers, json={
        "intern_id": "psm001", # Case-insensitive duplicate
        "full_name": "Duplicate Intern",
        "domain": "DevOps"
    })
    assert dup_res.status_code == 409
    print("Duplicate Intern ID rejected:", dup_res.get_json()["error"])

    print("\n==========================================")
    print("ALL 12 BACKEND & BUSINESS LOGIC TESTS PASSED!")
    print("==========================================\n")

if __name__ == "__main__":
    run_all_tests()

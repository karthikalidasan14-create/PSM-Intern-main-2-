import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { AdminAPI } from "./api.js";
import StatusBadge from "./StatusBadge.jsx";
import AvatarPlaceholder from "./AvatarPlaceholder.jsx";
import { uploadPhotoToFirebase, syncInternToFirestore } from "./firebase.js";

const emptyForm = {
  intern_id: "",
  full_name: "",
  email: "",
  domain: "",
  mentor_id: "",
  start_date: "",
  end_date: "",
  duration_label: "",
  internship_status: "Ongoing",
  is_active: "true",
};

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function InternManagement() {
  const [interns, setInterns] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  async function refresh() {
    const [internRows, mentorRows] = await Promise.all([AdminAPI.interns(), AdminAPI.mentors()]);
    setInterns(internRows);
    setMentors(mentorRows);
  }

  useEffect(() => {
    refresh().catch((err) => setError(err.message));
  }, []);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handlePhotoChange(event) {
    setError("");
    const file = event.target.files?.[0];
    if (!file) {
      setPhoto(null);
      setPhotoPreview(null);
      return;
    }

    // 1. Validate image mime type
    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      setError("Invalid image type. Please select a PNG, JPG, JPEG, or WEBP photograph.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // 2. Validate file size (<= 5MB)
    if (file.size > MAX_FILE_SIZE) {
      setError(`File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds 5 MB maximum limit.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setPhoto(file);
    // Real-time preview
    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);
  }

  function removeSelectedPhoto() {
    setPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function startEdit(intern) {
    setEditing(intern.intern_id);
    setError("");
    setMessage("");
    setPhoto(null);
    setPhotoPreview(intern.photo_url || null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    setForm({
      intern_id: intern.intern_id,
      full_name: intern.full_name,
      email: intern.email || "",
      domain: intern.domain,
      mentor_id: intern.mentor?.id || "",
      start_date: intern.internship?.start_date || "",
      end_date: intern.internship?.end_date || "",
      duration_label: intern.internship?.duration_label || "",
      internship_status: intern.internship?.status || "Ongoing",
      is_active: intern.is_active ? "true" : "false",
    });

    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const internIdClean = form.intern_id.trim();
    const fullNameClean = form.full_name.trim();

    if (!internIdClean || !fullNameClean || !form.domain.trim()) {
      setError("Intern ID, full name, and domain are required.");
      return;
    }

    // Check duplicate intern ID
    const duplicate = interns.some(
      (i) => i.intern_id.toLowerCase() === internIdClean.toLowerCase() && i.intern_id !== editing
    );
    if (duplicate) {
      setError(`Intern ID '${internIdClean}' already exists. Please choose a unique identifier.`);
      return;
    }

    setLoading(true);

    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, value));

      // Attempt Firebase Storage upload if available
      let firebasePhotoUrl = null;
      if (photo) {
        payload.append("photo", photo);
        try {
          firebasePhotoUrl = await uploadPhotoToFirebase(photo, internIdClean);
          if (firebasePhotoUrl) {
            payload.append("photo_url", firebasePhotoUrl);
          }
        } catch (fErr) {
          console.warn("Firebase Storage note:", fErr.message);
        }
      }

      const savedIntern = await AdminAPI.saveIntern(payload, editing);

      // Attempt sync to Firestore 'internships' collection
      try {
        await syncInternToFirestore(savedIntern);
      } catch (syncErr) {
        console.warn("Firestore sync note:", syncErr.message);
      }

      setMessage(editing ? `Intern ${internIdClean} successfully updated!` : `Intern ${internIdClean} created successfully!`);
      setForm(emptyForm);
      setPhoto(null);
      setPhotoPreview(null);
      setEditing(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await refresh();
    } catch (err) {
      setError(err.message || "Failed to save intern record.");
    } finally {
      setLoading(false);
    }
  }

  async function deactivateOrDelete(internId, isPermanent = false) {
    const actionName = isPermanent ? "PERMANENTLY DELETE" : "deactivate";
    const confirmed = window.confirm(
      `Are you sure you want to ${actionName} intern record '${internId}'? This action requires administrator confirmation.`
    );
    if (!confirmed) return;

    try {
      await AdminAPI.deactivateIntern(internId);
      setMessage(`Intern ${internId} has been successfully deactivated.`);
      await refresh();
    } catch (err) {
      setError(err.message || `Failed to deactivate ${internId}.`);
    }
  }

  return (
    <>
      <div className="admin-header-row">
        <div>
          <h1>Intern Management</h1>
          <p className="muted">
            Manage individual intern credentials, profile photographs, assigned mentors, and internship durations.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setForm(emptyForm);
            setEditing(null);
            setPhoto(null);
            setPhotoPreview(null);
            setError("");
            setMessage("");
            window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
          }}
        >
          + Add New Intern
        </button>
      </div>

      {message && <div className="alert ok" role="status">{message}</div>}
      {error && <div className="alert error" role="alert">{error}</div>}

      {/* INTERN ROSTER TABLE */}
      <div className="table-wrap panel" style={{ marginTop: 16 }}>
        <table>
          <thead>
            <tr>
              <th>Profile Photograph</th>
              <th>Intern Name</th>
              <th>Intern ID</th>
              <th>Domain</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {interns.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: 24 }} className="muted">
                  No interns registered yet. Use the form below to add the first intern.
                </td>
              </tr>
            ) : (
              interns.map((intern) => (
                <tr key={intern.intern_id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {intern.photo_url ? (
                        <img
                          src={intern.photo_url}
                          alt={intern.full_name}
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: "50%",
                            objectFit: "cover",
                            border: "2px solid #245fcb",
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const fallback = e.currentTarget.nextElementSibling;
                            if (fallback) fallback.style.display = "inline-flex";
                          }}
                        />
                      ) : null}
                      <div style={{ display: intern.photo_url ? "none" : "inline-flex" }}>
                        <AvatarPlaceholder name={intern.full_name} size={44} />
                      </div>
                    </div>
                  </td>
                  <td>
                    <strong>{intern.full_name}</strong>
                    {intern.email && <div style={{ fontSize: 12, color: "var(--muted)" }}>{intern.email}</div>}
                  </td>
                  <td>
                    <code className="code-tag">{intern.intern_id}</code>
                  </td>
                  <td>{intern.domain}</td>
                  <td>{intern.internship?.duration_label || "—"}</td>
                  <td>
                    <StatusBadge status={intern.internship?.status || (intern.is_active ? "Active" : "Inactive")} />
                  </td>
                  <td className="row-actions">
                    <Link
                      className="button secondary"
                      to={`/verify?id=${intern.intern_id}`}
                      target="_blank"
                      rel="noreferrer"
                      title="View Public Profile"
                    >
                      Public Profile
                    </Link>
                    <Link
                      className="button secondary"
                      to={`/intern/${intern.intern_id}/id-card`}
                      target="_blank"
                      rel="noreferrer"
                      title="View ID Card"
                    >
                      ID Card
                    </Link>
                    <button type="button" className="secondary" onClick={() => startEdit(intern)}>
                      Edit
                    </button>
                    <button type="button" className="danger" onClick={() => deactivateOrDelete(intern.intern_id)}>
                      Deactivate
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ADD / EDIT INTERN FORM PANEL */}
      <section className="panel form-panel" style={{ marginTop: 24 }} id="internFormPanel">
        <div className="card-header-row">
          <div>
            <p className="eyebrow">{editing ? "UPDATE CREDENTIAL" : "REGISTRATION"}</p>
            <h2>{editing ? `Edit Intern: ${form.full_name} (${editing})` : "Register New Intern"}</h2>
          </div>
          {editing && (
            <button
              type="button"
              className="secondary"
              onClick={() => {
                setForm(emptyForm);
                setEditing(null);
                setPhoto(null);
                setPhotoPreview(null);
              }}
            >
              Cancel Edit
            </button>
          )}
        </div>

        <form onSubmit={onSubmit}>
          <div className="grid grid-2">
            <div>
              <label>Full Name *</label>
              <input
                value={form.full_name}
                onChange={(e) => update("full_name", e.target.value)}
                required
                placeholder="e.g. Karthikeyan K"
              />

              <label>Intern ID * (Unique Identifier)</label>
              <input
                value={form.intern_id}
                onChange={(e) => update("intern_id", e.target.value)}
                required
                disabled={Boolean(editing)}
                placeholder="e.g. PSM001"
              />

              <label>Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="intern@example.com"
              />

              <label>Domain / Specialization *</label>
              <input
                value={form.domain}
                onChange={(e) => update("domain", e.target.value)}
                required
                placeholder="e.g. Full Stack Development"
              />

              <label>Assigned Industry Mentor</label>
              <select value={form.mentor_id} onChange={(e) => update("mentor_id", e.target.value)}>
                <option value="">Unassigned</option>
                {mentors.map((mentor) => (
                  <option key={mentor.id} value={mentor.id}>
                    {mentor.name} ({mentor.domain || "Mentor"})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Start Date</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => update("start_date", e.target.value)}
              />

              <label>End Date</label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => update("end_date", e.target.value)}
              />

              <label>Duration Label</label>
              <input
                value={form.duration_label}
                onChange={(e) => update("duration_label", e.target.value)}
                placeholder="e.g. 6 October 2025 - 6 April 2026 (6 Months)"
              />

              <label>Internship Completion Status</label>
              <select
                value={form.internship_status}
                onChange={(e) => update("internship_status", e.target.value)}
              >
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
                <option value="Incomplete">Incomplete</option>
              </select>

              {/* PROFILE PHOTOGRAPH UPLOAD & PREVIEW */}
              <div className="photo-upload-container" style={{ marginTop: 14 }}>
                <label style={{ margin: "0 0 6px" }}>
                  Profile Photograph (PNG, JPG, JPEG, WEBP · Max 5MB)
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handlePhotoChange}
                />

                {/* IMAGE PREVIEW CARD */}
                {photoPreview && (
                  <div className="photo-preview-box">
                    <div className="preview-label">Live Photo Preview:</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="photo-preview-img"
                        style={{
                          width: 80,
                          height: 80,
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: "3px solid #245fcb",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>
                          {photo ? photo.name : "Current Saved Photo"}
                        </div>
                        {photo && (
                          <div style={{ fontSize: 12, color: "var(--muted)" }}>
                            Size: {(photo.size / 1024).toFixed(1)} KB · Ready to save
                          </div>
                        )}
                        {photo && (
                          <button
                            type="button"
                            className="secondary"
                            onClick={removeSelectedPhoto}
                            style={{ padding: "4px 8px", fontSize: 12, marginTop: 4 }}
                          >
                            Remove selection
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="row-actions" style={{ marginTop: 20 }}>
            <button type="submit" disabled={loading}>
              {loading ? "Saving Intern Record..." : editing ? "Update Intern Profile" : "Save Intern Profile"}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => {
                setForm(emptyForm);
                setEditing(null);
                setPhoto(null);
                setPhotoPreview(null);
                setError("");
                setMessage("");
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            >
              Reset Form
            </button>
          </div>
        </form>
      </section>
    </>
  );
}

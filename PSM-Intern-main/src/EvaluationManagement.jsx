import { useEffect, useMemo, useState } from "react";
import { AdminAPI } from "./api.js";

const emptyEvaluation = {
  intern_id: "",
  technical_skills: 0,
  max_technical_skills: 20,
  problem_solving: 0,
  max_problem_solving: 20,
  code_quality: 0,
  max_code_quality: 20,
  communication: 0,
  max_communication: 20,
  project_evaluation: 0,
  max_project_evaluation: 20,
  feedback: "",
  is_published: false,
};

export default function EvaluationManagement() {
  const [interns, setInterns] = useState([]);
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(emptyEvaluation);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Real-time automatic calculation of totals, percentage and grade
  const computed = useMemo(() => {
    const marks = [
      Number(form.technical_skills) || 0,
      Number(form.problem_solving) || 0,
      Number(form.code_quality) || 0,
      Number(form.communication) || 0,
      Number(form.project_evaluation) || 0,
    ];
    const maxMarks = [
      Number(form.max_technical_skills) || 20,
      Number(form.max_problem_solving) || 20,
      Number(form.max_code_quality) || 20,
      Number(form.max_communication) || 20,
      Number(form.max_project_evaluation) || 20,
    ];

    const total = marks.reduce((acc, curr) => acc + curr, 0);
    const maxTotal = maxMarks.reduce((acc, curr) => acc + curr, 0);
    const percentage = maxTotal > 0 ? Number(((total / maxTotal) * 100).toFixed(2)) : 0;

    let grade = "D";
    if (percentage >= 90) grade = "A+";
    else if (percentage >= 80) grade = "A";
    else if (percentage >= 70) grade = "B";
    else if (percentage >= 60) grade = "C";

    return { total, maxTotal, percentage, grade };
  }, [form]);

  async function refresh() {
    const [internRows, evalRows] = await Promise.all([AdminAPI.interns(), AdminAPI.evaluations()]);
    setInterns(internRows);
    setRows(evalRows);
  }

  useEffect(() => {
    refresh().catch((err) => setError(err.message));
  }, []);

  function fill(row) {
    setError("");
    setMessage("");
    setForm({
      intern_id: row.intern_id,
      technical_skills: row.technical_skills ?? 0,
      max_technical_skills: row.max_technical_skills || 20,
      problem_solving: row.problem_solving ?? 0,
      max_problem_solving: row.max_problem_solving || 20,
      code_quality: row.code_quality ?? 0,
      max_code_quality: row.max_code_quality || 20,
      communication: row.communication ?? 0,
      max_communication: row.max_communication || 20,
      project_evaluation: row.project_evaluation ?? row.teamwork ?? 0,
      max_project_evaluation: row.max_project_evaluation || 20,
      feedback: row.feedback || "",
      is_published: Boolean(row.is_published),
    });
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!form.intern_id) {
      setError("Please select an intern.");
      return;
    }

    // Validation checks: marks must not be negative or exceed configured maximum
    const categories = [
      { name: "Technical Skills", val: Number(form.technical_skills), max: Number(form.max_technical_skills) },
      { name: "Problem Solving", val: Number(form.problem_solving), max: Number(form.max_problem_solving) },
      { name: "Code Quality", val: Number(form.code_quality), max: Number(form.max_code_quality) },
      { name: "Communication", val: Number(form.communication), max: Number(form.max_communication) },
      { name: "Project Evaluation", val: Number(form.project_evaluation), max: Number(form.max_project_evaluation) },
    ];

    for (const cat of categories) {
      if (cat.val < 0) {
        setError(`${cat.name} marks cannot be negative.`);
        return;
      }
      if (cat.max <= 0) {
        setError(`${cat.name} maximum marks must be greater than zero.`);
        return;
      }
      if (cat.val > cat.max) {
        setError(`${cat.name} marks (${cat.val}) cannot exceed the configured maximum (${cat.max}).`);
        return;
      }
    }

    setLoading(true);
    try {
      await AdminAPI.saveEvaluation(form);
      setMessage(`Mentor evaluation saved successfully for intern ${form.intern_id}!`);
      await refresh();
    } catch (err) {
      setError(err.message || "Failed to save mentor evaluation.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="admin-header-row">
        <div>
          <h1>Mentor Evaluation & Marks Management</h1>
          <p className="muted">
            Enter and configure mentor evaluation marks, set custom category maximums, view real-time grading,
            and approve feedback for public verification.
          </p>
        </div>
      </div>

      {message && <div className="alert ok" role="status">{message}</div>}
      {error && <div className="alert error" role="alert">{error}</div>}

      {/* EVALUATION ROSTER TABLE */}
      <div className="table-wrap panel" style={{ marginTop: 16 }}>
        <table>
          <thead>
            <tr>
              <th>Intern Name</th>
              <th>Intern ID</th>
              <th>Marks Awarded / Max</th>
              <th>Percentage</th>
              <th>Grade</th>
              <th>Public Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: 24 }} className="muted">
                  No evaluations recorded yet. Fill out the form below to enter an evaluation.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.intern_name}</strong>
                  </td>
                  <td>
                    <code className="code-tag">{row.intern_id}</code>
                  </td>
                  <td>
                    <strong>{row.total_marks}</strong> / {row.max_total_marks || 100}
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: "var(--ok)" }}>{row.percentage}%</span>
                  </td>
                  <td>
                    <span className={`grade-pill grade-${(row.grade || "D").replace("+", "-plus")}`}>
                      Grade {row.grade || "—"}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${row.is_published ? "valid" : "pending"}`}>
                      {row.is_published ? "Published (Public)" : "Draft (Internal Only)"}
                    </span>
                  </td>
                  <td className="row-actions">
                    <button type="button" className="secondary" onClick={() => fill(row)}>
                      Edit Marks
                    </button>
                    {!row.is_published ? (
                      <button
                        type="button"
                        onClick={async () => {
                          await AdminAPI.publishEvaluation(row.id);
                          setMessage(`Evaluation published for intern ${row.intern_id}.`);
                          await refresh();
                        }}
                      >
                        Approve & Publish
                      </button>
                    ) : (
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>Live on Profile</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* EVALUATION INPUT & CONFIGURATION PANEL */}
      <section className="panel form-panel" style={{ marginTop: 24 }}>
        <div className="card-header-row">
          <div>
            <p className="eyebrow">ASSESSMENT ENTRY</p>
            <h2>{form.intern_id ? `Enter Evaluation for ${form.intern_id}` : "Enter Mentor Evaluation"}</h2>
          </div>
        </div>

        <form onSubmit={onSubmit}>
          <label>Select Intern *</label>
          <select
            value={form.intern_id}
            onChange={(e) => {
              const selectedId = e.target.value;
              const existingRow = rows.find((r) => r.intern_id === selectedId);
              if (existingRow) {
                fill(existingRow);
              } else {
                setForm({ ...emptyEvaluation, intern_id: selectedId });
              }
            }}
            required
          >
            <option value="">-- Choose an intern --</option>
            {interns.map((intern) => (
              <option key={intern.intern_id} value={intern.intern_id}>
                {intern.full_name} ({intern.intern_id}) · {intern.domain}
              </option>
            ))}
          </select>

          {/* MARKS & CONFIGURABLE MAXIMUM MARKS GRID */}
          <div style={{ marginTop: 18 }}>
            <p style={{ fontWeight: 700, marginBottom: 8, color: "var(--navy)" }}>
              Marks Awarded & Configured Maximum Marks:
            </p>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Evaluation Category</th>
                    <th style={{ width: 180 }}>Marks Awarded</th>
                    <th style={{ width: 180 }}>Configured Maximum</th>
                    <th style={{ textAlign: "right", width: 120 }}>Category Score</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { key: "technical_skills", maxKey: "max_technical_skills", label: "Technical Skills" },
                    { key: "problem_solving", maxKey: "max_problem_solving", label: "Problem Solving" },
                    { key: "code_quality", maxKey: "max_code_quality", label: "Code Quality" },
                    { key: "communication", maxKey: "max_communication", label: "Communication" },
                    { key: "project_evaluation", maxKey: "max_project_evaluation", label: "Project Evaluation" },
                  ].map((field) => {
                    const score = Number(form[field.key]) || 0;
                    const max = Number(form[field.maxKey]) || 20;
                    const pct = max > 0 ? Math.round((score / max) * 100) : 0;
                    const isExceeded = score > max;

                    return (
                      <tr key={field.key} style={isExceeded ? { background: "#fff5f5" } : {}}>
                        <td>
                          <strong>{field.label}</strong>
                          {isExceeded && (
                            <div style={{ fontSize: 11, color: "var(--danger)" }}>
                              Marks exceed maximum!
                            </div>
                          )}
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            max={max}
                            value={form[field.key]}
                            onChange={(e) => setForm({ ...form, [field.key]: Number(e.target.value) })}
                            required
                            style={isExceeded ? { borderColor: "var(--danger)" } : {}}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            value={form[field.maxKey]}
                            onChange={(e) => setForm({ ...form, [field.maxKey]: Number(e.target.value) })}
                            required
                          />
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <span style={{ fontWeight: 700, color: isExceeded ? "var(--danger)" : "var(--navy)" }}>
                            {pct}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* REAL-TIME COMPUTED STATS CARD */}
          <div className="eval-computed-card" style={{ marginTop: 20 }}>
            <div className="eval-stat-box">
              <span className="stat-label">TOTAL MARKS AWARDED</span>
              <span className="stat-number">
                {computed.total} / {computed.maxTotal}
              </span>
            </div>
            <div className="eval-stat-box">
              <span className="stat-label">OVERALL PERCENTAGE</span>
              <span className="stat-number" style={{ color: "var(--ok)" }}>
                {computed.percentage}%
              </span>
            </div>
            <div className="eval-stat-box">
              <span className="stat-label">PERFORMANCE GRADE</span>
              <span className={`grade-pill grade-${computed.grade.replace("+", "-plus")}`}>
                Grade {computed.grade}
              </span>
            </div>
          </div>

          <label style={{ marginTop: 20 }}>Mentor Feedback / Recommendation</label>
          <textarea
            value={form.feedback}
            onChange={(e) => setForm({ ...form, feedback: e.target.value })}
            placeholder="Provide qualitative feedback on performance, work ethic, and achievements..."
          />

          <div style={{ marginTop: 14 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                style={{ width: 18, height: 18, margin: 0 }}
              />
              <span>
                <strong>Approve and publish mentor evaluation for public verification</strong> (If unchecked, marks
                remain confidential and internal only).
              </span>
            </label>
          </div>

          <div className="row-actions" style={{ marginTop: 20 }}>
            <button type="submit" disabled={loading}>
              {loading ? "Saving Evaluation..." : "Save Evaluation"}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => {
                setForm(emptyEvaluation);
                setError("");
                setMessage("");
              }}
            >
              Reset
            </button>
          </div>
        </form>
      </section>
    </>
  );
}

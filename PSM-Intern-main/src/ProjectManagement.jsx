import { useEffect, useState } from "react";
import { AdminAPI } from "./api.js";
import StatusBadge from "./StatusBadge.jsx";

const empty = {
  intern_id: "",
  title: "",
  description: "",
  technologies: "",
  github_url: "",
  live_url: "",
  achievements: "",
  status: "In Progress",
};

export default function ProjectManagement() {
  const [interns, setInterns] = useState([]);
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState(empty);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function refresh() {
    const [internRows, projectRows] = await Promise.all([AdminAPI.interns(), AdminAPI.projects()]);
    setInterns(internRows);
    setProjects(projectRows);
  }

  useEffect(() => {
    refresh().catch((err) => setError(err.message));
  }, []);

  function fill(project) {
    setError("");
    setMessage("");
    setForm({
      intern_id: project.intern_id,
      title: project.title,
      description: project.description || "",
      technologies: project.technologies || "",
      github_url: project.github_url || "",
      live_url: project.live_url || "",
      achievements: project.achievements || "",
      status: project.status || "In Progress",
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
    if (!form.title.trim()) {
      setError("Project title is required.");
      return;
    }

    setLoading(true);
    try {
      await AdminAPI.saveProject(form);
      setMessage(`Project portfolio saved for intern ${form.intern_id}!`);
      await refresh();
    } catch (err) {
      setError(err.message || "Failed to save project.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="admin-header-row">
        <div>
          <h1>Project Portfolio Management</h1>
          <p className="muted">
            Record capstone project deliverables, GitHub repository links, technologies used, and key achievements.
          </p>
        </div>
      </div>

      {message && <div className="alert ok" role="status">{message}</div>}
      {error && <div className="alert error" role="alert">{error}</div>}

      <div className="table-wrap panel" style={{ marginTop: 16 }}>
        <table>
          <thead>
            <tr>
              <th>Intern Name</th>
              <th>Project Title</th>
              <th>GitHub Repository</th>
              <th>Live Demo</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: 24 }} className="muted">
                  No project records found. Use the form below to add an intern project.
                </td>
              </tr>
            ) : (
              projects.map((project) => (
                <tr key={project.id}>
                  <td>
                    <strong>{project.intern_name}</strong>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>{project.intern_id}</div>
                  </td>
                  <td>
                    <strong>{project.title}</strong>
                    {project.technologies && (
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>{project.technologies}</div>
                    )}
                  </td>
                  <td>
                    {project.github_url ? (
                      <a href={project.github_url} target="_blank" rel="noopener noreferrer">
                        Repository ↗
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    {project.live_url ? (
                      <a href={project.live_url} target="_blank" rel="noopener noreferrer">
                        Live Demo ↗
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <StatusBadge status={project.status} />
                  </td>
                  <td>
                    <button className="secondary" type="button" onClick={() => fill(project)}>
                      Edit Project
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <section className="panel form-panel" style={{ marginTop: 24 }}>
        <div className="card-header-row">
          <div>
            <p className="eyebrow">PORTFOLIO ENTRY</p>
            <h2>{form.intern_id ? `Project Details for ${form.intern_id}` : "Add / Update Project Portfolio"}</h2>
          </div>
        </div>

        <form onSubmit={onSubmit}>
          <label>Select Intern *</label>
          <select
            value={form.intern_id}
            onChange={(e) => {
              const selectedId = e.target.value;
              const existingProject = projects.find((p) => p.intern_id === selectedId);
              if (existingProject) {
                fill(existingProject);
              } else {
                setForm({ ...empty, intern_id: selectedId });
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

          <label>Project Title *</label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. PSM Internship Certificate Verification Platform"
            required
          />

          <label>Project Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Detailed overview of problem statement, architecture, and responsibilities..."
          />

          <label>Key Project Achievements (Optional)</label>
          <textarea
            value={form.achievements}
            onChange={(e) => setForm({ ...form, achievements: e.target.value })}
            placeholder="e.g. Achieved 99.9% uptime, optimized query latency by 45%, designed responsive UI..."
            style={{ minHeight: 80 }}
          />

          <label>Technologies Used</label>
          <input
            value={form.technologies}
            onChange={(e) => setForm({ ...form, technologies: e.target.value })}
            placeholder="e.g. React, Vite, Flask, SQLite/MySQL, ReportLab, Firebase"
          />

          <label>GitHub Repository URL</label>
          <input
            type="url"
            value={form.github_url}
            onChange={(e) => setForm({ ...form, github_url: e.target.value })}
            placeholder="https://github.com/organization/repo-name"
          />

          <label>Live Project URL (Optional)</label>
          <input
            type="url"
            value={form.live_url}
            onChange={(e) => setForm({ ...form, live_url: e.target.value })}
            placeholder="https://your-domain.com"
          />

          <label>Project Completion Status</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Incomplete">Incomplete</option>
          </select>

          <div className="row-actions" style={{ marginTop: 20 }}>
            <button type="submit" disabled={loading}>
              {loading ? "Saving Project..." : "Save Project Portfolio"}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => {
                setForm(empty);
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

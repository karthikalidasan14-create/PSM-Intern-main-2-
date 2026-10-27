import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge.jsx";
import AvatarPlaceholder from "./AvatarPlaceholder.jsx";

export default function InternPublicProfile({ data, certificateId }) {
  if (!data) return null;

  const { intern, project, evaluation, certificate, status, valid, company } = data;
  const isRevoked = status === "Revoked" || certificate?.status === "Revoked";
  const isPending = status === "Pending" || certificate?.status === "Pending";
  const isExpired = status === "Expired" || certificate?.status === "Expired";
  const isValid = valid && !isRevoked;

  // Evaluation rows mapping
  const evaluationCategories = evaluation
    ? [
        {
          key: "technical_skills",
          label: "Technical Skills",
          marks: evaluation.technical_skills ?? 0,
          max: evaluation.max_technical_skills || 20,
        },
        {
          key: "problem_solving",
          label: "Problem Solving",
          marks: evaluation.problem_solving ?? 0,
          max: evaluation.max_problem_solving || 20,
        },
        {
          key: "code_quality",
          label: "Code Quality",
          marks: evaluation.code_quality ?? 0,
          max: evaluation.max_code_quality || 20,
        },
        {
          key: "communication",
          label: "Communication",
          marks: evaluation.communication ?? 0,
          max: evaluation.max_communication || 20,
        },
        {
          key: "project_evaluation",
          label: "Project Evaluation",
          marks: evaluation.project_evaluation ?? evaluation.teamwork ?? 0,
          max: evaluation.max_project_evaluation || 20,
        },
      ]
    : [];

  const techList = project?.technologies
    ? project.technologies.split(/[,•|]+/).map((t) => t.trim()).filter(Boolean)
    : [];

  const certDisplayId = certificate?.certificate_id || certificateId || intern?.intern_id;

  return (
    <div className="public-profile-container">
      {/* 1. TOP STATUS BANNER */}
      {isRevoked ? (
        <div className="profile-alert-banner revoked-banner" role="alert">
          <div className="banner-icon">⚠️</div>
          <div className="banner-text">
            <h3>CERTIFICATE REVOKED</h3>
            <p>
              This certificate was officially <strong>REVOKED</strong> by Problem Solving Mind. It is no longer valid.
            </p>
            {certificate?.revocation_reason && (
              <p className="revocation-reason">
                <strong>Reason for revocation:</strong> {certificate.revocation_reason}
              </p>
            )}
          </div>
        </div>
      ) : isValid ? (
        <div className="profile-alert-banner verified-banner" role="status">
          <div className="banner-icon">✓</div>
          <div className="banner-text">
            <h3>OFFICIALLY VERIFIED INTERNSHIP CERTIFICATE</h3>
            <p>
              This record is authentic and registered in the Problem Solving Mind credential registry.
            </p>
          </div>
        </div>
      ) : isPending ? (
        <div className="profile-alert-banner pending-banner" role="status">
          <div className="banner-icon">⏳</div>
          <div className="banner-text">
            <h3>CERTIFICATE PENDING ISSUANCE</h3>
            <p>This certificate record is currently pending administrative review or issuance.</p>
          </div>
        </div>
      ) : isExpired ? (
        <div className="profile-alert-banner expired-banner" role="status">
          <div className="banner-icon">⏰</div>
          <div className="banner-text">
            <h3>CERTIFICATE EXPIRED</h3>
            <p>The validity period for this internship credential has elapsed.</p>
          </div>
        </div>
      ) : null}

      {/* 2. PROFILE HEADER CARD */}
      <section className="profile-header-card card">
        <div className="profile-header-main">
          <div className="profile-photo-container">
            {intern?.photo_url ? (
              <img
                src={intern.photo_url}
                alt={intern.full_name}
                className="profile-photo-img"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const placeholder = e.currentTarget.nextElementSibling;
                  if (placeholder) placeholder.style.display = "flex";
                }}
              />
            ) : null}
            <div
              style={{ display: intern?.photo_url ? "none" : "flex" }}
              className="profile-photo-fallback"
            >
              <AvatarPlaceholder name={intern?.full_name || "Intern"} size={130} />
            </div>
            {isValid && <div className="photo-verified-badge" title="Identity Verified">✓ Verified</div>}
          </div>

          <div className="profile-header-info">
            <div className="profile-title-row">
              <span className="profile-org-tag">
                {intern?.organisation || company?.company_name || "PROBLEM SOLVING MIND"}
              </span>
              <StatusBadge status={status || certificate?.status || "Valid"} />
            </div>

            <h1 className="profile-intern-name">{intern?.full_name}</h1>
            <p className="profile-intern-domain">{intern?.domain}</p>

            <div className="profile-meta-badges">
              <div className="meta-badge-item">
                <span className="meta-badge-label">Intern ID</span>
                <span className="meta-badge-val">{intern?.intern_id}</span>
              </div>
              <div className="meta-badge-item">
                <span className="meta-badge-label">Organization</span>
                <span className="meta-badge-val">{intern?.organisation || "Problem Solving Mind"}</span>
              </div>
              {certDisplayId && (
                <div className="meta-badge-item">
                  <span className="meta-badge-label">Certificate ID</span>
                  <span className="meta-badge-val">{certDisplayId}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3. FOUR CORE PROFILE SECTIONS */}
      <div className="profile-sections-grid">
        {/* SECTION A: PROFESSIONAL DETAILS */}
        <section className="card profile-card" id="professional-details">
          <div className="card-section-header">
            <span className="section-step-num">A</span>
            <div>
              <p className="eyebrow">CREDENTIAL SPECIFICATIONS</p>
              <h2>Professional Details</h2>
            </div>
          </div>

          <div className="details-list">
            <div className="detail-item">
              <span className="detail-label">Internship Duration:</span>
              <span className="detail-value highlight">{intern?.duration_label || "Completed Term"}</span>
            </div>
            {intern?.start_date && (
              <div className="detail-item">
                <span className="detail-label">Start Date:</span>
                <span className="detail-value">{intern.start_date}</span>
              </div>
            )}
            {intern?.end_date && (
              <div className="detail-item">
                <span className="detail-label">End Date:</span>
                <span className="detail-value">{intern.end_date}</span>
              </div>
            )}
            <div className="detail-item">
              <span className="detail-label">Certificate Issue Date:</span>
              <span className="detail-value">
                {certificate?.issued_at
                  ? new Date(certificate.issued_at).toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "Verified on Record"}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Specialization Domain:</span>
              <span className="detail-value">{intern?.domain}</span>
            </div>
            {intern?.mentor?.name && (
              <div className="detail-item">
                <span className="detail-label">Assigned Mentor:</span>
                <span className="detail-value">{intern.mentor.name}</span>
              </div>
            )}
          </div>
        </section>

        {/* SECTION B: PROJECT PORTFOLIO */}
        <section className="card profile-card" id="project-portfolio">
          <div className="card-section-header">
            <span className="section-step-num">B</span>
            <div>
              <p className="eyebrow">CAPSTONE DELIVERABLES</p>
              <h2>Project Portfolio</h2>
            </div>
          </div>

          {project ? (
            <div className="project-body">
              <div className="project-title-bar">
                <h3 className="project-title">{project.title}</h3>
                <StatusBadge status={project.status || "Completed"} />
              </div>

              <p className="project-description">{project.description || "Project completed under mentor guidance."}</p>

              {project.achievements && (
                <div className="project-achievements-box">
                  <strong>Project Achievements:</strong>
                  <p>{project.achievements}</p>
                </div>
              )}

              {techList.length > 0 && (
                <div className="project-tech-section">
                  <span className="tech-heading">Technologies Used:</span>
                  <div className="tech-tags">
                    {techList.map((tech, idx) => (
                      <span key={idx} className="tech-tag">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="project-action-links">
                {project.github_url ? (
                  <a
                    href={project.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button project-btn github-btn"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                    <span>View GitHub Repository</span>
                  </a>
                ) : (
                  <span className="muted" style={{ fontSize: 13 }}>Repository link recorded privately</span>
                )}

                {project.live_url && (
                  <a
                    href={project.live_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button secondary project-btn"
                  >
                    <span>Live Demonstration ↗</span>
                  </a>
                )}
              </div>
            </div>
          ) : (
            <p className="muted">Project details are being compiled by the supervisor.</p>
          )}
        </section>

        {/* SECTION C: MENTOR EVALUATION AND MARKS */}
        <section className="card profile-card" id="mentor-evaluation">
          <div className="card-section-header">
            <span className="section-step-num">C</span>
            <div>
              <p className="eyebrow">ACADEMIC & INDUSTRY ASSESSMENT</p>
              <h2>Mentor Evaluation & Marks</h2>
            </div>
          </div>

          {evaluation ? (
            <div className="evaluation-body">
              {evaluation.mentor?.name && (
                <p className="mentor-lead-note">
                  Assessed by Industry Mentor: <strong>{evaluation.mentor.name}</strong>
                  {evaluation.mentor.domain && <span> ({evaluation.mentor.domain})</span>}
                </p>
              )}

              {/* Professional Marks Table */}
              <div className="table-wrap marks-table-wrap">
                <table className="marks-table">
                  <thead>
                    <tr>
                      <th>Evaluation Category</th>
                      <th style={{ textAlign: "center" }}>Marks Awarded</th>
                      <th style={{ textAlign: "center" }}>Maximum Marks</th>
                      <th style={{ textAlign: "right" }}>Attainment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evaluationCategories.map((cat) => {
                      const pct = Math.round((cat.marks / (cat.max || 20)) * 100);
                      return (
                        <tr key={cat.key}>
                          <td>
                            <strong>{cat.label}</strong>
                          </td>
                          <td style={{ textAlign: "center", fontWeight: 700, color: "var(--navy)" }}>
                            {cat.marks}
                          </td>
                          <td style={{ textAlign: "center", color: "var(--muted)" }}>
                            {cat.max}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <div className="mini-progress-wrap">
                              <span style={{ fontSize: 12, fontWeight: 600 }}>{pct}%</span>
                              <div className="progress-bar-bg">
                                <div className="progress-bar-fill" style={{ width: `${Math.min(pct, 100)}%` }} />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="marks-total-row">
                      <td><strong>Total Marks Awarded</strong></td>
                      <td style={{ textAlign: "center", fontWeight: 800, fontSize: 16, color: "var(--blue)" }}>
                        {evaluation.total_marks}
                      </td>
                      <td style={{ textAlign: "center", fontWeight: 700, fontSize: 15, color: "var(--muted)" }}>
                        {evaluation.max_total_marks || 100}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 800, fontSize: 16, color: "var(--ok)" }}>
                        {evaluation.percentage}%
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Performance Score Summary Bar */}
              <div className="performance-summary-box">
                <div className="summary-stat">
                  <span className="summary-label">OVERALL PERCENTAGE</span>
                  <span className="summary-val">{evaluation.percentage}%</span>
                </div>
                {evaluation.grade && (
                  <div className="summary-stat">
                    <span className="summary-label">PERFORMANCE GRADE</span>
                    <span className={`grade-pill grade-${evaluation.grade.replace("+", "-plus")}`}>
                      Grade {evaluation.grade}
                    </span>
                  </div>
                )}
                <div className="summary-stat">
                  <span className="summary-label">TOTAL SCORE</span>
                  <span className="summary-val">
                    {evaluation.total_marks} / {evaluation.max_total_marks || 100}
                  </span>
                </div>
              </div>

              {/* Mentor Feedback (Only displayed when approved for public viewing!) */}
              {evaluation.feedback ? (
                <div className="mentor-feedback-box">
                  <div className="feedback-header">
                    <span className="feedback-quote-icon">“</span>
                    <strong>Official Mentor Recommendation & Feedback</strong>
                  </div>
                  <p className="feedback-text">{evaluation.feedback}</p>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="muted">Official mentor evaluation marks are recorded upon completion review.</p>
          )}
        </section>

        {/* SECTION D: CERTIFICATE VERIFICATION */}
        <section className="card profile-card" id="certificate-verification">
          <div className="card-section-header">
            <span className="section-step-num">D</span>
            <div>
              <p className="eyebrow">TAMPER-EVIDENT RECORD</p>
              <h2>Certificate Verification</h2>
            </div>
          </div>

          <div className="certificate-verification-body">
            <div className="cert-meta-grid">
              <div className="cert-meta-cell">
                <span className="cert-meta-cell-label">Certificate ID</span>
                <span className="cert-meta-cell-val code-font">{certDisplayId}</span>
              </div>
              <div className="cert-meta-cell">
                <span className="cert-meta-cell-label">Registry Status</span>
                <StatusBadge status={status || certificate?.status || "Valid"} />
              </div>
              <div className="cert-meta-cell">
                <span className="cert-meta-cell-label">Issue Date</span>
                <span className="cert-meta-cell-val">
                  {certificate?.issued_at
                    ? new Date(certificate.issued_at).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "Active Record"}
                </span>
              </div>
              <div className="cert-meta-cell">
                <span className="cert-meta-cell-label">Verification Type</span>
                <span className="cert-meta-cell-val">Direct Cryptographic QR Code</span>
              </div>
            </div>

            {/* QR Code and Actions */}
            <div className="cert-actions-panel">
              {certificate?.qr_url ? (
                <div className="qr-preview-card">
                  <img src={certificate.qr_url} alt="Verification QR Code" width="110" height="110" />
                  <span className="qr-caption">Scan to re-verify live</span>
                </div>
              ) : intern?.intern_id ? (
                <div className="qr-preview-card">
                  <img src={`/api/interns/${intern.intern_id}/qr`} alt="Verification QR Code" width="110" height="110" />
                  <span className="qr-caption">Scan to re-verify live</span>
                </div>
              ) : null}

              <div className="cert-download-actions">
                {certificate?.certificate_id && (
                  <a
                    href={`/api/certificates/${certificate.certificate_id}/pdf`}
                    className="button"
                    target="_blank"
                    rel="noreferrer"
                  >
                    📄 Download Official PDF Certificate
                  </a>
                )}
                {intern?.intern_id && (
                  <Link
                    to={`/intern/${intern.intern_id}/id-card`}
                    className="button secondary"
                    target="_blank"
                    rel="noreferrer"
                  >
                    🪪 View Interactive Intern ID Card
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* FOOTER BRANDING */}
      <footer className="profile-psm-footer">
        <p className="psm-footer-title">PROBLEM SOLVING MIND (PSM)</p>
        <p className="psm-footer-sub">
          Official Internship Credential & Certificate Verification Platform
        </p>
        <p className="psm-footer-meta">
          All certificates issued by PSM are cryptographically tamper-evident, verifiable via QR scanning,
          and securely indexed in the institutional database.
        </p>
      </footer>
    </div>
  );
}

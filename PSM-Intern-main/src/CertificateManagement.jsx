import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminAPI } from "./api.js";
import StatusBadge from "./StatusBadge.jsx";

export default function CertificateManagement() {
  const [interns, setInterns] = useState([]);
  const [rows, setRows] = useState([]);
  const [internId, setInternId] = useState("");
  const [customCertId, setCustomCertId] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function refresh() {
    const [internRows, certRows] = await Promise.all([AdminAPI.interns(), AdminAPI.certificates()]);
    setInterns(internRows);
    setRows(certRows);
  }

  useEffect(() => {
    refresh().catch((err) => setError(err.message));
  }, []);

  async function generate(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!internId) {
      setError("Please select an intern.");
      return;
    }

    // Check duplicate certificate ID if custom entered
    if (customCertId.trim()) {
      const exists = rows.some((r) => r.certificate_id.toLowerCase() === customCertId.trim().toLowerCase());
      if (exists) {
        setError(`Certificate ID '${customCertId.trim()}' already exists. Please choose a unique ID.`);
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        intern_id: internId,
        status: "Valid", // Generated certificates can be issued directly
      };
      if (customCertId.trim()) {
        payload.certificate_id = customCertId.trim();
      }

      await AdminAPI.generateCertificate(payload);
      setMessage(`Certificate successfully generated and issued for intern ${internId}!`);
      setInternId("");
      setCustomCertId("");
      await refresh();
    } catch (err) {
      setError(err.message || "Failed to generate certificate.");
    } finally {
      setLoading(false);
    }
  }

  async function issue(certificateId) {
    setError("");
    setMessage("");
    try {
      await AdminAPI.issueCertificate(certificateId);
      setMessage(`Certificate ${certificateId} has been marked as Valid and Issued.`);
      await refresh();
    } catch (err) {
      setError(err.message || "Failed to issue certificate.");
    }
  }

  async function revoke(certificateId) {
    setError("");
    setMessage("");

    const confirmed = window.confirm(
      `⚠️ WARNING: Are you sure you want to REVOKE certificate '${certificateId}'?\n\nOnce revoked, the public verification page will prominently indicate that this certificate is invalid and revoked.`
    );
    if (!confirmed) return;

    let revocationReason = reason.trim();
    if (!revocationReason) {
      revocationReason = window.prompt("Please provide the official reason for revocation (Required):", "");
      if (!revocationReason || !revocationReason.trim()) {
        setError("A revocation reason is mandatory to revoke a certificate.");
        return;
      }
    }

    try {
      await AdminAPI.revokeCertificate(certificateId, revocationReason.trim());
      setMessage(`Certificate ${certificateId} was revoked. Public status updated.`);
      setReason("");
      await refresh();
    } catch (err) {
      setError(err.message || "Failed to revoke certificate.");
    }
  }

  return (
    <>
      <div className="admin-header-row">
        <div>
          <h1>Certificate & QR Code Management</h1>
          <p className="muted">
            Issue tamper-evident completion certificates, generate unique cryptographic QR codes, download PDF
            certificates, and manage revocation statuses.
          </p>
        </div>
      </div>

      {message && <div className="alert ok" role="status">{message}</div>}
      {error && <div className="alert error" role="alert">{error}</div>}

      {/* GENERATE CERTIFICATE PANEL */}
      <section className="panel form-panel" style={{ marginTop: 16 }}>
        <p className="eyebrow">CREDENTIAL ISSUANCE</p>
        <h2>Issue New Certificate with Unique QR Code</h2>
        <form onSubmit={generate}>
          <div className="grid grid-2">
            <div>
              <label>Select Intern *</label>
              <select value={internId} onChange={(e) => setInternId(e.target.value)} required>
                <option value="">-- Choose an intern --</option>
                {interns.map((intern) => (
                  <option key={intern.intern_id} value={intern.intern_id}>
                    {intern.full_name} ({intern.intern_id}) · {intern.domain}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Custom Certificate ID (Optional — leave blank for auto-generation)</label>
              <input
                value={customCertId}
                onChange={(e) => setCustomCertId(e.target.value)}
                placeholder="e.g. PSM-CERT-PSM001"
              />
            </div>
          </div>

          <div className="row-actions" style={{ marginTop: 16 }}>
            <button type="submit" disabled={loading}>
              {loading ? "Generating Certificate..." : "Generate & Issue Certificate"}
            </button>
          </div>
        </form>
      </section>

      {/* CERTIFICATES ROSTER TABLE */}
      <div className="table-wrap panel" style={{ marginTop: 24 }}>
        <p className="eyebrow">REGISTRY RECORDS</p>
        <h2>Issued Certificates</h2>

        <table>
          <thead>
            <tr>
              <th>Certificate ID</th>
              <th>Intern Name</th>
              <th>Status</th>
              <th>Unique QR Code</th>
            <th>QR Preview</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: "center", padding: 24 }} className="muted">
                  No certificates issued yet. Select an intern above to generate their certificate.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.certificate_id}>
                  <td>
                    <code className="code-tag">{row.certificate_id}</code>
                    {row.issued_at && (
                      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                        Issued: {new Date(row.issued_at).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td>
                    <strong>{row.intern_name}</strong>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>{row.intern_id}</div>
                  </td>
                  <td>
                    <StatusBadge status={row.status} />
                    {row.status === "Revoked" && row.revocation_reason && (
                      <div style={{ fontSize: 11, color: "var(--danger)", marginTop: 4 }}>
                        Reason: {row.revocation_reason}
                      </div>
                    )}
                  </td>
                  <td>
                    {row.qr_url && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <img
                          src={row.qr_url}
                          alt="QR"
                          width="48"
                          height="48"
                          style={{ border: "1px solid var(--line)", borderRadius: 6, background: "white" }}
                        />
                        <a
                          href={row.qr_url}
                          download={`QR_${row.certificate_id}.png`}
                          className="button secondary"
                          style={{ padding: "4px 8px", fontSize: 12 }}
                          title="Download QR Image"
                        >
                          Download QR
                        </a>
                      </div>
                    )}
                  </td>
                  <td className="row-actions">
                    <Link
                      to={`/verify?id=${row.certificate_id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="button secondary"
                      title="Open Public Verification Page"
                    >
                      Verify Public Profile
                    </Link>
                    <a
                      className="button secondary"
                      href={row.pdf_url}
                      target="_blank"
                      rel="noreferrer"
                      title="Download PDF Certificate"
                    >
                      Download PDF
                    </a>
                    {row.status !== "Valid" && (
                      <button type="button" onClick={() => issue(row.certificate_id)}>
                        Issue Valid
                      </button>
                    )}
                    {row.status !== "Revoked" && (
                      <button
                        type="button"
                        className="danger"
                        onClick={() => revoke(row.certificate_id)}
                      >
                        Revoke Certificate
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Revocation reason helper note */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
          <label style={{ margin: "0 0 6px" }}>Default Revocation Reason (Used when clicking Revoke):</label>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Intern did not complete project requirements / Credential re-issued under new ID"
          />
        </div>
      </div>
    </>
  );
}

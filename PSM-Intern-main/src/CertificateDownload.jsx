import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import StatusBadge from "./StatusBadge.jsx";
import { PublicAPI } from "./api.js";

export default function CertificateDownload() {
  const { certificateId } = useParams();
  const [params] = useSearchParams();
  const [query, setQuery] = useState(certificateId || params.get("id") || "PSM-CERT-PSMI012");
  const [certificate, setCertificate] = useState(null);
  const [error, setError] = useState("");

  async function load(id) {
    try {
      setError("");
      const data = await PublicAPI.certificate(id);
      setCertificate(data);
    } catch (err) {
      setCertificate(null);
      setError(err.message);
    }
  }

  useEffect(() => {
    if (query) load(query);
  }, [certificateId]);

  return (
    <main className="page">
      <section className="card">
        <p className="eyebrow">CERTIFICATE PREVIEW & DOWNLOAD</p>
        <h1>Official Certificate Preview</h1>
        <p className="muted">
          Verifiable internship certificate with embedded security QR and authenticated intern portrait.
        </p>

        <form
          className="search-row"
          onSubmit={(event) => {
            event.preventDefault();
            load(query.trim());
          }}
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Certificate ID (e.g. PSM-CERT-PSMI012)"
          />
          <button type="submit">Load Certificate</button>
        </form>

        {error && <div className="alert error">{error}</div>}

        {certificate && (
          <div className="certificate-wrapper" style={{ marginTop: 24 }}>
            <div className="certificate">
              <div className="cert-top-branding">
                <p className="eyebrow">PROBLEM SOLVING MIND</p>
                <h2>Internship Completion Certificate</h2>
              </div>

              {/* Intern Photo on Certificate */}
              <div className="cert-photo-container">
                {certificate.photo_url ? (
                  <img
                    src={certificate.photo_url}
                    alt={certificate.intern_name}
                    className="cert-embed-photo"
                  />
                ) : (
                  <div className="cert-embed-photo-placeholder" />
                )}
                <span className="cert-photo-label">Verified Intern</span>
              </div>

              <p className="cert-pre-text">This is proudly presented to certify that</p>
              <h1 className="cert-recipient-name">{certificate.intern_name}</h1>
              <div className="cert-divider-line" />
              <p className="cert-recipient-domain">
                has successfully completed an internship in <strong>{certificate.domain}</strong>
              </p>
              {certificate.internship?.duration_label && (
                <p className="muted" style={{ margin: "4px 0" }}>
                  Internship Duration: {certificate.internship.duration_label}
                </p>
              )}
              <p style={{ margin: "10px 0" }}>
                <strong>Certificate ID:</strong> {certificate.certificate_id}
              </p>
              <p><StatusBadge status={certificate.status} /></p>

              <div className="cert-qr-container" style={{ margin: "16px auto" }}>
                <img
                  src={certificate.qr_url}
                  alt="Certificate QR code"
                  width="130"
                  height="130"
                  style={{ borderRadius: 8, background: "#fff", padding: 6, border: "1px solid #ddd" }}
                />
                <p style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0 0" }}>
                  Scan code to verify authenticity
                </p>
              </div>

              <div className="row-actions" style={{ justifyContent: "center", marginTop: 20 }}>
                <a className="button" href={certificate.pdf_url}>
                  Download Official PDF Certificate
                </a>
                {certificate.intern_id && (
                  <Link className="button secondary" to={`/intern/${certificate.intern_id}/id-card`}>
                    View Intern ID Card
                  </Link>
                )}
                {certificate.intern_id && (
                  <Link className="button secondary" to={`/intern/${certificate.intern_id}`}>
                    Intern Profile
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

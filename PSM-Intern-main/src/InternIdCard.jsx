import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import StatusBadge from "./StatusBadge.jsx";
import { PublicAPI } from "./api.js";

export default function InternIdCard() {
  const { internId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    PublicAPI.idCard(internId)
      .then(setData)
      .catch((err) => {
        // Fallback to internDetail
        PublicAPI.intern(internId)
          .then((intern) => {
            setData({
              intern_id: intern.intern_id,
              full_name: intern.full_name,
              domain: intern.domain,
              email: intern.email,
              photo_url: intern.photo_url,
              duration_label: intern.internship?.duration_label || "Active Intern",
              status: intern.internship?.status || "Active",
              organisation: intern.internship?.organisation || "Problem Solving Mind",
              company_name: "Problem Solving Mind",
              company_email: "hello@problemsolvingmind.org",
              company_website: "https://problemsolvingmind.org",
              qr_url: intern.certificate?.qr_url || `/api/interns/${intern.intern_id}/qr`,
            });
          })
          .catch((e) => setError(e.message));
      });
  }, [internId]);

  function handlePrint() {
    window.print();
  }

  if (error) {
    return (
      <main className="page">
        <div className="alert error">{error}</div>
        <Link to="/" className="button secondary">Back to Home</Link>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="page">
        <p>Loading Intern ID Card...</p>
      </main>
    );
  }

  return (
    <main className="page id-card-page">
      <div className="no-print" style={{ marginBottom: 20 }}>
        <p className="eyebrow">OFFICIAL CREDENTIAL</p>
        <h1>Intern Identity Card</h1>
        <p className="muted">
          Official identity card and verification pass for {data.full_name} ({data.intern_id}).
        </p>
        <div className="row-actions">
          <button type="button" onClick={() => setFlipped(!flipped)}>
            {flipped ? "Show Front Side" : "Flip to Back Side"}
          </button>
          <button type="button" className="secondary" onClick={handlePrint}>
            Print / Save ID Card
          </button>
          <Link className="button secondary" to={`/intern/${data.intern_id}`}>
            View Profile
          </Link>
          {data.certificate_id && (
            <Link className="button secondary" to={`/certificate/${data.certificate_id}`}>
              View Certificate
            </Link>
          )}
        </div>
      </div>

      <div className="id-card-stage">
        {!flipped ? (
          /* FRONT OF ID CARD */
          <div className="id-card id-card-front">
            <div className="id-card-lanyard-slot" />
            <div className="id-card-header">
              <div className="id-logo-text">PSM</div>
              <div className="id-header-info">
                <h3>{data.company_name || "PROBLEM SOLVING MIND"}</h3>
                <p>INTERN IDENTITY CARD</p>
              </div>
            </div>

            <div className="id-card-body">
              <div className="id-photo-frame">
                {data.photo_url ? (
                  <img
                    src={data.photo_url}
                    alt={data.full_name}
                    className="id-photo"
                  />
                ) : (
                  <div className="id-photo-placeholder">No Photo</div>
                )}
                <div className="id-verified-pill">VERIFIED</div>
              </div>

              <h2 className="id-name">{data.full_name}</h2>
              <div className="id-domain-badge">{data.domain}</div>
              <div className="id-code-badge">ID: {data.intern_id}</div>

              <div className="id-details-grid">
                <div>
                  <span className="id-label">Duration</span>
                  <span className="id-val">{data.duration_label || "6 Months"}</span>
                </div>
                <div>
                  <span className="id-label">Status</span>
                  <span className="id-val">
                    <StatusBadge status={data.status} />
                  </span>
                </div>
              </div>

              <div className="id-qr-section">
                <img
                  src={data.qr_url}
                  alt="Scannable Verification QR"
                  className="id-qr-img"
                />
                <span className="id-qr-caption">SCAN TO VERIFY CREDENTIALS</span>
              </div>
            </div>

            <div className="id-card-footer">
              OFFICIAL INTERN PASS · PROBLEM SOLVING MIND
            </div>
          </div>
        ) : (
          /* BACK OF ID CARD */
          <div className="id-card id-card-back">
            <div className="id-card-lanyard-slot" />
            <div className="id-card-header">
              <div className="id-logo-text">PSM</div>
              <div className="id-header-info">
                <h3>{data.company_name || "PROBLEM SOLVING MIND"}</h3>
                <p>TERMS & VERIFICATION</p>
              </div>
            </div>

            <div className="id-card-body id-back-body">
              <h4>Terms & Conditions</h4>
              <p className="id-terms">
                1. This identification card remains the property of Problem Solving Mind.
              </p>
              <p className="id-terms">
                2. Scanning the front QR code confirms active internship, projects and certificates on the official verification ledger.
              </p>
              <p className="id-terms">
                3. If found, please return to Problem Solving Mind or email the administration below.
              </p>

              <div className="id-back-contact">
                <p><strong>Official Email:</strong> {data.company_email || "hello@problemsolvingmind.org"}</p>
                <p><strong>Website:</strong> {data.company_website || "https://problemsolvingmind.org"}</p>
                {data.company_phone && <p><strong>Phone:</strong> {data.company_phone}</p>}
                <p><strong>Intern Email:</strong> {data.email || "Confidential"}</p>
              </div>

              <div className="id-auth-seal">
                <div className="id-seal-stamp">AUTHORISED ISSUER</div>
                <div className="id-seal-line" />
                <span>Problem Solving Mind Verification Authority</span>
              </div>
            </div>

            <div className="id-card-footer">
              ISSUED BY PROBLEM SOLVING MIND · ALL RIGHTS RESERVED
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

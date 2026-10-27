import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import StatusBadge from "./StatusBadge.jsx";
import { PublicAPI } from "./api.js";

export default function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [interns, setInterns] = useState([]);
  const [contact, setContact] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    PublicAPI.interns()
      .then(setInterns)
      .catch(() => setInterns([]));
    PublicAPI.contact()
      .then(setContact)
      .catch(() => setContact(null));
  }, []);

  function onSearch(event) {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;
    if (value.toUpperCase().includes("CERT") || value.toUpperCase().startsWith("PSM-CERT")) {
      navigate(`/verify?id=${encodeURIComponent(value)}`);
      return;
    }
    navigate(`/intern/${encodeURIComponent(value)}`);
  }

  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">PROBLEM SOLVING MIND</p>
        <h1>Internship Certificate & ID Verification Platform</h1>
        <p>
          Confirm intern identity, project records, mentor evaluation, verified ID card and certificate authenticity
          from a single official PSM portal with live QR scanner support.
        </p>
        <form className="search-row" onSubmit={onSearch}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search intern ID or certificate ID (e.g. PSMI012 or PSM-CERT-PSMI012)"
          />
          <button type="submit">Search</button>
        </form>
        {error && <div className="alert error">{error}</div>}
      </section>

      <section className="grid grid-3" style={{ marginTop: 22 }}>
        <article className="card">
          <h3>Verify Certificates</h3>
          <p className="muted">Look up unique certificate IDs or scan the QR code printed on the document with your camera.</p>
          <Link className="button" to="/verify">Open QR Scanner & Verify</Link>
        </article>
        <article className="card">
          <h3>Intern ID Cards</h3>
          <p className="muted">View official verifiable intern identity badges with portrait photo and embedded security QR.</p>
          <Link className="button secondary" to="/intern/PSMI012/id-card">View Intern ID Card</Link>
        </article>
        <article className="card">
          <h3>{contact?.company_name || "Problem Solving Mind"}</h3>
          <p className="muted">{contact?.about || "Structured internships with verifiable outcomes."}</p>
          <Link to="/contact">Company information</Link>
        </article>
      </section>

      <section className="panel" style={{ marginTop: 22 }}>
        <h2>Intern Directory</h2>
        <p className="muted">Public intern records currently registered with PSM.</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Intern</th>
                <th>Intern ID</th>
                <th>Domain</th>
                <th>Status</th>
                <th>Quick Actions</th>
              </tr>
            </thead>
            <tbody>
              {interns.length === 0 && (
                <tr>
                  <td colSpan="5" className="muted">No published intern records yet.</td>
                </tr>
              )}
              {interns.map((intern) => (
                <tr key={intern.intern_id}>
                  <td>
                    <strong>{intern.full_name}</strong>
                  </td>
                  <td><strong>{intern.intern_id}</strong></td>
                  <td>{intern.domain}</td>
                  <td><StatusBadge status={intern.internship?.status || "Completed"} /></td>
                  <td className="row-actions">
                    <Link className="button secondary" style={{ padding: "6px 12px", fontSize: 13 }} to={`/intern/${intern.intern_id}`}>
                      Profile
                    </Link>
                    <Link className="button secondary" style={{ padding: "6px 12px", fontSize: 13 }} to={`/intern/${intern.intern_id}/id-card`}>
                      ID Card
                    </Link>
                    {intern.certificate && (
                      <Link className="button" style={{ padding: "6px 12px", fontSize: 13 }} to={`/certificate/${intern.certificate.certificate_id}`}>
                        Certificate
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

import { useEffect, useState } from "react";
import { AdminAPI } from "./api.js";

const cards = [
  ["total_interns", "Total interns"],
  ["completed_internships", "Completed internships"],
  ["ongoing_internships", "Ongoing internships"],
  ["certificates_issued", "Certificates issued"],
  ["pending_evaluations", "Pending evaluations"],
  ["revoked_certificates", "Revoked certificates"],
];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    AdminAPI.dashboard()
      .then(setStats)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="alert error">{error}</div>;
  if (!stats) return <p>Loading dashboard...</p>;

  return (
    <>
      <p className="eyebrow">ADMINISTRATION</p>
      <h1>Intern management dashboard</h1>
      <p className="muted">Overview of internships, evaluations and certificates.</p>
      <section className="stats">
        {cards.map(([key, label]) => (
          <article className="stat" key={key}>
            <p>{label}</p>
            <h2>{stats[key]}</h2>
          </article>
        ))}
      </section>
    </>
  );
}

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PublicAPI } from "./api.js";
import InternPublicProfile from "./InternPublicProfile.jsx";

export default function InternProfile() {
  const { internId } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    PublicAPI.verify(internId)
      .then((data) => {
        setProfileData(data);
        setLoading(false);
      })
      .catch((err) => {
        // Fallback to intern endpoint if verify format fails
        PublicAPI.intern(internId)
          .then((intern) => {
            setProfileData({
              valid: intern.certificate?.status === "Valid",
              status: intern.certificate?.status || intern.internship?.status || "Ongoing",
              certificate_id: intern.certificate?.certificate_id,
              certificate: intern.certificate,
              intern: intern,
              project: intern.project,
              evaluation: intern.evaluation,
            });
            setLoading(false);
          })
          .catch((finalErr) => {
            setError(finalErr.message || err.message);
            setLoading(false);
          });
      });
  }, [internId]);

  if (loading) {
    return (
      <main className="page">
        <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <p className="eyebrow">VERIFYING CREDENTIAL</p>
          <h2>Loading Intern Profile...</h2>
          <p className="muted">Retrieving verified academic and project records for {internId}.</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="page">
        <div className="alert error" role="alert">
          <h3>Intern Record Not Found</h3>
          <p>{error}</p>
          <div style={{ marginTop: 12 }}>
            <Link to="/verify" className="button secondary">Search Another ID</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page" style={{ paddingBottom: 60 }}>
      <InternPublicProfile data={profileData} certificateId={profileData?.certificate_id || internId} />
    </main>
  );
}

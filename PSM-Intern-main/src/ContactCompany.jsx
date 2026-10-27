import { useEffect, useState } from "react";
import { PublicAPI } from "./api.js";

export default function ContactCompany() {
  const [contact, setContact] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    PublicAPI.contact()
      .then(setContact)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <main className="page"><div className="alert error">{error}</div></main>;
  if (!contact) return <main className="page"><p>Loading company information...</p></main>;

  return (
    <main className="page">
      <section className="card">
        <p className="eyebrow">CONTACT COMPANY</p>
        <h1>{contact.company_name}</h1>
        <p>{contact.tagline}</p>
        <p>{contact.about}</p>
        <p><strong>Official email:</strong> <a href={`mailto:${contact.official_email}`}>{contact.official_email}</a></p>
        <p><strong>Phone:</strong> {contact.phone || "Not published"}</p>
        <p><strong>Website:</strong> {contact.website ? <a href={contact.website} target="_blank" rel="noreferrer">{contact.website}</a> : "Not published"}</p>
        <p><strong>Address:</strong> {contact.address}</p>
      </section>
    </main>
  );
}

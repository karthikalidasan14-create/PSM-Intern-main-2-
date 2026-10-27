import { useEffect, useState } from "react";
import { AdminAPI, AuthAPI, PublicAPI } from "./api.js";

export default function AdminSettings() {
  const [profile, setProfile] = useState({ name: "", email: "" });
  const [company, setCompany] = useState({
    company_name: "",
    tagline: "",
    official_email: "",
    phone: "",
    website: "",
    address: "",
    about: "",
  });
  const [passwords, setPasswords] = useState({ current_password: "", new_password: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    AdminAPI.profile().then(setProfile).catch((err) => setError(err.message));
    PublicAPI.contact().then(setCompany).catch((err) => setError(err.message));
  }, []);

  return (
    <>
      <h1>Admin profile and settings</h1>
      <section className="panel">
        <h2>Admin information</h2>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            try {
              const updated = await AdminAPI.updateProfile(profile);
              setProfile(updated);
              setMessage("Profile updated.");
            } catch (err) {
              setError(err.message);
            }
          }}
        >
          <label>Name</label>
          <input value={profile.name || ""} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
          <label>Email</label>
          <input type="email" value={profile.email || ""} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
          <button type="submit">Save profile</button>
        </form>
      </section>

      <section className="panel">
        <h2>Change password</h2>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            try {
              await AuthAPI.changePassword(passwords);
              setMessage("Password changed.");
              setPasswords({ current_password: "", new_password: "" });
            } catch (err) {
              setError(err.message);
            }
          }}
        >
          <label>Current password</label>
          <input type="password" value={passwords.current_password} onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })} />
          <label>New password</label>
          <input type="password" value={passwords.new_password} onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })} />
          <button type="submit">Update password</button>
        </form>
      </section>

      <section className="panel">
        <h2>Company information</h2>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            try {
              const updated = await AdminAPI.updateContact(company);
              setCompany(updated);
              setMessage("Company contact details updated.");
            } catch (err) {
              setError(err.message);
            }
          }}
        >
          <label>Company name</label>
          <input value={company.company_name || ""} onChange={(e) => setCompany({ ...company, company_name: e.target.value })} />
          <label>Official email</label>
          <input value={company.official_email || ""} onChange={(e) => setCompany({ ...company, official_email: e.target.value })} />
          <label>Phone</label>
          <input value={company.phone || ""} onChange={(e) => setCompany({ ...company, phone: e.target.value })} />
          <label>Website</label>
          <input value={company.website || ""} onChange={(e) => setCompany({ ...company, website: e.target.value })} />
          <label>Address</label>
          <input value={company.address || ""} onChange={(e) => setCompany({ ...company, address: e.target.value })} />
          <label>About</label>
          <textarea value={company.about || ""} onChange={(e) => setCompany({ ...company, about: e.target.value })} />
          {message && <div className="alert ok">{message}</div>}
          {error && <div className="alert error">{error}</div>}
          <button type="submit">Save company details</button>
        </form>
      </section>
    </>
  );
}

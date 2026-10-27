import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthAPI } from "./api.js";
import { useAuth } from "./AuthContext.jsx";

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@problemsolvingmind.org");
  const [password, setPassword] = useState("Admin@123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await AuthAPI.login(email, password);
      login(data.access_token || data.token, data.user || { name: data.name, role: data.role });
      navigate("/admin");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page" style={{ maxWidth: 480 }}>
      <section className="card">
        <p className="eyebrow">ADMINISTRATION</p>
        <h1>Admin login</h1>
        <p className="muted">Secure access for PSM administrators and mentors.</p>
        <form onSubmit={onSubmit}>
          <label htmlFor="adminEmail">Email</label>
          <input id="adminEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <label htmlFor="adminPassword">Password</label>
          <input id="adminPassword" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <div className="alert error">{error}</div>}
          <button type="submit" disabled={loading}>{loading ? "Signing in..." : "Login"}</button>
        </form>
      </section>
    </main>
  );
}

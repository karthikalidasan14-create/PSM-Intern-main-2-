import { Navigate, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";

const links = [
  ["/admin", "Dashboard"],
  ["/admin/interns", "Interns"],
  ["/admin/projects", "Projects"],
  ["/admin/evaluations", "Evaluations"],
  ["/admin/certificates", "Certificates"],
  ["/admin/settings", "Settings"],
];

export default function AdminLayout() {
  const { user, logout, isStaff } = useAuth();
  const navigate = useNavigate();

  if (!isStaff) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="admin-shell">
      <aside className="side">
        <NavLink className="brand" to="/admin">
          PSM <span>Admin</span>
        </NavLink>
        <p className="muted" style={{ color: "#9fb6d9" }}>
          {user?.name} · {user?.role}
        </p>
        {links.map(([to, label]) => (
          <NavLink key={to} to={to} end={to === "/admin"}>
            {label}
          </NavLink>
        ))}
        <NavLink to="/">Public site</NavLink>
        <button
          className="secondary"
          style={{ marginTop: 16, width: "100%" }}
          onClick={() => {
            logout();
            navigate("/admin/login");
          }}
        >
          Sign out
        </button>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}

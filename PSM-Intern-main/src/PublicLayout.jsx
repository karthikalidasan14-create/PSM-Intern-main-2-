import { NavLink, Outlet } from "react-router-dom";

export default function PublicLayout() {
  return (
    <>
      <header className="nav">
        <NavLink className="brand" to="/">
          PSM <span>Intern Portal</span>
        </NavLink>
        <nav className="nav-links">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/verify">Verify</NavLink>
          <NavLink to="/certificate">Certificate</NavLink>
          <NavLink to="/intern/PSM001/id-card">ID Card</NavLink>
          <NavLink to="/contact">Contact</NavLink>
          <NavLink to="/admin/login">Admin</NavLink>
        </nav>
      </header>
      <Outlet />
      <footer>© 2026 Problem Solving Mind (PSM) · Verification & Credential Platform</footer>
    </>
  );
}

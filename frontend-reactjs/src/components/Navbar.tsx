import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { NavLink, useNavigate } from "react-router-dom";
import { logout } from "../redux/slices/authSlice";
import type { RootState } from "../redux/store";
import "./css/Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [menuOpen, setMenuOpen] = useState(false);

  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );
  const user = useSelector((state: RootState) => state.auth.user);
  const role = useSelector((state: RootState) => state.auth.user?.role);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <nav className="navbar">
      {/* Left: Logo */}
      <div className="navbar__left">
        <NavLink to="/">
          <img
            src="src/assets/mirafraLogo.svg"
            alt="Logo"
            className="navbar__logo"
          />
        </NavLink>
      </div>

      {/* Mobile menu toggle */}
      <div className="navbar__toggle" onClick={() => setMenuOpen(!menuOpen)}>
        ☰
      </div>

      {/* Center: Links */}
      <div className={`navbar__center ${menuOpen ? "open" : ""}`}>
        <ul className="navbar__links">
          {isAuthenticated && role === "super admin" && (
            <li>
              <NavLink
                to="/all-users"
                className={({ isActive }) => (isActive ? "active-link" : "")}
              >
                All Users
              </NavLink>
            </li>
          )}
          {isAuthenticated && role === "super admin" && (
            <li>
              <NavLink
                to="/add-users"
                className={({ isActive }) => (isActive ? "active-link" : "")}
              >
                Add Users
              </NavLink>
            </li>
          )}
          {isAuthenticated &&
            (role === "super admin" || role === "talent acquisition") && (
              <li>
                <NavLink
                  to="/send-test"
                  className={({ isActive }) => (isActive ? "active-link" : "")}
                >
                  Send Test
                </NavLink>
              </li>
            )}
          {isAuthenticated &&
            (role === "super admin" ||
              role === "talent acquisition" ||
              role === "manager") && (
              <li>
                <NavLink
                  to="/jobs"
                  className={({ isActive }) => (isActive ? "active-link" : "")}
                >
                  Jobs
                </NavLink>
              </li>
            )}
          {isAuthenticated &&
            (role === "manager" || role === "super admin") && (
              <li>
                <NavLink
                  to="/add-questions"
                  className={({ isActive }) => (isActive ? "active-link" : "")}
                >
                  Add Questions
                </NavLink>
              </li>
            )}
          {isAuthenticated &&
            (role === "super admin" ||
              role === "talent acquisition" ||
              role === "manager") && (
              <li>
                <NavLink
                  to="/view-questions"
                  className={({ isActive }) => (isActive ? "active-link" : "")}
                >
                  View Questions
                </NavLink>
              </li>
            )}
          {isAuthenticated &&
            (role === "super admin" ||
              role === "talent acquisition" ||
              role === "manager") && (
              <li>
                <NavLink
                  to="/results"
                  className={({ isActive }) => (isActive ? "active-link" : "")}
                >
                  Results
                </NavLink>
              </li>
            )}
        </ul>
      </div>

      {/* Right: User + Logout/Login */}
      <div className="navbar__right">
        {isAuthenticated ? (
          <>
            <span className="navbar__user">{user?.name}</span>
            <button className="btn" onClick={handleLogout}>
              Log out
            </button>
          </>
        ) : (
          <NavLink to="/login" className="btn">
            Log in
          </NavLink>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

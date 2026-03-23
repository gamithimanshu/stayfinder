import { Link } from "react-router-dom";
import { useAuth } from "../store/auth-context.js";
import "./Navbar.css";

export function Navbar() {
  const { user, token } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">PG and Hostel Finder</Link>
        <ul className="navbar-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/listings">Listings</Link></li>
          <li><Link to="/add-listing">Add Listing</Link></li>
          <li><Link to="/about">About</Link></li>
          <li><Link to="/contact">Contact</Link></li>
          {token ? (
            <>
              <li><span className="navbar-user">Hi, {user?.username || user?.name || "User"}</span></li>
              <li><Link to="/logout" className="navbar-btn">Logout</Link></li>
            </>
          ) : (
            <>
              <li><Link to="/register" className="navbar-btn">Register</Link></li>
              <li><Link to="/login" className="navbar-btn">Login</Link></li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}

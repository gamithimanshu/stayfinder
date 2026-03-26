import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Heart, Home, Menu, Search, UserRound, X } from "lucide-react";
import { useAuth } from "../store/auth-context.js";
import { cn } from "../utils/cn";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, token } = useAuth();
  const isAdmin = user?.role === "admin" || Boolean(user?.isAdmin);
  const isOwner = user?.role === "owner";

  const links = [
    { to: "/", label: "Home", icon: Home },
    { to: "/listings", label: "Search PG", icon: Search },
    { to: "/about", label: "About" },
    { to: "/contact", label: "Contact" },
  ];

  const baseLink =
    "relative inline-flex items-center rounded-full px-4 py-2 text-sm font-medium text-ink-500 transition hover:bg-white hover:text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fcfaf4]";

  const navClass = ({ isActive }) =>
    isActive
      ? cn(
          baseLink,
          "bg-brand-50 text-brand-800 pl-10 pr-4",
          "before:content-[''] before:absolute before:left-4 before:top-1/2 before:h-2 before:w-2 before:-translate-y-1/2 before:rounded-full before:bg-brand-600"
        )
      : baseLink;

  const safeLinks = Array.isArray(links) ? links : [];

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-[#fcfaf4]/85 backdrop-blur-xl">
      <div className="page-shell flex h-[4.5rem] items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="gradient-primary flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-[0_18px_34px_-20px_rgba(15,116,88,0.95)]">
            <Home size={20} />
          </div>
          <div>
            <p className="text-lg font-bold text-ink-900" style={{ fontFamily: "var(--font-display)" }}>
              Stay<span className="text-brand-600">Finder</span>
            </p>
            <p className="text-xs uppercase tracking-[0.24em] text-ink-400">Verified City Stays</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 rounded-full border border-black/5 bg-white/70 p-1.5 lg:flex">
          {safeLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={navClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {token ? (
            <>
              <Link to="/wishlist" className="flex h-11 w-11 items-center justify-center rounded-full border border-black/5 bg-white/80 text-ink-600 transition hover:text-brand-700">
                <Heart size={18} />
              </Link>
              <Link to="/profile" className="flex h-11 w-11 items-center justify-center rounded-full border border-black/5 bg-white/80 text-ink-600 transition hover:text-brand-700">
                <UserRound size={18} />
              </Link>
              {isOwner ? <Link to="/owner" className="btn-secondary">Owner Panel</Link> : null}
              {isAdmin ? <Link to="/admin" className="btn-secondary">Admin Panel</Link> : null}
              <Link to="/logout" className="btn-primary">Logout</Link>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary">Log In</Link>
              <Link to="/register" className="btn-primary">Sign Up</Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-black/5 bg-white/80 text-ink-700 lg:hidden"
          onClick={() => setMobileOpen((current) => !current)}
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-black/5 bg-[#fcfaf4] lg:hidden">
          <div className="page-shell flex flex-col gap-3 py-4">
            {safeLinks.map((link) => (
              <NavLink key={link.to} to={link.to} className={navClass} onClick={() => setMobileOpen(false)}>
                {link.label}
              </NavLink>
            ))}

            {token ? (
              <>
                <Link to="/wishlist" className={baseLink} onClick={() => setMobileOpen(false)}>Wishlist</Link>
                <Link to="/profile" className={baseLink} onClick={() => setMobileOpen(false)}>Profile</Link>
                {isOwner ? <Link to="/owner" className={baseLink} onClick={() => setMobileOpen(false)}>Owner Panel</Link> : null}
                {isOwner ? <Link to="/owner/add" className={baseLink} onClick={() => setMobileOpen(false)}>Add PG</Link> : null}
                {isOwner ? <Link to="/owner/manage" className={baseLink} onClick={() => setMobileOpen(false)}>Manage PGs</Link> : null}
                {isAdmin ? <Link to="/admin" className={baseLink} onClick={() => setMobileOpen(false)}>Admin Panel</Link> : null}
                {isAdmin ? <Link to="/admin/approve" className={baseLink} onClick={() => setMobileOpen(false)}>Approve PG</Link> : null}
                {isAdmin ? <Link to="/admin/users" className={baseLink} onClick={() => setMobileOpen(false)}>Users</Link> : null}
                <Link to="/logout" className="btn-primary mt-1" onClick={() => setMobileOpen(false)}>Logout</Link>
              </>
            ) : (
              <div className="flex gap-3 pt-1">
                <Link to="/login" className="btn-secondary flex-1" onClick={() => setMobileOpen(false)}>Log In</Link>
                <Link to="/register" className="btn-primary flex-1" onClick={() => setMobileOpen(false)}>Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}

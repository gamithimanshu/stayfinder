import { Link } from "react-router-dom";
import { Home, Mail, MapPin, Phone } from "lucide-react";

export const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-black/5 bg-ink-900 text-white">
      <div className="page-shell py-14">
        <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="gradient-primary flex h-11 w-11 items-center justify-center rounded-xl text-white">
                <Home size={20} />
              </div>
              <div>
                <p className="text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>
                  Stay<span className="text-brand-400">Finder</span>
                </p>
                <p className="text-xs uppercase tracking-[0.24em] text-white/40">Trusted PG Discovery</p>
              </div>
            </Link>
            <p className="max-w-sm text-sm leading-7 text-white/65">
              Discover verified PGs and hostels, compare options with confidence, and move from search to booking in one place.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-white/50">Quick Links</h3>
            <div className="mt-5 space-y-3 text-sm text-white/70">
              <Link to="/" className="block transition hover:text-brand-300">Home</Link>
              <Link to="/listings" className="block transition hover:text-brand-300">Search PG</Link>
              <Link to="/about" className="block transition hover:text-brand-300">About</Link>
              <Link to="/contact" className="block transition hover:text-brand-300">Contact</Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-white/50">For Owners</h3>
            <div className="mt-5 space-y-3 text-sm text-white/70">
              <Link to="/owner/add" className="block transition hover:text-brand-300">List Your PG</Link>
              <Link to="/owner/manage" className="block transition hover:text-brand-300">Manage Listings</Link>
              <Link to="/register" className="block transition hover:text-brand-300">Create Account</Link>
              <Link to="/login" className="block transition hover:text-brand-300">Owner Login</Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-white/50">Contact</h3>
            <div className="mt-5 space-y-4 text-sm text-white/70">
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-brand-300" />
                support@stayfinder.com
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-brand-300" />
                +91 6355500916
              </div>
              <div className="flex items-center gap-3">
                <MapPin size={16} className="text-brand-300" />
                Vyara, India
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-sm text-white/40">
          &copy; {year} StayFinder. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

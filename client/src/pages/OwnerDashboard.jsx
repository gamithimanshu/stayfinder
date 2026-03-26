import { createElement, useEffect, useMemo, useState } from "react";
import { Building2, CalendarRange, CheckCircle2, Clock3, DoorOpen, PlusCircle, Search } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth-context";
import { API } from "../utils/api";
import { PageSection, PageShell, SurfaceCard } from "../components/ui.jsx";

export function OwnerDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user } = useAuth();
  const isOwner = user?.role === "owner" || user?.role === "admin" || Boolean(user?.isAdmin);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    stats: { totalPgs: 0, totalBookings: 0, totalAvailableRooms: 0, pendingPgs: 0, approvedPgs: 0 },
    recentPgs: [],
    recentBookings: [],
  });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true, state: { from: location.pathname } });
      return;
    }

    if (user && !isOwner) {
      navigate("/", { replace: true });
    }
  }, [isOwner, location.pathname, navigate, token, user]);

  useEffect(() => {
    if (!token || !isOwner) return;

    let cancelled = false;

    const loadDashboard = async () => {
      try {
        const { data: result } = await API.get("/owner/dashboard");

        if (!cancelled) {
          setData(result);
        }
      } catch {
        if (!cancelled) {
          setData({
            stats: { totalPgs: 0, totalBookings: 0, totalAvailableRooms: 0, pendingPgs: 0, approvedPgs: 0 },
            recentPgs: [],
            recentBookings: [],
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [isOwner, token]);

  const filteredPgs = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return data.recentPgs;

    return data.recentPgs.filter((pg) =>
      [pg.title, pg.city, pg.area, pg.address, pg.location]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [data.recentPgs, searchTerm]);

  const filteredBookings = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return data.recentBookings;

    return data.recentBookings.filter((booking) =>
      [booking.pg?.title, booking.user?.username, booking.user?.name, booking.user?.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [data.recentBookings, searchTerm]);

  if (!token || !isOwner) return null;

  if (loading) {
    return <PageSection><PageShell><SurfaceCard className="p-10 text-center text-ink-500">Loading owner dashboard...</SurfaceCard></PageShell></PageSection>;
  }

  return (
    <PageSection className="pt-8 sm:pt-12">
      <PageShell className="space-y-8">
        <div className="rounded-[2rem] bg-gradient-to-br from-slate-50 via-sky-50 to-cyan-100 p-6 shadow-[0_32px_90px_-48px_rgba(14,116,144,0.35)] sm:p-8 lg:p-10">
          <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-700">Owner dashboard</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-800" style={{ fontFamily: "var(--font-display)" }}>
                Property Resource Dashboard
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
                Live overview of your listings, booking activity, approval progress, and available room capacity.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search listing or resident"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 shadow-sm outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-500/20 sm:w-80"
                />
              </label>
              <Link to="/owner/add" className="rounded-xl bg-cyan-600 px-6 py-3 text-center text-sm font-medium text-white shadow-md transition hover:bg-cyan-700">
                <span className="inline-flex items-center gap-2"><PlusCircle size={16} />Add PG</span>
              </Link>
              <Link to="/owner/manage" className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-center text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
                Manage PGs
              </Link>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
            {[
              { label: "Total PGs", value: data.stats.totalPgs, accent: "bg-sky-100 text-sky-600", icon: Building2 },
              { label: "Bookings", value: data.stats.totalBookings, accent: "bg-indigo-100 text-indigo-600", icon: CalendarRange },
              { label: "Available Rooms", value: data.stats.totalAvailableRooms, accent: "bg-cyan-100 text-cyan-600", icon: DoorOpen },
              { label: "Pending Approval", value: data.stats.pendingPgs, accent: "bg-amber-100 text-amber-600", icon: Clock3 },
              { label: "Approved", value: data.stats.approvedPgs, accent: "bg-emerald-100 text-emerald-600", icon: CheckCircle2 },
            ].map(({ label, value, accent, icon }) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-800">{value}</p>
                  </div>
                  <div className={`rounded-2xl p-3 ${accent}`}>
                    {createElement(icon, { size: 20 })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-xl">
          <div className="flex flex-col gap-3 border-b bg-slate-50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div>
              <p className="text-sm font-medium text-slate-600">Your latest listings</p>
              <p className="mt-1 text-xs text-slate-500">Showing {filteredPgs.length} of {data.recentPgs.length} listings</p>
            </div>
            <Link to="/owner/manage" className="text-sm font-medium text-cyan-700 hover:text-cyan-800">
              Open listing manager
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="px-6 py-4 sm:px-8">Listing</th>
                  <th className="px-6 py-4 sm:px-8">Location</th>
                  <th className="px-6 py-4 sm:px-8">Price</th>
                  <th className="px-6 py-4 sm:px-8">Rooms</th>
                  <th className="px-6 py-4 text-right sm:px-8">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPgs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-10 text-center text-sm text-slate-500 sm:px-8">
                      No PGs yet. Add your first one to get started.
                    </td>
                  </tr>
                ) : (
                  filteredPgs.map((pg) => (
                    <tr key={pg._id} className="transition hover:bg-cyan-50/60">
                      <td className="px-6 py-5 sm:px-8">
                        <p className="font-semibold text-slate-800">{pg.title}</p>
                        <p className="mt-1 text-xs text-slate-500">{new Date(pg.createdAt).toLocaleDateString()}</p>
                      </td>
                      <td className="px-6 py-5 text-slate-600 sm:px-8">{pg.location || pg.address || [pg.area, pg.city].filter(Boolean).join(", ")}</td>
                      <td className="px-6 py-5 text-slate-600 sm:px-8">Rs. {Number(pg.price || 0).toLocaleString()}</td>
                      <td className="px-6 py-5 text-slate-600 sm:px-8">{pg.availableRooms ?? 0} available</td>
                      <td className="px-6 py-5 text-right sm:px-8">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                          pg.isApproved ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                        }`}>
                          {pg.isApproved ? "Approved" : "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-xl">
          <div className="flex flex-col gap-3 border-b bg-slate-50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div>
              <p className="text-sm font-medium text-slate-600">Latest resident activity</p>
              <p className="mt-1 text-xs text-slate-500">Showing {filteredBookings.length} of {data.recentBookings.length} bookings</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="px-6 py-4 sm:px-8">Resident</th>
                  <th className="px-6 py-4 sm:px-8">Listing</th>
                  <th className="px-6 py-4 sm:px-8">Contact</th>
                  <th className="px-6 py-4 sm:px-8">Move-In Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-10 text-center text-sm text-slate-500 sm:px-8">
                      No bookings yet. They will appear here automatically.
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((booking) => (
                    <tr key={booking._id} className="transition hover:bg-cyan-50/60">
                      <td className="px-6 py-5 sm:px-8">
                        <p className="font-semibold text-slate-800">{booking.user?.username || booking.user?.name || "Resident"}</p>
                      </td>
                      <td className="px-6 py-5 text-slate-600 sm:px-8">{booking.pg?.title || "PG not available"}</td>
                      <td className="px-6 py-5 text-slate-600 sm:px-8">{booking.user?.phone || booking.user?.email || "No contact info"}</td>
                      <td className="px-6 py-5 text-slate-600 sm:px-8">{new Date(booking.checkInDate).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </PageShell>
    </PageSection>
  );
}

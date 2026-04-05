import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth-context";
import { API } from "../utils/api";
import { DashboardLayout } from "../components/DashboardLayout.jsx";
import { InfoBanner, SurfaceCard } from "../components/ui.jsx";
import { formatDashboardCurrency } from "../components/dashboard/dashboardFormatters.js";

const toArray = (value) => (Array.isArray(value) ? value : []);

const formatDate = (value, options = {}) => {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  }).format(date);
};

const bookingTone = (status) => {
  if (status === "confirmed") return "bg-sky-100 text-sky-700";
  if (status === "cancelled") return "bg-rose-100 text-rose-700";
  return "bg-amber-100 text-amber-700";
};

const paymentTone = (status) => {
  if (status === "paid") return "bg-emerald-100 text-emerald-700";
  if (status === "failed") return "bg-rose-100 text-rose-700";
  return "bg-amber-100 text-amber-700";
};

export function AdminBookings() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user } = useAuth();
  const isAdmin = user?.role === "admin" || Boolean(user?.isAdmin);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true, state: { from: location.pathname } });
      return;
    }

    if (user && !isAdmin) {
      navigate("/", { replace: true });
    }
  }, [isAdmin, location.pathname, navigate, token, user]);

  useEffect(() => {
    if (!token || !isAdmin) return;

    let cancelled = false;

    const loadBookings = async () => {
      setLoading(true);
      try {
        const { data } = await API.get("/admin/bookings");
        if (!cancelled) {
          setBookings(toArray(data?.bookings));
          setMessage("");
        }
      } catch (error) {
        if (!cancelled) {
          setMessageType("error");
          setMessage(error?.response?.data?.message || "Unable to load admin bookings");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadBookings();

    return () => {
      cancelled = true;
    };
  }, [isAdmin, token]);

  const filteredBookings = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return toArray(bookings).filter((booking) => {
      if (statusFilter !== "all" && booking?.bookingStatus !== statusFilter) {
        return false;
      }

      if (!term) {
        return true;
      }

      return [
        booking?.user?.name,
        booking?.user?.email,
        booking?.user?.phone,
        booking?.pg?.title,
        booking?.bookingStatus,
        booking?.paymentStatus,
        booking?.paymentMethod,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [bookings, searchTerm, statusFilter]);

  const updateStatus = async (bookingId, bookingStatus) => {
    setUpdatingId(bookingId);
    setMessage("");

    try {
      const { data } = await API.patch(`/admin/bookings/${bookingId}/status`, { bookingStatus });

      setBookings((current) =>
        toArray(current).map((booking) =>
          booking._id === bookingId
            ? {
                ...booking,
                bookingStatus: data?.booking?.bookingStatus ?? bookingStatus,
                paymentStatus: data?.booking?.paymentStatus ?? booking.paymentStatus,
              }
            : booking
        )
      );
      setMessageType("success");
      setMessage(data?.message || "Booking updated successfully");
    } catch (error) {
      setMessageType("error");
      setMessage(error?.response?.data?.message || "Unable to update booking");
    } finally {
      setUpdatingId("");
    }
  };

  if (!token || !isAdmin) return null;

  if (loading) {
    return (
      <DashboardLayout
        role="admin"
        kicker="Admin workspace"
        title="Manage Bookings"
        description="Loading booking actions..."
      >
        <SurfaceCard className="rounded-xl border border-black/5 bg-white/85 p-10 text-center text-slate-500">
          Loading admin bookings...
        </SurfaceCard>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role="admin"
      kicker="Admin workspace"
      title="Manage Bookings"
      description="Review resident bookings and move them between pending, confirmed, and cancelled from one place."
    >
      {message ? <InfoBanner tone={messageType === "error" ? "error" : "success"}>{message}</InfoBanner> : null}

      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <label className="relative block w-full lg:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search resident, listing, payment, or status"
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          {["all", "pending", "confirmed", "cancelled"].map((status) => (
            <button
              key={status}
              type="button"
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                statusFilter === status
                  ? "bg-sky-100 text-sky-800"
                  : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
              onClick={() => setStatusFilter(status)}
            >
              {status === "all" ? "All" : status[0].toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Pending", value: toArray(bookings).filter((booking) => booking?.bookingStatus === "pending").length, accent: "bg-amber-100 text-amber-700" },
          { label: "Confirmed", value: toArray(bookings).filter((booking) => booking?.bookingStatus === "confirmed").length, accent: "bg-sky-100 text-sky-700" },
          { label: "Cancelled", value: toArray(bookings).filter((booking) => booking?.bookingStatus === "cancelled").length, accent: "bg-rose-100 text-rose-700" },
        ].map((item) => (
          <SurfaceCard key={item.label} className="rounded-xl border border-black/5 bg-white/90 p-6 shadow-sm">
            <p className="text-sm text-slate-500">{item.label} Bookings</p>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-3xl font-semibold text-slate-900">{item.value}</p>
              <span className={`rounded-xl px-3 py-1 text-xs font-semibold ${item.accent}`}>{item.label}</span>
            </div>
          </SurfaceCard>
        ))}
      </div>

      <div className="min-w-0 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-xl">
        <div className="flex flex-col gap-3 border-b bg-slate-50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <p className="text-sm font-medium text-slate-700">Booking queue</p>
            <p className="mt-1 text-xs text-slate-500">Showing {filteredBookings.length} of {toArray(bookings).length} bookings</p>
          </div>
        </div>

        <div className="max-w-full overflow-x-auto">
          <table className="min-w-[860px] w-full text-sm">
            <thead className="bg-slate-100 text-left text-xs uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="px-6 py-4 sm:px-8">Resident</th>
                <th className="px-6 py-4 sm:px-8">Listing</th>
                <th className="px-6 py-4 sm:px-8">Check-in</th>
                <th className="px-6 py-4 sm:px-8">Amount</th>
                <th className="px-6 py-4 sm:px-8">Payment</th>
                <th className="px-6 py-4 sm:px-8">Booking</th>
                <th className="w-[10rem] px-6 py-4 sm:px-8">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-sm text-slate-500 sm:px-8">
                    No bookings match the current filters.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr key={booking._id} className="transition hover:bg-indigo-50/50">
                    <td className="px-6 py-5 sm:px-8">
                      <p className="font-semibold text-slate-800">{booking.user?.name || "Resident"}</p>
                      <p className="mt-1 text-xs text-slate-500">{booking.user?.email || booking.user?.phone || "No contact info"}</p>
                    </td>
                    <td className="px-6 py-5 text-slate-600 sm:px-8">
                      <p className="font-medium text-slate-800">{booking.pg?.title || "PG not available"}</p>
                      <p className="mt-1 text-xs text-slate-500">{[booking.pg?.area, booking.pg?.city].filter(Boolean).join(", ") || "Location not added"}</p>
                    </td>
                    <td className="px-6 py-5 text-slate-600 sm:px-8">{formatDate(booking.checkInDate)}</td>
                    <td className="px-6 py-5 text-slate-600 sm:px-8">{formatDashboardCurrency(booking.totalAmount)}</td>
                    <td className="px-6 py-5 sm:px-8">
                      <span className={`inline-flex rounded-xl px-3 py-1 text-xs font-medium ${paymentTone(booking.paymentStatus)}`}>
                        {booking.paymentStatus || "pending"}
                      </span>
                    </td>
                    <td className="px-6 py-5 sm:px-8">
                      <span className={`inline-flex rounded-xl px-3 py-1 text-xs font-medium ${bookingTone(booking.bookingStatus)}`}>
                        {booking.bookingStatus || "pending"}
                      </span>
                    </td>
                    <td className="px-6 py-5 sm:px-8">
                      <div className="flex min-w-[8.5rem] flex-col gap-2">
                        <button
                          type="button"
                          className="w-full rounded-xl bg-sky-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                          onClick={() => updateStatus(booking._id, "confirmed")}
                          disabled={updatingId === booking._id || booking.bookingStatus === "confirmed"}
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          className="w-full rounded-xl bg-amber-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                          onClick={() => updateStatus(booking._id, "pending")}
                          disabled={updatingId === booking._id || booking.bookingStatus === "pending"}
                        >
                          Pending
                        </button>
                        <button
                          type="button"
                          className="w-full rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                          onClick={() => updateStatus(booking._id, "cancelled")}
                          disabled={updatingId === booking._id || booking.bookingStatus === "cancelled"}
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}



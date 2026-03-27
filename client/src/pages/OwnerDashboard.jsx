import { useEffect } from "react";
import { Building2, CalendarRange, CheckCircle2, Clock3, Coins, DoorOpen } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth-context";
import { DashboardLayout } from "../components/DashboardLayout.jsx";
import { AnimatedStatCard } from "../components/dashboard/AnimatedStatCard.jsx";
import {
  DonutChartCard,
  MultiBarChartCard,
  TrendChartCard,
} from "../components/dashboard/DashboardCharts.jsx";
import { formatDashboardCount, formatDashboardCurrency } from "../components/dashboard/dashboardFormatters.js";
import { InfoBanner, SurfaceCard } from "../components/ui.jsx";
import { useDashboardData } from "../hooks/useDashboardData.js";

const emptyChart = { labels: [], datasets: [], points: [] };

const emptyDashboard = {
  stats: {
    totalPgs: 0,
    totalBookings: 0,
    confirmedBookings: 0,
    pendingBookingStatusCount: 0,
    activeBookings: 0,
    cancelledBookings: 0,
    totalAvailableRooms: 0,
    pendingPgs: 0,
    approvedPgs: 0,
    totalRevenue: 0,
    paidEarnings: 0,
    pendingEarnings: 0,
    failedRevenue: 0,
    paidBookings: 0,
    pendingBookings: 0,
  },
  charts: {
    monthlyRevenue: emptyChart,
    bookingTrends: emptyChart,
    revenueBreakdown: emptyChart,
    approvalBreakdown: emptyChart,
  },
  topHostels: [],
  recentTransactions: [],
  recentPgs: [],
};

const toArray = (value) => (Array.isArray(value) ? value : []);
const safeNumber = (value) => {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
};

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

const formatDateTime = (value) => formatDate(value, { hour: "numeric", minute: "2-digit" });

const statusPillClass = (status, tone = "payment") => {
  if (tone === "approval") {
    return status ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700";
  }

  if (status === "paid") return "bg-emerald-100 text-emerald-700";
  if (status === "failed") return "bg-rose-100 text-rose-700";
  if (status === "cancelled") return "bg-rose-100 text-rose-700";
  return "bg-amber-100 text-amber-700";
};

function normalizeDashboard(result) {
  return {
    stats: {
      totalPgs: safeNumber(result?.stats?.totalPgs),
      totalBookings: safeNumber(result?.stats?.totalBookings),
      confirmedBookings: safeNumber(result?.stats?.confirmedBookings),
      pendingBookingStatusCount: safeNumber(result?.stats?.pendingBookingStatusCount),
      activeBookings: safeNumber(result?.stats?.activeBookings),
      cancelledBookings: safeNumber(result?.stats?.cancelledBookings),
      totalAvailableRooms: safeNumber(result?.stats?.totalAvailableRooms),
      pendingPgs: safeNumber(result?.stats?.pendingPgs),
      approvedPgs: safeNumber(result?.stats?.approvedPgs),
      totalRevenue: safeNumber(result?.stats?.totalRevenue),
      paidEarnings: safeNumber(result?.stats?.paidEarnings),
      pendingEarnings: safeNumber(result?.stats?.pendingEarnings),
      failedRevenue: safeNumber(result?.stats?.failedRevenue),
      paidBookings: safeNumber(result?.stats?.paidBookings),
      pendingBookings: safeNumber(result?.stats?.pendingBookings),
    },
    charts: {
      monthlyRevenue: result?.charts?.monthlyRevenue ?? emptyChart,
      bookingTrends: result?.charts?.bookingTrends ?? emptyChart,
      revenueBreakdown: result?.charts?.revenueBreakdown ?? emptyChart,
      approvalBreakdown: result?.charts?.approvalBreakdown ?? emptyChart,
    },
    topHostels: toArray(result?.topHostels),
    recentTransactions: toArray(result?.recentTransactions),
    recentPgs: toArray(result?.recentPgs),
  };
}

export function OwnerDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user } = useAuth();
  const isOwner = user?.role === "owner" || user?.role === "admin" || Boolean(user?.isAdmin);

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true, state: { from: location.pathname } });
      return;
    }

    if (user && !isOwner) {
      navigate("/", { replace: true });
    }
  }, [isOwner, location.pathname, navigate, token, user]);

  const { data, error, loading, refreshing, lastUpdatedAt } = useDashboardData({
    endpoint: "/owner/dashboard",
    enabled: Boolean(token && isOwner),
    initialData: emptyDashboard,
    normalize: normalizeDashboard,
    fallbackMessage: "Unable to load owner dashboard right now.",
  });

  if (!token || !isOwner) return null;

  if (loading) {
    return (
      <DashboardLayout
        role="owner"
        kicker="Owner workspace"
        title="Property Resource Dashboard"
        description="Loading your property analytics..."
        actions={
          <>
            <Link to="/owner/add" className="btn-primary">Add PG</Link>
            <Link to="/owner/manage" className="btn-secondary">Manage PGs</Link>
          </>
        }
      >
        <SurfaceCard className="rounded-3xl border border-black/5 bg-white/85 p-10 text-center text-ink-500">
          Loading owner dashboard...
        </SurfaceCard>
      </DashboardLayout>
    );
  }

  const stats = data.stats;

  return (
    <DashboardLayout
      role="owner"
      kicker="Owner workspace"
      title="Property Resource Dashboard"
      description="Live overview of listings, booking activity, revenue, approval progress, and room capacity."
      actions={
        <>
          <div className="rounded-xl border border-slate-200 bg-white/75 px-4 py-3 text-right text-xs text-slate-500">
            <p>{refreshing ? "Refreshing live data..." : "Auto-refresh every 30 seconds"}</p>
            <p className="mt-1">Last sync: {formatDateTime(lastUpdatedAt)}</p>
          </div>
          <Link to="/owner/add" className="btn-primary">Add PG</Link>
          <Link to="/owner/manage" className="btn-secondary">Manage PGs</Link>
        </>
      }
    >
      {error ? <InfoBanner tone="error">{error}</InfoBanner> : null}
      <InfoBanner>
        Dashboard data refreshes automatically after bookings and payments, so listing revenue and booking charts stay in sync without a manual reload.
      </InfoBanner>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          { label: "Total Revenue", value: stats.totalRevenue, accent: "bg-emerald-100 text-emerald-700", icon: Coins, currency: true },
          { label: "Collected Revenue", value: stats.paidEarnings, accent: "bg-teal-100 text-teal-700", icon: CheckCircle2, currency: true },
          { label: "Total Bookings", value: stats.totalBookings, accent: "bg-indigo-100 text-indigo-700", icon: CalendarRange },
          { label: "Available Rooms", value: stats.totalAvailableRooms, accent: "bg-cyan-100 text-cyan-700", icon: DoorOpen },
          { label: "Pending Approval", value: stats.pendingPgs, accent: "bg-amber-100 text-amber-700", icon: Clock3 },
          { label: "Approved Listings", value: stats.approvedPgs, accent: "bg-emerald-100 text-emerald-700", icon: Building2 },
        ].map(({ label, value, accent, icon, currency }, index) => (
          <AnimatedStatCard
            key={label}
            label={label}
            value={value}
            icon={icon}
            accentClass={accent}
            delayMs={index * 80}
            formatter={currency ? formatDashboardCurrency : formatDashboardCount}
          />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <TrendChartCard
          title="Monthly Revenue"
          subtitle="Collected revenue over the last 6 months"
          chart={data.charts.monthlyRevenue}
          valueFormatter={formatDashboardCurrency}
          emptyMessage="Paid bookings will appear here once transactions are completed."
        />
        <MultiBarChartCard
          title="Booking Trends"
          subtitle="Pending, confirmed, and cancelled bookings by month"
          chart={data.charts.bookingTrends}
          valueFormatter={formatDashboardCount}
          emptyMessage="Bookings for your listings will appear here automatically."
        />
        <DonutChartCard
          title="Earnings Status"
          subtitle="Paid, pending, and failed transaction amounts"
          chart={data.charts.revenueBreakdown}
          valueFormatter={formatDashboardCurrency}
          emptyMessage="Payment status data will show up after the first transaction."
        />
        <DonutChartCard
          title="Listing Approval"
          subtitle="Pending vs approved listings"
          chart={data.charts.approvalBreakdown}
          valueFormatter={formatDashboardCount}
          emptyMessage="Add a listing to start tracking approval status."
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SurfaceCard className="rounded-3xl border border-black/5 bg-white/90 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-700">Top Listings</p>
              <p className="mt-1 text-xs text-slate-500">Your strongest properties by paid revenue and booking activity</p>
            </div>
            <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
              <Building2 size={20} />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {data.topHostels.length ? (
              data.topHostels.map((hostel) => (
                <div key={hostel._id} className="rounded-2xl border border-slate-200 px-4 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{hostel.rank}. {hostel.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{hostel.location}</p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {formatDashboardCurrency(hostel.paidRevenue)}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                    <p>Bookings: <span className="font-semibold text-slate-900">{formatDashboardCount(hostel.totalBookings)}</span></p>
                    <p>Occupied: <span className="font-semibold text-slate-900">{formatDashboardCount(hostel.occupancy)}</span></p>
                    <p>Pending: <span className="font-semibold text-slate-900">{formatDashboardCurrency(hostel.pendingRevenue)}</span></p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-sm text-slate-500">
                No listing performance data is available yet.
              </div>
            )}
          </div>
        </SurfaceCard>

        <SurfaceCard className="rounded-3xl border border-black/5 bg-white/90 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-700">Latest Listings</p>
              <p className="mt-1 text-xs text-slate-500">Most recent PGs from your account and their approval state</p>
            </div>
            <Link to="/owner/manage" className="text-sm font-medium text-cyan-700 hover:text-cyan-800">
              Open manager
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {data.recentPgs.length ? (
              data.recentPgs.map((pg) => (
                <div key={pg._id} className="rounded-2xl border border-slate-200 px-4 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{pg.title || "Untitled listing"}</p>
                      <p className="mt-1 text-sm text-slate-500">{pg.address || [pg.area, pg.city].filter(Boolean).join(", ") || "Location not added"}</p>
                    </div>
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusPillClass(pg.isApproved, "approval")}`}>
                      {pg.isApproved ? "Approved" : "Pending"}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                    <p>Price: <span className="font-semibold text-slate-900">{formatDashboardCurrency(pg.price)}</span></p>
                    <p>Rooms: <span className="font-semibold text-slate-900">{formatDashboardCount(pg.availableRooms)}</span></p>
                    <p>Created: <span className="font-semibold text-slate-900">{formatDate(pg.createdAt)}</span></p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-sm text-slate-500">
                You have not created any PG listings yet.
              </div>
            )}
          </div>
        </SurfaceCard>
      </div>

      <SurfaceCard className="rounded-3xl border border-slate-100 bg-white/90 p-0 shadow-sm">
        <div className="flex flex-col gap-3 border-b bg-slate-50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <p className="text-sm font-medium text-slate-700">Recent Transactions</p>
            <p className="mt-1 text-xs text-slate-500">Latest booking and payment activity across your listings</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-left text-xs uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="px-6 py-4 sm:px-8">Resident</th>
                <th className="px-6 py-4 sm:px-8">Listing</th>
                <th className="px-6 py-4 sm:px-8">Amount</th>
                <th className="px-6 py-4 sm:px-8">Payment</th>
                <th className="px-6 py-4 sm:px-8">Check-in</th>
                <th className="px-6 py-4 sm:px-8">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-sm text-slate-500 sm:px-8">
                    No transactions have been recorded for your listings yet.
                  </td>
                </tr>
              ) : (
                data.recentTransactions.map((transaction) => (
                  <tr key={transaction._id} className="transition hover:bg-cyan-50/60">
                    <td className="px-6 py-5 sm:px-8">
                      <p className="font-semibold text-slate-800">{transaction.user?.name || "Resident"}</p>
                      <p className="mt-1 text-xs text-slate-500">{transaction.user?.email || transaction.user?.phone || "No contact info"}</p>
                    </td>
                    <td className="px-6 py-5 text-slate-600 sm:px-8">{transaction.pg?.title || "PG not available"}</td>
                    <td className="px-6 py-5 text-slate-600 sm:px-8">{formatDashboardCurrency(transaction.amount)}</td>
                    <td className="px-6 py-5 sm:px-8">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusPillClass(transaction.paymentStatus)}`}>
                        {transaction.paymentStatus || "pending"}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-slate-600 sm:px-8">{formatDate(transaction.booking?.checkInDate)}</td>
                    <td className="px-6 py-5 text-slate-600 sm:px-8">{formatDateTime(transaction.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SurfaceCard>
    </DashboardLayout>
  );
}

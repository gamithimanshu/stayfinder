import { useEffect } from "react";
import { ArrowRight, Building2, CheckCircle2, Coins, MailOpen, Shield, Users2 } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth-context";
import { DashboardLayout } from "../components/DashboardLayout.jsx";
import { AnimatedStatCard } from "../components/dashboard/AnimatedStatCard.jsx";
import {
  DonutChartCard,
  MultiBarChartCard,
  TrendChartCard,
  formatDashboardCount,
  formatDashboardCurrency,
} from "../components/dashboard/DashboardCharts.jsx";
import { InfoBanner, SurfaceCard } from "../components/ui.jsx";
import { useDashboardData } from "../hooks/useDashboardData.js";

const emptyChart = { labels: [], datasets: [], points: [] };

const emptyDashboard = {
  stats: {
    totalUsers: 0,
    totalMessages: 0,
    totalBookings: 0,
    activeBookings: 0,
    cancelledBookings: 0,
    pendingPgs: 0,
    approvedPgs: 0,
    totalRevenue: 0,
    paidRevenue: 0,
    pendingRevenue: 0,
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
  recentPendingPgs: [],
  recentMessages: [],
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
  if (tone === "booking") {
    return status === "cancelled" ? "bg-rose-100 text-rose-700" : "bg-sky-100 text-sky-700";
  }

  if (status === "paid") return "bg-emerald-100 text-emerald-700";
  if (status === "failed") return "bg-rose-100 text-rose-700";
  return "bg-amber-100 text-amber-700";
};

function normalizeDashboard(result) {
  return {
    stats: {
      totalUsers: safeNumber(result?.stats?.totalUsers),
      totalMessages: safeNumber(result?.stats?.totalMessages),
      totalBookings: safeNumber(result?.stats?.totalBookings),
      activeBookings: safeNumber(result?.stats?.activeBookings),
      cancelledBookings: safeNumber(result?.stats?.cancelledBookings),
      pendingPgs: safeNumber(result?.stats?.pendingPgs),
      approvedPgs: safeNumber(result?.stats?.approvedPgs),
      totalRevenue: safeNumber(result?.stats?.totalRevenue),
      paidRevenue: safeNumber(result?.stats?.paidRevenue),
      pendingRevenue: safeNumber(result?.stats?.pendingRevenue),
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
    recentPendingPgs: toArray(result?.recentPendingPgs),
    recentMessages: toArray(result?.recentMessages),
  };
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user } = useAuth();
  const isAdmin = user?.role === "admin" || Boolean(user?.isAdmin);

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true, state: { from: location.pathname } });
      return;
    }

    if (user && !isAdmin) {
      navigate("/", { replace: true });
    }
  }, [isAdmin, location.pathname, navigate, token, user]);

  const { data, error, loading, refreshing, lastUpdatedAt } = useDashboardData({
    endpoint: "/admin/dashboard",
    enabled: Boolean(token && isAdmin),
    initialData: emptyDashboard,
    normalize: normalizeDashboard,
    fallbackMessage: "We could not load the admin dashboard right now. Please try again.",
  });

  if (!token || !isAdmin) return null;

  if (loading) {
    return (
      <DashboardLayout
        role="admin"
        kicker="Admin workspace"
        title="Platform overview"
        description="Loading your platform analytics..."
        actions={
          <>
            <Link to="/admin/approve" className="btn-primary">Approve PG</Link>
            <Link to="/admin/users" className="btn-secondary">Users</Link>
          </>
        }
      >
        <SurfaceCard className="rounded-3xl border border-black/5 bg-white/85 p-10 text-center text-slate-500">
          Loading the admin dashboard...
        </SurfaceCard>
      </DashboardLayout>
    );
  }

  const stats = data.stats;

  return (
    <DashboardLayout
      role="admin"
      kicker="Admin workspace"
      title="Platform overview"
      description="Production-safe analytics for approvals, bookings, users, support traffic, and revenue."
      actions={
        <>
          <div className="rounded-xl border border-slate-200 bg-white/75 px-4 py-3 text-right text-xs text-slate-500">
            <p>{refreshing ? "Refreshing live data..." : "Auto-refresh every 30 seconds"}</p>
            <p className="mt-1">Last sync: {formatDateTime(lastUpdatedAt)}</p>
          </div>
          <Link to="/admin/approve" className="btn-primary">Approve PG</Link>
          <Link to="/admin/users" className="btn-secondary">Users</Link>
        </>
      }
    >
      {error ? <InfoBanner tone="error">{error}</InfoBanner> : null}
      <InfoBanner>
        Revenue and booking charts now use normalized backend aggregations and refresh automatically when the page regains focus.
      </InfoBanner>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          { label: "Total Revenue", value: stats.totalRevenue, accent: "bg-emerald-100 text-emerald-700", icon: Coins, currency: true },
          { label: "Active Bookings", value: stats.activeBookings, accent: "bg-sky-100 text-sky-700", icon: Building2 },
          { label: "Pending PGs", value: stats.pendingPgs, accent: "bg-amber-100 text-amber-700", icon: Shield },
          { label: "Approved PGs", value: stats.approvedPgs, accent: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
          { label: "Platform Users", value: stats.totalUsers, accent: "bg-cyan-100 text-cyan-700", icon: Users2 },
          { label: "Support Messages", value: stats.totalMessages, accent: "bg-indigo-100 text-indigo-700", icon: MailOpen },
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
          emptyMessage="Paid transactions will appear here once bookings are completed."
        />
        <MultiBarChartCard
          title="Booking Trends"
          subtitle="Confirmed vs cancelled bookings by month"
          chart={data.charts.bookingTrends}
          valueFormatter={formatDashboardCount}
          emptyMessage="Booking activity has not started yet."
        />
        <DonutChartCard
          title="Revenue Status"
          subtitle="Paid, pending, and failed transaction values"
          chart={data.charts.revenueBreakdown}
          valueFormatter={formatDashboardCurrency}
          emptyMessage="Transaction data will appear here after the first payment attempt."
        />
        <DonutChartCard
          title="Listing Approval"
          subtitle="Pending vs approved inventory"
          chart={data.charts.approvalBreakdown}
          valueFormatter={formatDashboardCount}
          emptyMessage="No listings are available yet."
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <SurfaceCard className="rounded-3xl border border-black/5 bg-white/90 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-700">Top Hostels</p>
              <p className="mt-1 text-xs text-slate-500">Best-performing properties by paid revenue and booking volume</p>
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
                    <p>Active: <span className="font-semibold text-slate-900">{formatDashboardCount(hostel.activeBookings)}</span></p>
                    <p>Pending: <span className="font-semibold text-slate-900">{formatDashboardCurrency(hostel.pendingRevenue)}</span></p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-sm text-slate-500">
                No hostel performance data is available yet.
              </div>
            )}
          </div>
        </SurfaceCard>

        <div className="space-y-6">
          <SurfaceCard className="rounded-3xl border border-black/5 bg-white/90 p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-700">Approval Queue</p>
                <p className="mt-1 text-xs text-slate-500">Newest pending listings that still need review</p>
              </div>
              <Link to="/admin/approve" className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700">
                Open approvals
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {data.recentPendingPgs.length ? (
                data.recentPendingPgs.map((pg) => (
                  <div key={pg._id} className="rounded-2xl border border-slate-200 px-4 py-3">
                    <p className="font-medium text-slate-900">{pg.title || "Untitled listing"}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {pg.location || pg.address || "Location not added"}
                      {pg.ownerId?.name ? ` by ${pg.ownerId.name}` : ""}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">{formatDate(pg.createdAt)}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-sm text-slate-500">
                  There are no pending PG approvals right now.
                </div>
              )}
            </div>
          </SurfaceCard>

          <SurfaceCard className="rounded-3xl border border-black/5 bg-white/90 p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-700">Recent Messages</p>
                <p className="mt-1 text-xs text-slate-500">Latest support and contact requests from users</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {data.recentMessages.length ? (
                data.recentMessages.map((item) => (
                  <div key={item._id} className="rounded-2xl border border-slate-200 px-4 py-3">
                    <p className="font-medium text-slate-900">{item.name || "Unknown sender"}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.email || "No email provided"}</p>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-600">{item.message || "No message content was included."}</p>
                    <p className="mt-2 text-xs text-slate-400">{formatDate(item.createdAt)}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-sm text-slate-500">
                  No support messages yet.
                </div>
              )}
            </div>
          </SurfaceCard>
        </div>
      </div>

      <SurfaceCard className="rounded-3xl border border-slate-100 bg-white/90 p-0 shadow-sm">
        <div className="flex flex-col gap-3 border-b bg-slate-50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <p className="text-sm font-medium text-slate-700">Recent Transactions</p>
            <p className="mt-1 text-xs text-slate-500">Latest payment events across the full platform</p>
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
                <th className="px-6 py-4 sm:px-8">Booking</th>
                <th className="px-6 py-4 sm:px-8">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-sm text-slate-500 sm:px-8">
                    No transactions have been recorded yet.
                  </td>
                </tr>
              ) : (
                data.recentTransactions.map((transaction) => (
                  <tr key={transaction._id} className="transition hover:bg-indigo-50/60">
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
                    <td className="px-6 py-5 sm:px-8">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusPillClass(transaction.booking?.bookingStatus, "booking")}`}>
                        {transaction.booking?.bookingStatus || "confirmed"}
                      </span>
                    </td>
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
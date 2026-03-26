import { createElement, useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, MailOpen, Shield, Users2 } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth-context";
import { API } from "../utils/api";
import { InfoBanner, PageSection, PageShell, SurfaceCard } from "../components/ui.jsx";

const emptyDashboard = {
  stats: {
    totalUsers: 0,
    totalMessages: 0,
    pendingPgs: 0,
    approvedPgs: 0,
  },
  recentPendingPgs: [],
  recentMessages: [],
};

const statCards = [
  {
    label: "Pending PGs",
    key: "pendingPgs",
    accent: "bg-amber-100 text-amber-700",
    icon: Shield,
  },
  {
    label: "Approved PGs",
    key: "approvedPgs",
    accent: "bg-emerald-100 text-emerald-700",
    icon: CheckCircle2,
  },
  {
    label: "Platform Users",
    key: "totalUsers",
    accent: "bg-sky-100 text-sky-700",
    icon: Users2,
  },
  {
    label: "Support Messages",
    key: "totalMessages",
    accent: "bg-indigo-100 text-indigo-700",
    icon: MailOpen,
  },
];

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "We could not load the admin dashboard right now. Please try again."
  );
}

function formatDate(value) {
  if (!value) return "Recently";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user } = useAuth();
  const isAdmin = user?.role === "admin" || Boolean(user?.isAdmin);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(emptyDashboard);
  const [message, setMessage] = useState("");

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

    const loadDashboard = async () => {
      setLoading(true);
      setMessage("");

      try {
        const { data: result } = await API.get("/admin/dashboard");

        if (!cancelled) {
          setData({
            stats: {
              totalUsers: Number(result?.stats?.totalUsers ?? 0),
              totalMessages: Number(result?.stats?.totalMessages ?? 0),
              pendingPgs: Number(result?.stats?.pendingPgs ?? 0),
              approvedPgs: Number(result?.stats?.approvedPgs ?? 0),
            },
            recentPendingPgs: Array.isArray(result?.recentPendingPgs) ? result.recentPendingPgs : [],
            recentMessages: Array.isArray(result?.recentMessages) ? result.recentMessages : [],
          });
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(getErrorMessage(error));
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
  }, [isAdmin, token]);

  if (!token || !isAdmin) return null;

  if (loading) {
    return (
      <PageSection className="pt-8 sm:pt-12">
        <PageShell>
          <SurfaceCard className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
            Loading the admin dashboard...
          </SurfaceCard>
        </PageShell>
      </PageSection>
    );
  }

  const totalWorkItems = data.stats.totalUsers + data.stats.totalMessages;

  return (
    <PageSection className="pt-8 sm:pt-12">
      <PageShell className="space-y-8">
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-sky-50 p-6 shadow-sm sm:p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-indigo-600">Admin dashboard</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
                Platform overview
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                This page gives you a quick summary of approvals, users, and support activity. Use the dedicated admin pages when you want to take action.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/admin/approve"
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-indigo-700"
              >
                Approve Listings
              </Link>
              <Link
                to="/admin/users"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Manage Users
              </Link>
            </div>
          </div>

          {message ? (
            <InfoBanner tone="error" className="mt-6">
              {message}
            </InfoBanner>
          ) : null}

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map(({ label, key, accent, icon }) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">{data.stats[key]}</p>
                  </div>
                  <div className={`rounded-2xl p-3 ${accent}`}>
                    {createElement(icon, { size: 20 })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <SurfaceCard className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-600">Approval queue</p>
                <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900" style={{ fontFamily: "var(--font-display)" }}>
                  Review pending listings
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  New listings that need approval will show up here first. Open the approval page when you are ready to review them one by one.
                </p>
              </div>
              <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                <Shield size={22} />
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between rounded-2xl bg-slate-50 px-5 py-4">
              <div>
                <p className="text-sm text-slate-500">Pending listings</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{data.stats.pendingPgs}</p>
              </div>
              <Link to="/admin/approve" className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700">
                Open approvals
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">Recent pending listings</h3>
              {data.recentPendingPgs.length ? (
                data.recentPendingPgs.map((pg) => (
                  <div key={pg._id} className="rounded-2xl border border-slate-200 px-4 py-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-slate-900">{pg.title || "Untitled listing"}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {pg.location || "Location not added"} {pg.ownerId?.name ? `• by ${pg.ownerId.name}` : ""}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs font-medium text-slate-500">{formatDate(pg.createdAt)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500">
                  No pending listings right now.
                </div>
              )}
            </div>
          </SurfaceCard>

          <SurfaceCard className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-600">User workspace</p>
                <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900" style={{ fontFamily: "var(--font-display)" }}>
                  Manage users and support
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Account management and support follow-up usually go together, so this section gives you a quick count and the latest contact requests.
                </p>
              </div>
              <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
                <Users2 size={22} />
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between rounded-2xl bg-slate-50 px-5 py-4">
              <div>
                <p className="text-sm text-slate-500">Users + support items</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{totalWorkItems}</p>
              </div>
              <Link to="/admin/users" className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700">
                Open user manager
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">Recent support messages</h3>
              {data.recentMessages.length ? (
                data.recentMessages.map((item) => (
                  <div key={item._id} className="rounded-2xl border border-slate-200 px-4 py-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-slate-900">{item.name || "Unknown sender"}</p>
                        <p className="mt-1 text-sm text-slate-500">{item.email || "No email provided"}</p>
                        <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                          {item.message || "No message content was included."}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs font-medium text-slate-500">{formatDate(item.createdAt)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500">
                  No support messages yet.
                </div>
              )}
            </div>
          </SurfaceCard>
        </div>
      </PageShell>
    </PageSection>
  );
}

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth-context";
import { API } from "../utils/api";
import { DashboardLayout } from "../components/DashboardLayout.jsx";
import { InfoBanner, SafeImage, SurfaceCard } from "../components/ui.jsx";

const toArray = (value) => (Array.isArray(value) ? value : []);

export function ApprovePG() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user } = useAuth();
  const isAdmin = user?.role === "admin" || Boolean(user?.isAdmin);
  const [loading, setLoading] = useState(true);
  const [pgs, setPgs] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

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

    const loadPendingPgs = async () => {
      setLoading(true);

      try {
        const { data: result } = await API.get("/admin/pgs/pending");

        if (!cancelled) {
          setPgs(Array.isArray(result?.pgs) ? result.pgs : []);
        }
      } catch (error) {
        if (!cancelled) {
          setMessageType("error");
          setMessage(error.message || "Unable to load pending PGs");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadPendingPgs();

    return () => {
      cancelled = true;
    };
  }, [isAdmin, token]);

  const handleApprove = async (pgId) => {
    try {
      const { data: result } = await API.put(`/admin/approve/${pgId}`);

      setPgs((current) => current.filter((pg) => pg._id !== pgId));
      setMessageType("success");
      setMessage(result.message || "PG approved successfully");
    } catch (error) {
      setMessageType("error");
      setMessage(error.message || "Unable to approve PG");
    }
  };

  if (!token || !isAdmin) return null;

  if (loading) {
    return (
      <DashboardLayout
        role="admin"
        kicker="Admin workspace"
        title="Approve PG"
        description="Loading your approval queue..."
      >
        <SurfaceCard className="rounded-xl border border-black/5 bg-white/85 p-10 text-center text-ink-500">
          Loading PG approvals...
        </SurfaceCard>
      </DashboardLayout>
    );
  }

  const safePgs = toArray(pgs);

  return (
    <DashboardLayout
      role="admin"
      kicker="Admin workspace"
      title="Approve PG"
      description="Review new owner listings before they go live."
    >
      {message ? <InfoBanner tone={messageType === "error" ? "error" : "success"}>{message}</InfoBanner> : null}

      <div className="min-w-0 space-y-6">
        {safePgs.length === 0 ? (
          <SurfaceCard className="p-8">
            <h2 className="panel-title">No pending PG approvals</h2>
            <p className="mt-3 muted-note">New owner submissions will appear here automatically.</p>
          </SurfaceCard>
        ) : null}

        {safePgs.map((pg) => (
          <SurfaceCard key={pg._id} className="min-w-0 space-y-6 p-6 sm:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink-500">Pending listing</p>
                <h2 className="mt-1 break-words text-2xl font-semibold text-ink-900">{pg.title}</h2>
                <p className="mt-2 break-words text-sm text-ink-500">{pg.location}</p>
              </div>
              <button type="button" className="btn-primary" onClick={() => handleApprove(pg._id)}>
                <CheckCircle2 size={18} />
                Approve
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl bg-ink-50 p-4">
                <p className="text-sm text-ink-500">Owner</p>
                <p className="mt-1 font-semibold text-ink-900">{pg.ownerId?.username || pg.ownerId?.name || "Not available"}</p>
              </div>
              <div className="rounded-xl bg-ink-50 p-4">
                <p className="text-sm text-ink-500">Email</p>
                <p className="mt-1 font-semibold text-ink-900">{pg.ownerId?.email || "Not available"}</p>
              </div>
              <div className="rounded-xl bg-ink-50 p-4">
                <p className="text-sm text-ink-500">Phone</p>
                <p className="mt-1 font-semibold text-ink-900">{pg.ownerId?.phone || "Not available"}</p>
              </div>
              <div className="rounded-xl bg-ink-50 p-4">
                <p className="text-sm text-ink-500">Price</p>
                <p className="mt-1 font-semibold text-ink-900">Rs. {Number(pg.price).toLocaleString()}/month</p>
              </div>
            </div>

            <p className="text-sm leading-7 text-ink-500">{pg.description || "No description provided."}</p>

            {Array.isArray(pg.images) && pg.images.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {toArray(pg.images).map((image, index) => (
                  <SafeImage key={`${pg._id}-${index}`} src={image} alt={`${pg.title} ${index + 1}`} className="h-44 w-full rounded-xl object-cover" />
                ))}
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-dashed border-brand-200 bg-brand-50/60">
                <SafeImage src="" alt={`${pg.title} fallback`} className="h-44 w-full object-cover" />
              </div>
            )}
          </SurfaceCard>
        ))}
      </div>
    </DashboardLayout>
  );
}



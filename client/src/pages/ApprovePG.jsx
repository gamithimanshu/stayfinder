import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth-context";
import { API } from "../utils/api";
import { InfoBanner, PageSection, PageShell, SectionHeading, SurfaceCard } from "../components/ui.jsx";

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
          setPgs(result.pgs ?? []);
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
    return <PageSection><PageShell><SurfaceCard className="p-10 text-center text-ink-500">Loading PG approvals...</SurfaceCard></PageShell></PageSection>;
  }

  return (
    <PageSection className="pt-12 sm:pt-16">
      <PageShell className="space-y-8">
        <SectionHeading
          kicker="Approve PG"
          title="Review new owner listings before they go live."
          description="Check owner details, pricing, images, and descriptions before approval."
        />
        {message ? <InfoBanner tone={messageType === "error" ? "error" : "success"}>{message}</InfoBanner> : null}

        <div className="space-y-6">
          {pgs.length === 0 ? (
            <SurfaceCard className="p-8">
              <h2 className="panel-title">No pending PG approvals</h2>
              <p className="mt-3 muted-note">New owner submissions will appear here automatically.</p>
            </SurfaceCard>
          ) : null}

          {pgs.map((pg) => (
            <SurfaceCard key={pg._id} className="space-y-6 p-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-ink-500">Pending listing</p>
                  <h2 className="mt-1 text-2xl font-semibold text-ink-900">{pg.title}</h2>
                  <p className="mt-2 text-sm text-ink-500">{pg.location}</p>
                </div>
                <button type="button" className="btn-primary" onClick={() => handleApprove(pg._id)}>
                  <CheckCircle2 size={18} />
                  Approve
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl bg-ink-50 p-4"><p className="text-sm text-ink-500">Owner</p><p className="mt-1 font-semibold text-ink-900">{pg.ownerId?.username || pg.ownerId?.name || "Not available"}</p></div>
                <div className="rounded-2xl bg-ink-50 p-4"><p className="text-sm text-ink-500">Email</p><p className="mt-1 font-semibold text-ink-900">{pg.ownerId?.email || "Not available"}</p></div>
                <div className="rounded-2xl bg-ink-50 p-4"><p className="text-sm text-ink-500">Phone</p><p className="mt-1 font-semibold text-ink-900">{pg.ownerId?.phone || "Not available"}</p></div>
                <div className="rounded-2xl bg-ink-50 p-4"><p className="text-sm text-ink-500">Price</p><p className="mt-1 font-semibold text-ink-900">Rs. {Number(pg.price).toLocaleString()}/month</p></div>
              </div>

              <p className="text-sm leading-7 text-ink-500">{pg.description || "No description provided."}</p>

              {Array.isArray(pg.images) && pg.images.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {pg.images.map((image, index) => (
                    <img key={`${pg._id}-${index}`} src={image} alt={`${pg.title} ${index + 1}`} className="h-44 w-full rounded-2xl object-cover" />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-brand-200 bg-brand-50/60 px-6 py-8 text-center text-sm text-ink-500">
                  No images uploaded for this listing.
                </div>
              )}
            </SurfaceCard>
          ))}
        </div>
      </PageShell>
    </PageSection>
  );
}

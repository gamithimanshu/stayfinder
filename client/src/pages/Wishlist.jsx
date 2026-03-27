import { useEffect, useMemo, useState } from "react";
import { Heart, MapPin, Trash2 } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth-context";
import { API } from "../utils/api";
import { normalizeListing } from "../utils/pg";
import { EmptyState, InfoBanner, PageIntro, PageSection, PageShell, PropertyCard, RatingPill, SurfaceCard } from "../components/ui.jsx";
import { toastError, toastSuccess } from "../utils/toast.js";

function normalizeWishlistItem(item, index) {
  const listingSource = item.pg ?? item.listing ?? item.property ?? item;
  const normalized = normalizeListing(listingSource, index);

  return {
    ...normalized,
    wishlistId: item.id ?? item._id ?? item.wishlistId ?? normalized.id,
  };
}

export function Wishlist() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageMessage, setPageMessage] = useState("");
  const [removingId, setRemovingId] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true, state: { from: location.pathname } });
    }
  }, [location.pathname, navigate, token]);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    const loadWishlist = async () => {
      setLoading(true);
      setPageMessage("");

      try {
        const { data } = await API.get("/wishlist");
        const rows = Array.isArray(data?.wishlist) ? data.wishlist : [];

        if (!cancelled) {
          setWishlistItems(rows.map(normalizeWishlistItem));
        }
      } catch (error) {
        if (!cancelled) {
          setWishlistItems([]);
          setPageMessage(error?.response?.data?.message || "Unable to load wishlist.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadWishlist();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const totalSaved = useMemo(() => wishlistItems.length, [wishlistItems]);

  const handleRemove = async (wishlistId) => {
    if (!token) {
      navigate("/login", { replace: true, state: { from: location.pathname } });
      return;
    }

    setRemovingId(wishlistId);
    setPageMessage("");

    try {
      await API.delete(`/wishlist/${wishlistId}`);

      setWishlistItems((currentItems) =>
        currentItems.filter((item) => String(item.wishlistId) !== String(wishlistId))
      );
      toastSuccess("Removed from wishlist.");
    } catch (error) {
      const message = error?.response?.data?.message || "Unable to remove wishlist item.";
      setPageMessage(message);
      toastError(message);
    } finally {
      setRemovingId("");
    }
  };

  if (!token) {
    return null;
  }

  return (
    <PageSection className="pt-12 sm:pt-16">
      <PageShell className="space-y-8">
        <PageIntro
          kicker="Saved PGs"
          title="Your wishlist is ready whenever you are."
          description="Keep favorite stays in one place so you can compare, revisit, and book faster."
          actions={<div className="badge-soft"><Heart size={16} />{totalSaved} saved</div>}
        />

        {!loading ? (
          <div className="sm:hidden -mx-4 px-4 sticky top-[4.5rem] z-10 border-b border-black/5 bg-[#fcfaf4]/80 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3 py-3">
              <div className="flex items-center gap-2">
                <Heart size={16} className="text-ink-600" />
                <span className="text-sm font-semibold text-ink-900">Saved</span>
              </div>
              <div className="badge-soft">
                {totalSaved} saved
              </div>
            </div>
          </div>
        ) : null}

        {pageMessage ? <InfoBanner tone="info">{pageMessage}</InfoBanner> : null}

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={`wishlist-skel-${index}`} className="space-y-4">
                <SurfaceCard className="overflow-hidden">
                  <div className="h-56 w-full bg-ink-100 animate-pulse" />
                  <div className="space-y-3 p-5">
                    <div className="h-4 w-3/4 rounded bg-ink-100 animate-pulse" />
                    <div className="h-3 w-1/2 rounded bg-ink-100 animate-pulse" />
                    <div className="h-8 w-full rounded-xl bg-ink-100 animate-pulse" />
                  </div>
                </SurfaceCard>
                <div className="flex gap-3">
                  <div className="h-11 flex-1 rounded-xl bg-ink-100 animate-pulse" />
                  <div className="h-11 flex-1 rounded-xl bg-ink-100 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : wishlistItems.length === 0 ? (
          <EmptyState
            title="No PGs saved yet"
            description="Start exploring listings and add the places you want to revisit later."
            actionLabel="Browse listings"
            actionTo="/listings"
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {wishlistItems.map((item) => (
              <div key={item.wishlistId} className="space-y-4">
                <PropertyCard
                  listing={item}
                  to={`/listings/${item.id}`}
                  badge={<span className="badge-soft border-white/15 bg-white/15 text-white">Saved</span>}
                  overlay={
                    <div className="flex items-center gap-2 text-white/85">
                      <MapPin size={14} />
                      <span className="text-sm">{item.location}</span>
                    </div>
                  }
                  footer={<RatingPill averageRating={item.averageRating} reviewCount={item.reviewCount} compact />}
                />
                <div className="flex gap-3">
                  <Link to={`/listings/${item.id}`} className="btn-secondary flex-1">View Details</Link>
                  <button
                    type="button"
                    className="btn-primary flex-1 bg-rose-600 hover:bg-rose-700"
                    onClick={() => handleRemove(item.wishlistId)}
                    disabled={removingId === item.wishlistId}
                  >
                    <Trash2 size={16} />
                    {removingId === item.wishlistId ? "Removing..." : "Remove"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </PageShell>
    </PageSection>
  );
}



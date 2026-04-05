import { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck2,
  Heart,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../store/auth-context";
import { API } from "../utils/api";
import { getReviewStats, normalizeListing } from "../utils/pg";
import { FormField, InfoBanner, PageSection, PageShell, RatingPill, SafeImage, SurfaceCard, TextArea } from "../components/ui.jsx";
import { toastError, toastSuccess } from "../utils/toast.js";

export function PGDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [pg, setPg] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [pageMessage, setPageMessage] = useState("");
  const [pageMessageTone, setPageMessageTone] = useState("info");
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [reviewRating, setReviewRating] = useState("5");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadPg = async () => {
      setLoading(true);

      try {
        const { data } = await API.get(`/pg/${id}`);
        const item = data?.pg ?? data?.data ?? data;
        const normalized = normalizeListing(item);

        if (!cancelled) {
          setPg(normalized);
          setSelectedImage(normalized.images[0] ?? normalized.image);
        }
      } catch (error) {
        if (!cancelled) {
          setPageMessageTone("error");
          setPageMessage(error?.response?.data?.message || "We could not find that PG right now.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadPg();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const averageRating = useMemo(() => {
    return getReviewStats(pg?.reviews);
  }, [pg]);
  const galleryImages = pg?.images?.length ? pg.images : [pg?.image].filter(Boolean);
  const amenities = Array.isArray(pg?.amenities) ? pg.amenities : [];
  const reviews = Array.isArray(pg?.reviews) ? pg.reviews : [];
  const roomsLeft = Number(pg?.availableRooms ?? 0);

  const ensureAuthenticated = () => {
    if (token) return true;
    navigate("/login");
    return false;
  };

  const handleWishlist = async () => {
    if (!pg || !ensureAuthenticated()) return;

    setWishlistLoading(true);
    setPageMessage("");
    setPageMessageTone("info");

    try {
      const { data } = await API.post("/wishlist/add", { pgId: pg.id });
      setPageMessageTone("success");
      setPageMessage(data?.message || "Added to wishlist successfully.");
      toastSuccess(data?.message || "Added to wishlist successfully.");
    } catch (error) {
      const message = error?.response?.data?.message || "Unable to add to wishlist.";
      setPageMessageTone("error");
      setPageMessage(message);
      toastError(message);
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!pg || !ensureAuthenticated()) return;

    setBookingLoading(true);
    setPageMessage("");
    setPageMessageTone("info");

    try {
      navigate(`/book/${pg.id}`);
    } catch {
      setPageMessage("Booking page could not be opened right now.");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    if (!pg || !ensureAuthenticated()) return;

    setReviewLoading(true);
    setPageMessage("");
    setPageMessageTone("info");

    try {
      const { data } = await API.post("/review/add", {
          pgId: pg.id,
          rating: Number(reviewRating),
          comment: reviewComment,
      });

      setPg((current) => {
        const newReviews = Array.isArray(data?.reviews) && data.reviews.length > 0 
          ? data.reviews 
          : [...(current.reviews || []), { 
              rating: Number(reviewRating), 
              comment: reviewComment, 
              name: user?.username || user?.name || "Resident" 
            }];
        return {
          ...current,
          reviews: newReviews
        };
      });
      setReviewComment("");
      setReviewRating("5");
      setPageMessageTone("success");
      setPageMessage(data?.message || "Review saved successfully.");
      toastSuccess(data?.message || "Review saved successfully.");
    } catch (error) {
      const message = error?.response?.data?.message || "Unable to save review.";
      setPageMessageTone("error");
      setPageMessage(message);
      toastError(message);
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) {
    return <PageSection><PageShell><SurfaceCard className="p-10 text-center text-ink-500">Loading PG details...</SurfaceCard></PageShell></PageSection>;
  }

  if (!pg) {
    return (
      <PageSection>
        <PageShell>
          <SurfaceCard className="space-y-4 p-10 text-center">
            <p className="text-ink-600">{pageMessage || "PG not found."}</p>
            <div>
              <Link to="/listings" className="btn-secondary">Back to listings</Link>
            </div>
          </SurfaceCard>
        </PageShell>
      </PageSection>
    );
  }

  return (
    <>
      <PageSection className="pt-12 sm:pt-16">
        <PageShell className="space-y-8">
          <Link to="/listings" className="inline-flex items-center gap-2 text-sm font-medium text-brand-700">
            Back to listings
          </Link>
          {pageMessage ? <InfoBanner tone={pageMessageTone}>{pageMessage}</InfoBanner> : null}

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <SurfaceCard className="overflow-hidden">
                <SafeImage
                  src={selectedImage || pg.image}
                  alt={pg.title}
                  className="h-64 w-full object-cover sm:h-[24rem] lg:h-[28rem]"
                />
              </SurfaceCard>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {galleryImages.map((image) => (
                  <button
                    key={image}
                    type="button"
                    className={`overflow-hidden rounded-xl border ${selectedImage === image ? "border-brand-400 ring-4 ring-brand-100" : "border-white/70"} bg-white`}
                    onClick={() => setSelectedImage(image)}
                    aria-label={`View image for ${pg.title}`}
                  >
                    <SafeImage src={image} alt={pg.title} className="h-20 w-full object-cover sm:h-24" />
                  </button>
                ))}
              </div>
            </div>

            <div className="xl:sticky xl:top-24 h-fit">
              <SurfaceCard className="p-6 sm:p-8">
                <span className="section-kicker">Verified PG detail</span>
                <h1 className="mt-5 text-4xl font-black tracking-tight text-ink-900" style={{ fontFamily: "var(--font-display)" }}>
                  {pg.title}
                </h1>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <span className="rounded-xl bg-ink-900 px-4 py-2 text-sm font-semibold text-white">
                    Rs. {pg.price.toLocaleString()}
                    <span className="ml-1 text-white/70">/month</span>
                  </span>
                  <RatingPill averageRating={averageRating.averageRating} reviewCount={averageRating.reviewCount} />
                  <span className="badge-soft">
                    <Users size={14} />
                    {pg.gender}
                  </span>
                </div>
                <div className="mt-5 flex items-center gap-2 text-sm text-ink-500">
                  <MapPin size={16} />
                  {pg.location}
                </div>
                <p className="mt-6 text-sm leading-7 text-ink-500">{pg.description}</p>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-brand-50 p-4 text-sm text-brand-800">
                    <ShieldCheck size={18} className="mb-3" />
                    Verified stay
                  </div>
                  <div className="rounded-xl bg-ink-50 p-4 text-sm text-ink-700">
                    <Sparkles size={18} className="mb-3" />
                    Clean amenities
                  </div>
                  <div className="rounded-xl bg-ink-50 p-4 text-sm text-ink-700">
                    <Users size={18} className="mb-3" />
                    {roomsLeft} rooms left
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-3">
                  <button
                    type="button"
                    className="btn-primary w-full"
                    onClick={handleBooking}
                    disabled={bookingLoading || roomsLeft < 1}
                  >
                    <CalendarCheck2 size={18} />
                    {bookingLoading ? "Opening booking..." : "Book Now"}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary w-full"
                    onClick={handleWishlist}
                    disabled={wishlistLoading}
                  >
                    <Heart size={18} />
                    {wishlistLoading ? "Saving..." : "Add to Wishlist"}
                  </button>
                </div>

                {roomsLeft < 1 ? <InfoBanner tone="error" className="mt-4">This PG currently has no rooms available.</InfoBanner> : null}
              </SurfaceCard>
            </div>
          </div>
        </PageShell>
      </PageSection>

      <PageSection>
        <PageShell className="space-y-8">
          <SurfaceCard className="p-8">
            <h2 className="text-2xl font-semibold text-ink-900">Everything included for daily comfort</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {amenities.length === 0 ? (
                <div className="rounded-xl border border-dashed border-brand-200 bg-brand-50/60 px-4 py-6 text-sm text-ink-500">
                  No amenities listed yet.
                </div>
              ) : amenities.map((amenity) => (
                <div key={amenity} className="rounded-xl border border-ink-100 bg-ink-50 px-4 py-4 text-sm font-medium text-ink-700">
                  <div className="mb-3 text-brand-700">
                    <ShieldCheck size={18} />
                  </div>
                  {amenity}
                </div>
              ))}
            </div>
          </SurfaceCard>

          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <SurfaceCard className="p-8">
              <h2 className="text-2xl font-semibold text-ink-900">Leave a review</h2>
              <p className="mt-2 text-sm text-ink-500">Share your stay experience to help future residents.</p>
              <form className="mt-6 space-y-5" onSubmit={handleReviewSubmit}>
                <FormField label="Rating">
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={24}
                        fill={Number(reviewRating) >= star ? "currentColor" : "none"}
                        strokeWidth={2}
                        className={`cursor-pointer transition-colors ${Number(reviewRating) >= star ? "text-yellow-500" : "text-ink-300"} hover:text-yellow-500`}
                        onClick={() => setReviewRating(star.toString())}
                      />
                    ))}
                    <span className="ml-2 text-sm font-semibold text-ink-700">{reviewRating} / 5</span>
                  </div>
                  <p className="mt-2 text-xs text-ink-500">Tap a star to rate this stay.</p>
                </FormField>
                <FormField label="Comment">
                  <TextArea rows="4" placeholder="Share your stay experience" value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} required />
                </FormField>
                <button type="submit" className="btn-primary w-full" disabled={reviewLoading}>
                  {reviewLoading ? "Saving..." : "Add Review"}
                </button>
              </form>
            </SurfaceCard>

            <SurfaceCard className="p-8">
              <h2 className="text-2xl font-semibold text-ink-900">What residents are saying</h2>
              <div className="mt-6 grid gap-4">
                {reviews.length === 0 ? (
                  <p className="text-sm text-ink-500">No reviews yet. Be the first to share your experience.</p>
                ) : (
                  reviews.map((review) => (
                    <article key={review.id ?? review._id ?? review.name} className="rounded-xl border border-ink-100 bg-ink-50 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="text-base font-semibold text-ink-900">{review.name ?? user?.name ?? "Resident"}</h3>
                        {Number.isFinite(Number(review.rating)) && Number(review.rating) > 0 ? (
                          <div className="badge-soft">
                            <Star size={14} fill="currentColor" />
                            {Number(review.rating).toFixed(1)}
                          </div>
                        ) : (
                          <div className="rounded-xl bg-ink-100 px-3 py-1.5 text-sm font-medium text-ink-500">
                            Not rated
                          </div>
                        )}
                      </div>
                      <p className="mt-3 text-sm leading-7 text-ink-500">
                        {review.comment ?? "Comfortable stay with a smooth experience."}
                      </p>
                    </article>
                  ))
                )}
              </div>
            </SurfaceCard>
          </div>
        </PageShell>
      </PageSection>
    </>
  );
}



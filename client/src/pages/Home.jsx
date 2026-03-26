import { createElement, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Building2, LocateFixed, MapPin, Search, Shield, Star } from "lucide-react";
import { API } from "../utils/api";
import { normalizeListing } from "../utils/pg";
import { InfoBanner, PageSection, PageShell, PropertyCard, RatingPill, SectionHeading } from "../components/ui.jsx";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

export const Home = () => {
  const navigate = useNavigate();
  const [featuredListings, setFeaturedListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationMessage, setLocationMessage] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [pageMessage, setPageMessage] = useState("");
  const [homeStats, setHomeStats] = useState({
    residentCount: 0,
    verifiedListingCount: 0,
    averageRating: null,
    reviewCount: 0,
    citiesCovered: 0,
  });
  const [reviewSummary, setReviewSummary] = useState({
    averageRating: null,
    totalReviews: 0,
    breakdown: [],
  });

  const deriveStatsFromListings = (rows) => {
    const safeRows = Array.isArray(rows) ? rows : [];
    const reviews = safeRows.flatMap((listing) => (Array.isArray(listing?.reviews) ? listing.reviews : []));
    const validRatings = reviews
      .map((review) => Number(review.rating))
      .filter((rating) => Number.isFinite(rating) && rating > 0);
    const reviewerNames = new Set(
      reviews.map((review) => (review?.name || "").trim()).filter(Boolean)
    );

    return {
      residentCount: reviewerNames.size,
      verifiedListingCount: safeRows.length,
      averageRating: validRatings.length
        ? Number((validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length).toFixed(1))
        : null,
      reviewCount: reviews.length,
      citiesCovered: new Set(safeRows.map((listing) => listing.city).filter(Boolean)).size,
    };
  };

  useEffect(() => {
    let cancelled = false;

    const loadFeaturedListings = async () => {
      try {
        const [listingsResponse, statsResponse, reviewSummaryResponse] = await Promise.allSettled([
          API.get("/pg/all"),
          API.get("/pg/stats"),
          API.get("/review/summary"),
        ]);
        const rows = listingsResponse.status === "fulfilled" && Array.isArray(listingsResponse.value?.data?.pgs)
          ? listingsResponse.value.data.pgs
          : [];

        if (!cancelled) {
          const normalizedRows = rows.map((item, index) => normalizeListing(item, index));
          const sortedPopularRows = [...normalizedRows].sort((left, right) => {
            if ((right.reviewCount ?? 0) !== (left.reviewCount ?? 0)) {
              return (right.reviewCount ?? 0) - (left.reviewCount ?? 0);
            }
            if ((right.averageRating ?? 0) !== (left.averageRating ?? 0)) {
              return (right.averageRating ?? 0) - (left.averageRating ?? 0);
            }
            return 0;
          });
          const derivedStats = deriveStatsFromListings(normalizedRows);
          const apiStats = statsResponse.status === "fulfilled" ? (statsResponse.value?.data?.stats ?? null) : null;
          const reviewSummaryStats = reviewSummaryResponse.status === "fulfilled"
            ? (reviewSummaryResponse.value?.data?.stats ?? null)
            : null;

          setFeaturedListings(sortedPopularRows.slice(0, 6));
          setHomeStats({
            residentCount: Math.max(apiStats?.residentCount ?? 0, derivedStats.residentCount),
            verifiedListingCount: Math.max(apiStats?.verifiedListingCount ?? 0, derivedStats.verifiedListingCount),
            averageRating: apiStats?.averageRating ?? derivedStats.averageRating,
            reviewCount: Math.max(apiStats?.reviewCount ?? 0, derivedStats.reviewCount),
            citiesCovered: Math.max(apiStats?.citiesCovered ?? 0, derivedStats.citiesCovered),
          });
          setReviewSummary({
            averageRating: reviewSummaryStats?.averageRating ?? derivedStats.averageRating,
            totalReviews: reviewSummaryStats?.totalReviews ?? derivedStats.reviewCount,
            breakdown: Array.isArray(reviewSummaryStats?.breakdown) ? reviewSummaryStats.breakdown : [],
          });

          if (reviewSummaryResponse.status === "rejected") {
            setPageMessage("We could not load review insights right now.");
          }
        }
      } catch {
        if (!cancelled) {
          setFeaturedListings([]);
          setHomeStats({
            residentCount: 0,
            verifiedListingCount: 0,
            averageRating: null,
            reviewCount: 0,
            citiesCovered: 0,
          });
          setReviewSummary({
            averageRating: null,
            totalReviews: 0,
            breakdown: [],
          });
          setPageMessage("We could not load the homepage data right now.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadFeaturedListings();

    return () => {
      cancelled = true;
    };
  }, []);

  const normalizedReviewBreakdown = useMemo(() => {
    const baseBreakdown = [
      { label: "5 star reviews", rating: 5, count: 0, percentage: 0 },
      { label: "4 star reviews", rating: 4, count: 0, percentage: 0 },
      { label: "3 star reviews", rating: 3, count: 0, percentage: 0 },
      { label: "2 star reviews", rating: 2, count: 0, percentage: 0 },
      { label: "1 star reviews", rating: 1, count: 0, percentage: 0 },
    ];

    if (!Array.isArray(reviewSummary.breakdown) || reviewSummary.breakdown.length === 0) {
      return baseBreakdown;
    }

    return baseBreakdown.map((item) => {
      const matched = reviewSummary.breakdown.find((entry) => Number(entry.rating) === item.rating);
      return matched ? { ...item, ...matched } : item;
    });
  }, [reviewSummary.breakdown]);

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setLocationMessage("Location access is not supported in this browser.");
      return;
    }

    setLocationLoading(true);
    setLocationMessage("");

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          let city = "";

          try {
            const { data } = await API.get("/pg/reverse-geocode", {
              params: {
                lat: coords.latitude,
                lon: coords.longitude,
              },
            });
            city = data?.city || "";
          } catch {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}`,
              {
                headers: {
                  Accept: "application/json",
                },
              }
            );
            const data = await response.json();
            city =
              data?.address?.city ||
              data?.address?.town ||
              data?.address?.state_district ||
              data?.address?.county ||
              data?.address?.state ||
              "";
          }

          if (!city) {
            setLocationMessage("We found your coordinates, but could not detect the city.");
            return;
          }

          navigate(`/listings?location=${encodeURIComponent(city)}`);
        } catch {
          setLocationMessage("We could not map your GPS location to a city right now.");
        } finally {
          setLocationLoading(false);
        }
      },
      () => {
        setLocationLoading(false);
        setLocationMessage("Please allow location access to search nearby stays.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  return (
    <div>
      <PageSection className="pt-6 sm:pt-10">
        <PageShell>
          <section className="relative overflow-hidden rounded-[2rem] border border-black/5 bg-ink-900 px-6 py-16 text-white shadow-[0_40px_90px_-45px_rgba(29,25,18,0.7)] sm:px-10 lg:px-14 lg:py-20">
            <div className="absolute inset-0 gradient-hero opacity-95" />
            <div className="absolute -right-16 top-8 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-sky-400/15 blur-3xl" />

            <div className="relative grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div className="max-w-3xl">
                <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white/80">
                  Fresh, trusted city stays
                </span>
                <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl" style={{ fontFamily: "var(--font-display)" }}>
                  Find Your Perfect
                  <br />
                  <span className="text-sky-300">PG & Hostel</span>
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-8 text-white/78 sm:text-lg">
                  StayFinder helps students and professionals discover verified stays with clear pricing, cleaner comparisons, and a smoother booking flow.
                </p>

                <div className="mt-8 flex flex-wrap gap-3 text-sm text-white/75">
                  {["Admin-verified listings", "Easy owner onboarding", "Fast booking journey"].map((item) => (
                    <span key={item} className="rounded-full border border-white/12 bg-white/10 px-4 py-2">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="surface-card relative z-10 space-y-4 p-5 text-ink-900 sm:p-6">
                <div className="rounded-3xl border border-brand-100 bg-brand-50/70 p-5">
                  <p className="text-sm font-semibold text-ink-900">Search using GPS location</p>
                  <p className="mt-2 text-sm leading-7 text-ink-500">
                    We can use your current location to detect your city and open nearby PG listings automatically.
                  </p>
                </div>

                <button type="button" className="btn-primary w-full" onClick={handleUseCurrentLocation} disabled={locationLoading}>
                  <LocateFixed size={18} />
                  {locationLoading ? "Detecting your location..." : "Use My Current Location"}
                </button>

                <button type="button" className="btn-secondary w-full" onClick={() => navigate("/listings")}>
                  Browse All Stays
                </button>

                {locationMessage ? (
                  <p className="text-sm text-rose-600">{locationMessage}</p>
                ) : null}
              </div>
            </div>
          </section>
        </PageShell>
      </PageSection>

      <PageSection className="pt-2">
        <PageShell>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              [homeStats.residentCount.toLocaleString(), "Happy residents"],
              [homeStats.verifiedListingCount.toLocaleString(), "Verified listings"],
              [homeStats.averageRating ? `${homeStats.averageRating.toFixed(1)}/5` : "No ratings yet", homeStats.reviewCount ? `${homeStats.reviewCount} real reviews` : "Average rating"],
              [homeStats.citiesCovered.toLocaleString(), "Cities covered"],
            ].map(([value, label]) => (
              <div key={label} className="surface-card p-6 text-center">
                <h3 className="text-3xl font-bold text-brand-700" style={{ fontFamily: "var(--font-display)" }}>{value}</h3>
                <p className="mt-2 text-sm text-ink-500">{label}</p>
              </div>
            ))}
          </div>
        </PageShell>
      </PageSection>

      <PageSection>
        <PageShell className="space-y-8">
          {pageMessage ? <InfoBanner tone="error">{pageMessage}</InfoBanner> : null}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              kicker="Featured Picks"
              title="Popular PGs and hostels"
              description="Handpicked stays that match the warm, trustworthy discovery feel from the reference design."
            />
            <Link to="/listings" className="btn-secondary">
              View All
              <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="surface-card p-10 text-center text-ink-500">Loading featured listings...</div>
          ) : (
            <div className="relative">
              <Swiper
                spaceBetween={16}
                slidesPerView={1}
                grabCursor
                breakpoints={{
                  640: { slidesPerView: 2 },
                  1024: { slidesPerView: 3 },
                }}
              >
                {featuredListings.map((listing) => (
                  <SwiperSlide key={listing.id}>
                    <PropertyCard
                      listing={listing}
                      to={`/listings/${listing.id}`}
                      badge={<span className="badge-soft border-white/15 bg-white/15 text-white">Verified</span>}
                      overlay={
                        <div className="flex items-center gap-3 text-white/85">
                          <MapPin size={14} />
                          <span className="text-sm">{listing.location}</span>
                        </div>
                      }
                      footer={<RatingPill averageRating={listing.averageRating} reviewCount={listing.reviewCount} compact />}
                    />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          )}
        </PageShell>
      </PageSection>

      <PageSection className="bg-white/45">
        <PageShell>
          <div className="grid gap-6 overflow-hidden rounded-[2rem] border border-black/5 bg-white/85 p-6 shadow-[0_28px_70px_-40px_rgba(30,25,18,0.35)] lg:grid-cols-[0.9fr_1.1fr] lg:p-8">
            <div className="rounded-[1.5rem] bg-ink-900 p-6 text-white">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">Customer Reviews</p>
              <div className="mt-5 flex items-center gap-1 text-amber-300">
                {Array.from({ length: 5 }).map((_, index) => {
                  const rating = Number(reviewSummary.averageRating || 0);
                  const isFilled = index < Math.floor(rating);

                  return (
                    <Star
                      key={`review-star-${index}`}
                      size={20}
                      fill={isFilled ? "currentColor" : "none"}
                      className={isFilled ? "text-amber-300" : "text-white/30"}
                    />
                  );
                })}
              </div>
              <h3 className="mt-5 text-4xl font-black tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                {reviewSummary.averageRating ? `${reviewSummary.averageRating.toFixed(1)} out of 5 stars` : "No ratings yet"}
              </h3>
              <p className="mt-3 text-sm leading-7 text-white/75">
                {reviewSummary.totalReviews
                  ? `Based on ${reviewSummary.totalReviews.toLocaleString()} reviews`
                  : "Reviews will appear here as users share their experience"}
              </p>
            </div>

            <div className="rounded-[1.5rem] bg-brand-50/75 p-6">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-600">Review data</p>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink-600 shadow-sm">
                  Real user look
                </span>
              </div>

              <div className="mt-6 space-y-4">
                {normalizedReviewBreakdown.map((item) => (
                  <div key={item.label} className="grid gap-2 sm:grid-cols-[10rem_1fr_auto] sm:items-center sm:gap-4">
                    <p className="text-sm font-medium text-ink-700">{item.label}</p>
                    <div className="h-3 overflow-hidden rounded-full bg-white shadow-inner">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-sky-500 via-cyan-500 to-brand-500"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <p className="text-sm font-semibold text-ink-900">
                      {item.percentage}%{reviewSummary.totalReviews ? ` (${item.count})` : ""}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </PageShell>
      </PageSection>

      <PageSection className="bg-white/45">
        <PageShell className="space-y-8">
          <SectionHeading
            kicker="Why StayFinder"
            title="From search to move-in without the stress"
            description="A cleaner journey for tenants, owners, and admins with the same polished visual language carried across the app."
            align="center"
          />
          <div className="grid gap-6 md:grid-cols-3">
            {[
              [Search, "Search and discover", "Browse verified stays by city, budget, and your preferred lifestyle."],
              [Shield, "Compare with confidence", "Review pricing, gender preference, amenities, and resident feedback."],
              [Building2, "Book faster", "Save favorites, confirm availability, and move ahead with less friction."],
            ].map(([icon, title, description], index) => (
              <div key={title} className="surface-card p-7">
                <div className="gradient-primary flex h-12 w-12 items-center justify-center rounded-2xl text-white">
                  {createElement(icon, { size: 22 })}
                </div>
                <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-brand-500">0{index + 1}</p>
                <h3 className="mt-3 text-2xl text-ink-900" style={{ fontFamily: "var(--font-display)" }}>{title}</h3>
                <p className="mt-3 text-sm leading-7 text-ink-500">{description}</p>
              </div>
            ))}
          </div>
        </PageShell>
      </PageSection>

      <PageSection>
        <PageShell>
          <div className="gradient-hero overflow-hidden rounded-[2rem] px-6 py-12 text-center text-white sm:px-10 lg:px-16 lg:py-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
              Start exploring trusted accommodation today
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-white/75">
              Compare real options, shortlist the best stays, and move into your next space with more confidence.
            </p>
            <button type="button" className="btn-primary mt-8 bg-white text-brand-800 hover:bg-white/90" onClick={() => navigate("/listings")}>
              Browse stays
              <ArrowRight size={16} />
            </button>
          </div>
        </PageShell>
      </PageSection>
    </div>
  );
};

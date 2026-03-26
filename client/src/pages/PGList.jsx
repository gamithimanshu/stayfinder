import { useEffect, useMemo, useState } from "react";
import { MapPin, SlidersHorizontal, VenusAndMars, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { API } from "../utils/api";
import { normalizeListing } from "../utils/pg";
import { EmptyState, InfoBanner, PageSection, PageShell, PropertyCard, RatingPill, SurfaceCard } from "../components/ui.jsx";

export function PGList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [pgListings, setPgListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const city = searchParams.get("city") ?? searchParams.get("location") ?? "";
  const price = searchParams.get("price") ?? searchParams.get("budget") ?? "";
  const gender = searchParams.get("gender") ?? "";

  useEffect(() => {
    let cancelled = false;

    const loadListings = async () => {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (city.trim()) params.set("city", city.trim());
      if (price.trim()) params.set("price", price.trim());
      if (gender.trim()) params.set("gender", gender.trim());

      try {
        const { data } = await API.get(`/pg/all?${params.toString()}`);
        const rows = Array.isArray(data?.pgs) ? data.pgs : [];

        if (!cancelled) {
          setPgListings(rows.map(normalizeListing));
        }
      } catch (error) {
        if (!cancelled) {
          setPgListings([]);
          setError(error?.response?.data?.message || "Unable to load PG listings.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadListings();

    return () => {
      cancelled = true;
    };
  }, [city, gender, price]);

  const availableCities = useMemo(() => {
    const cities = new Set();
    pgListings.forEach((listing) => {
      if (listing.city) cities.add(listing.city);
    });
    return Array.from(cities).sort();
  }, [pgListings]);

  const updateFilter = (key, value) => {
    const nextParams = new URLSearchParams(searchParams);

    if (value) {
      nextParams.set(key, value);
    } else {
      nextParams.delete(key);
    }

    setSearchParams(nextParams);
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const activeFiltersCount = [city, price, gender].filter((v) => String(v || "").trim()).length;

  return (
    <div>
      <PageSection className="pt-8 sm:pt-12">
        <PageShell className="space-y-8">
          <section className="gradient-hero rounded-[2rem] px-6 py-12 text-white sm:px-10">
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white/75">
              PG discovery
            </span>
            <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
              Find the right PG for your budget, city, and lifestyle.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-white/75">
              Use quick filters to narrow the options and browse available stays with the same cleaner, card-first experience as the reference site.
            </p>
          </section>

          <section className="surface-card p-6 sm:p-8">
            <div className="flex flex-col gap-4 border-b border-black/5 pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="section-kicker">Filters</span>
                <h2 className="mt-4 text-3xl text-ink-900" style={{ fontFamily: "var(--font-display)" }}>
                  Refine your PG search
                </h2>
                <p className="mt-2 text-sm text-ink-500">
                  Choose a city, budget, and stay type. Clear filters anytime to see all listings again.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="badge-soft">
                  <SlidersHorizontal size={16} />
                  {pgListings.length} stays found
                </div>
                {activeFiltersCount ? (
                  <button type="button" className="btn-secondary min-h-11" onClick={clearFilters}>
                    <X size={16} />
                    Clear filters
                  </button>
                ) : null}
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-ink-700">City</span>
                <select className="input-base" value={city} onChange={(event) => updateFilter("city", event.target.value)}>
                  <option value="">All Cities</option>
                  {availableCities.map((cityOption) => (
                    <option key={cityOption} value={cityOption}>{cityOption}</option>
                  ))}
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-ink-700">Price</span>
                <select className="input-base" value={price} onChange={(event) => updateFilter("price", event.target.value)}>
                  <option value="">Any Budget</option>
                  <option value="6000">Up to Rs. 6,000</option>
                  <option value="8000">Up to Rs. 8,000</option>
                  <option value="10000">Up to Rs. 10,000</option>
                  <option value="15000">Up to Rs. 15,000</option>
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-ink-700">Gender</span>
                <select className="input-base" value={gender} onChange={(event) => updateFilter("gender", event.target.value)}>
                  <option value="">All</option>
                  <option value="male">Boys</option>
                  <option value="female">Girls</option>
                  <option value="unisex">Unisex</option>
                </select>
              </label>
            </div>

            {error ? <InfoBanner tone="error" className="mt-4">{error}</InfoBanner> : null}
          </section>
          <section>
            {loading ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <SurfaceCard key={`listing-skeleton-${index}`} className="overflow-hidden">
                    <div className="h-56 w-full bg-ink-100 animate-pulse" />
                    <div className="space-y-3 p-5">
                      <div className="h-5 w-2/3 rounded bg-ink-100 animate-pulse" />
                      <div className="h-4 w-1/2 rounded bg-ink-100 animate-pulse" />
                      <div className="h-8 w-32 rounded bg-ink-100 animate-pulse" />
                    </div>
                  </SurfaceCard>
                ))}
              </div>
            ) : pgListings.length === 0 ? (
              <EmptyState
                title="No PGs matched these filters"
                description="Try removing a filter or broaden the budget to see more stays."
                actionLabel={activeFiltersCount ? "Clear filters" : "Browse all listings"}
                actionTo={activeFiltersCount ? "/listings" : "/listings"}
              />
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {pgListings.map((listing) => (
                  <PropertyCard
                    key={listing.id}
                    listing={listing}
                    to={`/listings/${listing.id}`}
                    badge={
                      <span className="badge-soft border-white/15 bg-white/15 text-white capitalize">
                        <VenusAndMars size={14} />
                        {listing.gender}
                      </span>
                    }
                    overlay={
                      <div className="flex items-center gap-3 text-white/85">
                        <MapPin size={14} />
                        <span className="text-sm">{listing.city || listing.location}</span>
                      </div>
                    }
                    footer={<RatingPill averageRating={listing.averageRating} reviewCount={listing.reviewCount} compact />}
                  />
                ))}
              </div>
            )}
          </section>
        </PageShell>
      </PageSection>
    </div>
  );
}

export const Listings = PGList;

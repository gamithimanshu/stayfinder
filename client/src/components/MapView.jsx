import { useEffect, useMemo, useState } from "react";
import { ExternalLink, MapPin } from "lucide-react";

const getListingQuery = (listing = {}) => {
  return [listing.title, listing.location, listing.city].filter(Boolean).join(", ");
};

export function MapView({ listings = [], onMarkerClick = () => {}, className = "" }) {
  const validListings = useMemo(
    () => (Array.isArray(listings) ? listings : []).filter((listing) => Boolean(getListingQuery(listing))),
    [listings]
  );
  const [selectedId, setSelectedId] = useState(validListings[0]?.id ?? validListings[0]?._id ?? "");

  useEffect(() => {
    const firstId = validListings[0]?.id ?? validListings[0]?._id ?? "";
    if (!firstId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedId("");
      return;
    }

    const hasSelected = validListings.some((listing) => String(listing.id ?? listing._id) === String(selectedId));
    if (!hasSelected) {
      setSelectedId(firstId);
    }
  }, [selectedId, validListings]);

  const selectedListing = useMemo(() => {
    return (
      validListings.find((listing) => String(listing.id ?? listing._id) === String(selectedId)) ||
      validListings[0] ||
      null
    );
  }, [selectedId, validListings]);

  if (validListings.length === 0) {
    return (
      <div className={`rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 ${className}`}>
        <MapPin className="mx-auto mb-3 h-10 w-10 text-slate-400" />
        <p className="font-medium">No map location available for these PGs.</p>
      </div>
    );
  }

  const selectedQuery = getListingQuery(selectedListing);
  const embedUrl = `https://www.google.com/maps?q=${encodeURIComponent(selectedQuery)}&z=${validListings.length === 1 ? 15 : 12}&output=embed`;
  const openUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedQuery)}`;

  return (
    <div className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      <div className="grid gap-0 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="min-h-[420px] bg-slate-100">
          <iframe
            title={`Map for ${selectedListing?.title || "selected PG"}`}
            src={embedUrl}
            className="h-full min-h-[420px] w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        <div className="border-t border-slate-200 bg-white lg:border-l lg:border-t-0">
          <div className="border-b border-slate-200 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Map explorer</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">{selectedListing?.title || "Selected PG"}</h3>
            <p className="mt-1 text-sm text-slate-500">{selectedListing?.location || selectedListing?.city}</p>
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-slate-900">
                Rs. {Number(selectedListing?.price || 0).toLocaleString()}/month
              </span>
              <a
                href={openUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-brand-700"
              >
                Open in Maps
                <ExternalLink size={14} />
              </a>
            </div>
          </div>

          <div className="max-h-[420px] space-y-3 overflow-y-auto p-4">
            {validListings.map((listing) => {
              const listingId = listing.id ?? listing._id ?? "";
              const isSelected = String(listingId) === String(selectedListing?.id ?? selectedListing?._id ?? "");

              return (
                <button
                  key={listingId || getListingQuery(listing)}
                  type="button"
                  onClick={() => {
                    setSelectedId(listingId);
                    onMarkerClick(listing);
                  }}
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    isSelected
                      ? "border-brand-300 bg-brand-50"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{listing.title || "Untitled PG"}</p>
                      <p className="mt-1 text-sm text-slate-500">{listing.location || listing.city}</p>
                    </div>
                    <MapPin className={`mt-0.5 h-4 w-4 ${isSelected ? "text-brand-700" : "text-slate-400"}`} />
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-700">
                    Rs. {Number(listing.price || 0).toLocaleString()}/month
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}



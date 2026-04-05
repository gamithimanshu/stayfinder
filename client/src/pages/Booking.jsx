import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CreditCard,
  Hotel,
  ShieldCheck,
} from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../store/auth-context";
import { API } from "../utils/api";
import { normalizeListing } from "../utils/pg";
import { FormField, InfoBanner, PageSection, PageShell, SafeImage, SelectInput, SurfaceCard, TextInput } from "../components/ui.jsx";
import { toastError, toastSuccess } from "../utils/toast.js";

const toArray = (value) => (Array.isArray(value) ? value : []);

function getTomorrowDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().split("T")[0];
}

export function Booking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();
  const [pg, setPg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pageMessage, setPageMessage] = useState("");
  const [checkInDate, setCheckInDate] = useState(getTomorrowDate);
  const [durationMonths, setDurationMonths] = useState("1");

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true, state: { from: location.pathname } });
    }
  }, [location.pathname, navigate, token]);

  useEffect(() => {
    let cancelled = false;

    const loadPg = async () => {
      setLoading(true);
      setPageMessage("");

      try {
        const { data } = await API.get(`/pg/${id}`);
        const item = data?.pg ?? data?.data ?? data;

        if (!cancelled) {
          setPg(normalizeListing(item));
        }
      } catch (error) {
        if (!cancelled) {
          setPg(null);
          setPageMessage(error?.response?.data?.message || "Unable to load booking details.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    if (token) {
      loadPg();
    }

    return () => {
      cancelled = true;
    };
  }, [id, token]);

  const totalPrice = useMemo(() => {
    if (!pg) return 0;
    return pg.price * Math.max(Number.parseInt(durationMonths, 10) || 1, 1);
  }, [durationMonths, pg]);

  const checkoutDate = useMemo(() => {
    const months = Math.max(Number.parseInt(durationMonths, 10) || 1, 1);
    const startDate = new Date(checkInDate);
    if (Number.isNaN(startDate.getTime())) return "";
    startDate.setMonth(startDate.getMonth() + months);
    return startDate.toLocaleDateString();
  }, [checkInDate, durationMonths]);

  const monthlyPrice = pg?.price ?? 0;
  const visibleAmenities = toArray(pg?.amenities).slice(0, 4);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!pg || !token) return;

    setSubmitting(true);
    setPageMessage("");

    try {
      const { data } = await API.post("/booking", {
        pgId: pg.id,
        checkInDate,
        durationMonths: Number.parseInt(durationMonths, 10),
      });

      setPg((current) => current ? { ...current, availableRooms: data?.pg?.availableRooms ?? current.availableRooms } : current);
      if (data?.message) toastSuccess(data.message);
      navigate(`/payment/${data?.booking?._id || data?.booking?.id}`, {
        state: {
          bookingTitle: pg.title,
        },
      });
    } catch (error) {
      const message = error?.response?.data?.message || "Booking could not be completed.";
      setPageMessage(message);
      toastError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return null;
  }

  if (loading) {
    return (
      <PageSection>
        <PageShell>
          <SurfaceCard className="p-10 text-center text-ink-500">Loading booking page...</SurfaceCard>
        </PageShell>
      </PageSection>
    );
  }

  if (!pg) {
    return (
      <PageSection>
        <PageShell>
          <SurfaceCard className="space-y-4 p-10 text-center">
            <p>We could not load this PG for booking.</p>
            <div>
              <Link to="/listings" className="btn-secondary">
                Back to listings
              </Link>
            </div>
          </SurfaceCard>
        </PageShell>
      </PageSection>
    );
  }

  const roomsLeft = Number(pg.availableRooms ?? 0);

  return (
    <PageSection className="pt-12 sm:pt-16">
      <PageShell className="space-y-8">
        <Link to={`/listings/${pg.id}`} className="inline-flex items-center gap-2 text-sm font-medium text-brand-700">
          Back to PG details
        </Link>
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <SurfaceCard className="overflow-hidden">
            <SafeImage src={pg.image} alt={pg.title} className="h-56 w-full object-cover sm:h-72 lg:h-80" />
            <div className="space-y-4 p-6 sm:p-8">
              <span className="section-kicker">Secure booking</span>
              <h1 className="text-4xl tracking-tight text-ink-900" style={{ fontFamily: "var(--font-display)" }}>
                Review your stay details before moving to payment.
              </h1>
              <p className="text-sm leading-7 text-ink-500">
                Confirm the booking details here, then continue to a separate payment page to complete the checkout flow.
              </p>
              <div className="rounded-xl border border-black/5 bg-sky-50/60 p-5">
                <h2 className="text-xl font-semibold text-ink-900">{pg.title}</h2>
                <p className="mt-2 text-sm text-ink-500">{pg.location}</p>
                <p className="mt-4 text-2xl font-bold text-ink-900">
                  Rs. {pg.price.toLocaleString()}
                  <span className="text-sm font-medium text-ink-400"> /month</span>
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-black/5 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">Room Type</p>
                  <p className="mt-2 text-sm font-semibold text-ink-900">{pg.roomType || "Standard Room"}</p>
                </div>
                <div className="rounded-xl border border-black/5 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">Available Rooms</p>
                  <p className="mt-2 text-sm font-semibold text-ink-900">{pg.availableRooms}</p>
                </div>
                <div className="rounded-xl border border-black/5 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">Stay Type</p>
                  <p className="mt-2 text-sm font-semibold capitalize text-ink-900">{pg.gender} / monthly</p>
                </div>
              </div>
              {visibleAmenities.length > 0 ? (
                <div>
                  <p className="text-sm font-semibold text-ink-900">Popular amenities</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {visibleAmenities.map((amenity) => (
                      <span key={amenity} className="badge-soft">{amenity}</span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </SurfaceCard>

          <div className="xl:sticky xl:top-24 h-fit">
            <SurfaceCard className="p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <FormField label="Check-in date">
                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" size={18} />
                    <TextInput className="pl-11" type="date" value={checkInDate} min={getTomorrowDate()} onChange={(event) => setCheckInDate(event.target.value)} required />
                  </div>
                </FormField>

                <FormField label="Duration">
                  <div className="relative">
                    <Hotel className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" size={18} />
                    <SelectInput className="pl-11" value={durationMonths} onChange={(event) => setDurationMonths(event.target.value)}>
                      <option value="1">1 Month</option>
                      <option value="2">2 Months</option>
                      <option value="3">3 Months</option>
                      <option value="6">6 Months</option>
                      <option value="12">12 Months</option>
                    </SelectInput>
                  </div>
                </FormField>

                <div className="rounded-xl border border-black/5 bg-ink-50/70 p-5">
                  <p className="text-sm font-semibold text-ink-900">Booking summary</p>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 pb-4">
                    <span className="mt-4 inline-flex items-center gap-2 text-sm text-ink-500">
                      <CreditCard size={18} />
                      Monthly Rent
                    </span>
                    <strong className="mt-4 text-base text-ink-900">Rs. {monthlyPrice.toLocaleString()}</strong>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 pb-4">
                    <span className="inline-flex items-center gap-2 text-sm text-ink-500">
                      <Hotel size={18} />
                      Stay Duration
                    </span>
                    <strong className="text-base text-ink-900">{durationMonths} month(s)</strong>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 pb-4">
                    <span className="inline-flex items-center gap-2 text-sm text-ink-500">
                      <CalendarDays size={18} />
                      Checkout Date
                    </span>
                    <strong className="text-base text-ink-900">{checkoutDate || "TBD"}</strong>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 pb-4">
                    <span className="inline-flex items-center gap-2 text-sm text-ink-500">
                      <ShieldCheck size={18} />
                      Available Rooms
                    </span>
                    <strong className="text-base text-ink-900">{pg.availableRooms ?? "N/A"}</strong>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-ink-700">
                      <CreditCard size={18} />
                      Total Price
                    </span>
                    <strong className="text-xl text-ink-900">Rs. {totalPrice.toLocaleString()}</strong>
                  </div>
                </div>

                <button type="submit" className="btn-primary w-full" disabled={submitting || roomsLeft < 1}>
                  {submitting ? "Creating booking..." : "Continue to Payment"}
                </button>

                <InfoBanner tone="info">
                  Your booking will be created first with pending payment, then you will continue to a dedicated payment page.
                </InfoBanner>

                {roomsLeft < 1 ? <InfoBanner tone="error">No rooms are currently available for this PG.</InfoBanner> : null}
                {pageMessage ? <InfoBanner tone="error">{pageMessage}</InfoBanner> : null}
              </form>
            </SurfaceCard>
          </div>
        </div>
      </PageShell>
    </PageSection>
  );
}



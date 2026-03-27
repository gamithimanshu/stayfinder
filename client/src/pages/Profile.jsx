import { useEffect, useState } from "react";
import { CalendarClock, CreditCard, House, KeyRound, Mail, Phone, UserRound } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth-context";
import { API } from "../utils/api";
import { FormField, InfoBanner, PageIntro, PageSection, PageShell, SurfaceCard, TextInput } from "../components/ui.jsx";

const toArray = (value) => (Array.isArray(value) ? value : []);

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

const formatCurrency = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

const bookingTone = (status) => {
  if (status === "confirmed") return "bg-sky-100 text-sky-700";
  if (status === "cancelled") return "bg-rose-100 text-rose-700";
  return "bg-amber-100 text-amber-700";
};

const paymentTone = (status) => {
  if (status === "paid") return "bg-emerald-100 text-emerald-700";
  if (status === "failed") return "bg-rose-100 text-rose-700";
  return "bg-amber-100 text-amber-700";
};

export function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, syncUserInLS } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("info");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    currentPassword: "",
    newPassword: "",
  });

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true, state: { from: location.pathname } });
    }
  }, [location.pathname, navigate, token]);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    const loadProfile = async () => {
      setLoading(true);

      try {
        const [{ data }, { data: bookingData }] = await Promise.all([
          API.get("/user/profile"),
          API.get("/user/bookings"),
        ]);

        if (!cancelled) {
          setFormData((current) => ({
            ...current,
            name: data?.user?.name ?? data?.user?.username ?? "",
            email: data?.user?.email ?? "",
            phone: data?.user?.phone ?? "",
          }));
          setBookings(toArray(bookingData?.bookings));
          syncUserInLS(data?.user ?? null);
        }
      } catch (error) {
        if (!cancelled) {
          setMessageTone("error");
          setMessage(error?.response?.data?.message || error.message || "Unable to load profile");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [syncUserInLS, token]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (message) {
      setMessage("");
      setMessageTone("info");
    }
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!token) return;

    if (formData.newPassword && !formData.currentPassword) {
      setMessageTone("error");
      setMessage("Enter your current password to set a new password.");
      return;
    }

    if (formData.newPassword && formData.newPassword.length < 7) {
      setMessageTone("error");
      setMessage("New password must be at least 7 characters.");
      return;
    }

    setSaving(true);
    setMessage("");
    setMessageTone("info");

    try {
      const { data } = await API.put("/user/update", {
        ...formData,
        username: formData.name,
      });

      syncUserInLS(data?.user ?? null);
      setFormData((current) => ({
        ...current,
        currentPassword: "",
        newPassword: "",
      }));
      setMessageTone("success");
      setMessage(
        formData.newPassword
          ? "Profile updated and password changed successfully."
          : data?.message || "Profile updated successfully"
      );
    } catch (requestError) {
      setMessageTone("error");
      setMessage(requestError?.response?.data?.message || "Unable to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (!token) {
    return null;
  }

  if (loading) {
    return <PageSection><PageShell><SurfaceCard className="p-10 text-center text-ink-500">Loading profile...</SurfaceCard></PageShell></PageSection>;
  }

  return (
    <PageSection className="pt-12 sm:pt-16">
      <PageShell className="space-y-8">
        <PageIntro
          kicker="My profile"
          title="Manage your account details and password in one place."
          description="Keep your information current so bookings, wishlist items, and account access stay smooth."
        />
        {message ? <InfoBanner tone={messageTone}>{message}</InfoBanner> : null}

        <div className="grid gap-8 xl:grid-cols-[0.78fr_1.22fr]">
          <SurfaceCard className="space-y-5 p-8">
            {[
              ["Name", formData.name || "Not set"],
              ["Email", formData.email || "Not set"],
              ["Phone", formData.phone || "Not set"],
            ].map(([label, value]) => (
              <div key={label} className="border-b border-brand-100 pb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">{label}</p>
                <p className="mt-2 text-base font-semibold text-ink-900">{value}</p>
              </div>
            ))}
          </SurfaceCard>

          <form onSubmit={handleSubmit} className="min-w-0">
            <SurfaceCard className="space-y-6 p-8">
              <div>
                <p className="text-sm font-semibold text-ink-500">Edit profile</p>
                <h2 className="mt-1 panel-title">Update your details</h2>
                <p className="mt-2 text-sm text-ink-500">Changes will be saved to your account and used in future bookings.</p>
              </div>

            <FormField label="Name">
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" size={18} />
                <TextInput className="pl-11" name="name" value={formData.name} onChange={handleChange} placeholder="Your name" required />
              </div>
            </FormField>

            <FormField label="Email">
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" size={18} />
                <TextInput className="pl-11" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Your email" required />
              </div>
            </FormField>

            <FormField label="Phone">
              <div className="relative">
                <Phone className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" size={18} />
                <TextInput className="pl-11" name="phone" value={formData.phone} onChange={handleChange} placeholder="Your phone number" required />
              </div>
            </FormField>

            <div className="border-t border-ink-100 pt-6">
              <p className="text-sm font-semibold text-ink-500">Change password</p>
              <h3 className="mt-1 text-xl text-ink-900" style={{ fontFamily: "var(--font-display)" }}>Optional security update</h3>
            </div>

            <FormField label="Current Password">
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" size={18} />
                <TextInput className="pl-11" name="currentPassword" type="password" value={formData.currentPassword} onChange={handleChange} placeholder="Enter current password" />
              </div>
            </FormField>

            <FormField label="New Password">
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" size={18} />
                <TextInput className="pl-11" name="newPassword" type="password" value={formData.newPassword} onChange={handleChange} placeholder="Enter new password" />
              </div>
            </FormField>

              <button type="submit" className="btn-primary w-full" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </SurfaceCard>
          </form>
        </div>

        <SurfaceCard className="space-y-6 p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink-500">Booking history</p>
              <h2 className="mt-1 panel-title">Your recent bookings</h2>
              <p className="mt-2 text-sm text-ink-500">Track booking status, payment progress, and jump back into pending payments from your profile.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[360px]">
              {[
                { label: "Pending", value: toArray(bookings).filter((booking) => booking?.bookingStatus === "pending").length, accent: "bg-amber-100 text-amber-700" },
                { label: "Confirmed", value: toArray(bookings).filter((booking) => booking?.bookingStatus === "confirmed").length, accent: "bg-sky-100 text-sky-700" },
                { label: "Cancelled", value: toArray(bookings).filter((booking) => booking?.bookingStatus === "cancelled").length, accent: "bg-rose-100 text-rose-700" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-brand-100 bg-brand-50/40 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-ink-400">{item.label}</p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xl font-semibold text-ink-900">{item.value}</p>
                    <span className={`rounded-xl px-2.5 py-1 text-[11px] font-semibold ${item.accent}`}>{item.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {toArray(bookings).length === 0 ? (
            <div className="rounded-xl border border-dashed border-brand-200 bg-brand-50/30 px-6 py-10 text-center">
              <p className="text-base font-semibold text-ink-900">No bookings yet</p>
              <p className="mt-2 text-sm text-ink-500">Once you book a PG, the history will appear here with payment and booking status.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {toArray(bookings).map((booking) => (
                <div key={booking._id} className="rounded-xl border border-brand-100 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-4">
                      <div>
                        <p className="text-lg font-semibold text-ink-900">{booking.pg?.title || "PG not available"}</p>
                        <p className="mt-1 text-sm text-ink-500">
                          {[booking.pg?.area, booking.pg?.city].filter(Boolean).join(", ") || booking.pg?.address || "Location not available"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className={`inline-flex rounded-xl px-3 py-1 text-xs font-medium ${bookingTone(booking.bookingStatus)}`}>
                          Booking: {booking.bookingStatus || "pending"}
                        </span>
                        <span className={`inline-flex rounded-xl px-3 py-1 text-xs font-medium ${paymentTone(booking.paymentStatus)}`}>
                          Payment: {booking.paymentStatus || "pending"}
                        </span>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-xl bg-ink-50 p-4">
                          <div className="mb-2 text-ink-500"><CalendarClock size={18} /></div>
                          <p className="text-xs uppercase tracking-[0.16em] text-ink-400">Check-in</p>
                          <p className="mt-2 text-sm font-semibold text-ink-900">{formatDate(booking.checkInDate)}</p>
                        </div>
                        <div className="rounded-xl bg-ink-50 p-4">
                          <div className="mb-2 text-ink-500"><House size={18} /></div>
                          <p className="text-xs uppercase tracking-[0.16em] text-ink-400">Duration</p>
                          <p className="mt-2 text-sm font-semibold text-ink-900">{booking.durationMonths || 0} month{Number(booking.durationMonths) === 1 ? "" : "s"}</p>
                        </div>
                        <div className="rounded-xl bg-ink-50 p-4">
                          <div className="mb-2 text-ink-500"><CreditCard size={18} /></div>
                          <p className="text-xs uppercase tracking-[0.16em] text-ink-400">Amount</p>
                          <p className="mt-2 text-sm font-semibold text-ink-900">{formatCurrency(booking.totalAmount)}</p>
                        </div>
                        <div className="rounded-xl bg-ink-50 p-4">
                          <div className="mb-2 text-ink-500"><CalendarClock size={18} /></div>
                          <p className="text-xs uppercase tracking-[0.16em] text-ink-400">Booked on</p>
                          <p className="mt-2 text-sm font-semibold text-ink-900">{formatDate(booking.createdAt)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex w-full min-w-0 flex-col gap-3 lg:w-auto lg:min-w-[210px]">
                      <div className="rounded-xl bg-brand-50/60 p-4 text-sm text-ink-600">
                        <p className="font-semibold text-ink-900">Payment method</p>
                        <p className="mt-1">{booking.paymentMethod ? booking.paymentMethod.replaceAll("_", " ") : "Pending selection"}</p>
                        <p className="mt-3 font-semibold text-ink-900">Transaction ID</p>
                        <p className="mt-1 break-all">{booking.transactionId || "Will appear after payment is processed"}</p>
                      </div>

                      {booking.bookingStatus !== "cancelled" && booking.paymentStatus !== "paid" ? (
                        <Link to={`/payment/${booking._id}`} className="btn-primary w-full text-center">
                          Continue Payment
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SurfaceCard>
      </PageShell>
    </PageSection>
  );
}



import { useEffect, useState } from "react";
import { KeyRound, Mail, Phone, UserRound } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth-context";
import { API } from "../utils/api";
import { FormField, InfoBanner, PageIntro, PageSection, PageShell, SurfaceCard, TextInput } from "../components/ui.jsx";

export function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, syncUserInLS } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
        const { data } = await API.get("/user/profile");

        if (!cancelled) {
          setFormData((current) => ({
            ...current,
            name: data?.user?.name ?? data?.user?.username ?? "",
            email: data?.user?.email ?? "",
            phone: data?.user?.phone ?? "",
          }));
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

        <div className="grid gap-10 xl:grid-cols-[0.78fr_1.22fr]">
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

          <form onSubmit={handleSubmit}>
            <SurfaceCard className="space-y-6 p-8">
            <div>
              <p className="text-sm font-semibold text-ink-500">Edit profile</p>
              <h2 className="mt-1 panel-title">Update your details</h2>
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
      </PageShell>
    </PageSection>
  );
}

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react";
import { useAuth } from "../store/auth-context.js";
import { API } from "../utils/api.js";
import { FormField, InfoBanner, PageSection, PageShell, SurfaceCard, TextInput } from "../components/ui.jsx";
import { getRoleHome, getSafeReturnPath } from "../utils/navigation.js";
import { toastError, toastSuccess } from "../utils/toast.js";

export const Login = () => {
  const [formError, setFormError] = useState("");
  const [formTone, setFormTone] = useState("error");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { storeTokenInLS, token, user: currentUser } = useAuth();
  const redirectTo = getSafeReturnPath(location.state?.from) || getRoleHome(currentUser);

  const { register, handleSubmit: rhfHandleSubmit, formState: { errors } } = useForm({
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (!location.state?.flashMessage) return;

    setFormError(location.state.flashMessage);
    setFormTone(location.state.flashTone === "success" ? "success" : "error");
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  if (token && currentUser) {
    return <Navigate to={redirectTo === "/login" || redirectTo === "/register" ? getRoleHome(currentUser) : redirectTo} replace />;
  }

  const onSubmit = async (values) => {
    setFormError("");
    setFormTone("error");
    setSubmitting(true);
    try {
      const { data } = await API.post("/auth/login", values);
      if (data?.token) {
        storeTokenInLS(data.token, data.user ?? null);
        const nextPath = getSafeReturnPath(location.state?.from);
        toastSuccess("Login successful.");
        navigate(
          nextPath === "/login" || nextPath === "/register" ? getRoleHome(data.user) : nextPath || getRoleHome(data.user),
          {
            replace: true,
            state: {
              flashMessage: "Login successful.",
              flashTone: "success",
            },
          }
        );
      }
    } catch (error) {
      console.error("Login error:", error);
      const apiMessage = error?.response?.data?.message;
      const apiDetails = error?.response?.data?.details;
      const detailMessage = Array.isArray(apiDetails) && apiDetails.length ? apiDetails[0] : "";
      const message = detailMessage || apiMessage || "Login failed. Please try again.";
      setFormError(message);
      setFormTone("error");
      toastError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageSection className="pt-10 sm:pt-14">
      <PageShell className="flex justify-center">
        <SurfaceCard className="w-full max-w-lg border-sky-200 bg-gradient-to-b from-sky-50 to-white p-6 shadow-[0_24px_60px_-30px_rgba(38,139,201,0.42)] sm:p-8">
          <span className="inline-flex rounded-xl border border-sky-200 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-sky-700">
            Welcome Back
          </span>
          <h2 className="text-[2rem] tracking-tight text-ink-900" style={{ fontFamily: "var(--font-display)" }}>
            Login to your account
          </h2>
          <p className="mt-2 text-sm text-ink-500">Enter your email and password to continue.</p>

          {formError ? <InfoBanner tone={formTone} className="mt-6">{formError}</InfoBanner> : null}

          <form onSubmit={rhfHandleSubmit(onSubmit)} className="mt-6 space-y-4">
            <FormField label="Email">
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" size={18} />
                <TextInput
                  className="pl-11"
                  type="email"
                  placeholder="Enter email"
                  {...register("email", { required: "Email is required" })}
                />
              </div>
              {errors.email ? <p className="text-xs text-rose-600">{errors.email.message}</p> : null}
            </FormField>
            <FormField label="Password">
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" size={18} />
                <TextInput
                  className="pl-11"
                  type="password"
                  placeholder="Enter password"
                  {...register("password", { required: "Password is required" })}
                />
              </div>
              {errors.password ? <p className="text-xs text-rose-600">{errors.password.message}</p> : null}
            </FormField>
            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting ? "Logging in..." : "Login"}
              <ArrowRight size={16} />
            </button>
          </form>

          <p className="mt-6 text-sm text-ink-500">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="font-semibold text-brand-700">
              Register
            </Link>
          </p>
        </SurfaceCard>
      </PageShell>
    </PageSection>
  );
};



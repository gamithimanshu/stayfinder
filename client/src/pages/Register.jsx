import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, LockKeyhole, Mail, Phone, UserRound } from "lucide-react";
import { useAuth } from "../store/auth-context.js";
import { API } from "../utils/api.js";
import { FormField, InfoBanner, PageSection, PageShell, SurfaceCard, TextInput } from "../components/ui.jsx";
import { getRoleHome, getSafeReturnPath } from "../utils/navigation.js";
import { toastError, toastSuccess } from "../utils/toast.js";

export const Register = () => {
  const [formError, setFormError] = useState("");
  const [formTone, setFormTone] = useState("error");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { storeTokenInLS, token, user: currentUser } = useAuth();
  const redirectTo = getSafeReturnPath(location.state?.from) || getRoleHome(currentUser);

  const { register, handleSubmit: rhfHandleSubmit, formState: { errors } } = useForm({
    defaultValues: { name: "", email: "", phone: "", password: "", role: "user" },
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
      const payload = {
        name: values.name,
        email: values.email,
        phone: values.phone,
        password: values.password,
        role: values.role,
      };
      const { data } = await API.post("/auth/register", payload);
      if (data?.token) {
        storeTokenInLS(data.token, data.user ?? null);
        const nextPath = getSafeReturnPath(location.state?.from);
        toastSuccess("Registration successful.");
        navigate(
          nextPath === "/login" || nextPath === "/register" ? getRoleHome(data.user) : nextPath || getRoleHome(data.user),
          {
            replace: true,
            state: {
              flashMessage: "Registration successful.",
              flashTone: "success",
            },
          }
        );
      }
    } catch (error) {
      console.error("Register error:", error);
      const apiMessage = error?.response?.data?.message;
      const apiDetails = error?.response?.data?.details;
      const detailMessage = Array.isArray(apiDetails) && apiDetails.length ? apiDetails[0] : "";
      const message = detailMessage || apiMessage || "Unable to create account.";
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
            New Account
          </span>
          <h2 className="text-[2rem] tracking-tight text-ink-900" style={{ fontFamily: "var(--font-display)" }}>
            Create account
          </h2>
          <p className="mt-2 text-sm text-ink-500">A few details are all you need to get started.</p>

          {formError ? <InfoBanner tone={formTone} className="mt-6">{formError}</InfoBanner> : null}

          <form onSubmit={rhfHandleSubmit(onSubmit)} className="mt-6 space-y-4">
            <FormField label="Full name">
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" size={18} />
                <TextInput
                  className="pl-11"
                  type="text"
                  placeholder="Enter your name"
                  {...register("name", {
                    required: "Name is required",
                    minLength: { value: 3, message: "Name must be at least 3 characters" },
                  })}
                />
              </div>
              {errors.name ? <p className="text-xs text-rose-600">{errors.name.message}</p> : null}
            </FormField>
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
            <FormField label="Phone">
              <div className="relative">
                <Phone className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" size={18} />
                <TextInput
                  className="pl-11"
                  type="tel"
                  placeholder="Enter phone"
                  {...register("phone", {
                    required: "Phone is required",
                    minLength: { value: 10, message: "Phone must be at least 10 characters" },
                    maxLength: { value: 20, message: "Phone must not be more than 20 characters" },
                  })}
                />
              </div>
              {errors.phone ? <p className="text-xs text-rose-600">{errors.phone.message}</p> : null}
            </FormField>
            <FormField label="Account type">
              <select className="input-base" defaultValue="user" {...register("role", { required: true })}>
                <option value="user">User</option>
                <option value="owner">Owner</option>
              </select>
            </FormField>
            <FormField label="Password">
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" size={18} />
                <TextInput
                  className="pl-11"
                  type="password"
                  placeholder="Create password"
                  {...register("password", { required: "Password is required", minLength: { value: 7, message: "Password must be at least 7 characters" } })}
                />
              </div>
              {errors.password ? <p className="text-xs text-rose-600">{errors.password.message}</p> : null}
            </FormField>
            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting ? "Creating account..." : "Register"}
              <ArrowRight size={16} />
            </button>
          </form>

          <p className="mt-6 text-sm text-ink-500">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-brand-700">
              Login
            </Link>
          </p>
        </SurfaceCard>
      </PageShell>
    </PageSection>
  );
};



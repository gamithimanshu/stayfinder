import { Link } from "react-router-dom";
import { MessageSquare, Star } from "lucide-react";
import { cn } from "../utils/cn";
import { FALLBACK_PG_IMAGE } from "../utils/pg";

export function PageSection({ className = "", children }) {
  return <section className={cn("page-section", className)}>{children}</section>;
}

export function PageShell({ className = "", children }) {
  return <div className={cn("page-shell", className)}>{children}</div>;
}

export function SectionHeading({ kicker, title, description, align = "left" }) {
  const centered = align === "center";

  return (
    <div className={cn("space-y-4", centered && "mx-auto max-w-3xl text-center")}>
      {kicker ? <span className="section-kicker">{kicker}</span> : null}
      <h2 className={cn("section-title", centered && "mx-auto max-w-3xl")}>{title}</h2>
      {description ? <p className={cn("section-copy", centered && "mx-auto")}>{description}</p> : null}
    </div>
  );
}

export function PageIntro({ kicker, title, description, actions, className = "" }) {
  return (
    <div className={cn("flex flex-col gap-5 border-b border-black/5 pb-8 sm:flex-row sm:items-end sm:justify-between", className)}>
      <SectionHeading kicker={kicker} title={title} description={description} />
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}

export function SurfaceCard({ className = "", children }) {
  return <div className={cn("surface-card", className)}>{children}</div>;
}

export function SafeImage({ src, fallbackSrc = FALLBACK_PG_IMAGE, onError, ...props }) {
  const resolvedSrc = src || fallbackSrc;

  return (
    <img
      {...props}
      src={resolvedSrc}
      onError={(event) => {
        onError?.(event);

        if (event.currentTarget.dataset.fallbackApplied === "true") {
          return;
        }

        event.currentTarget.dataset.fallbackApplied = "true";
        event.currentTarget.src = fallbackSrc;
      }}
    />
  );
}

export function InfoBanner({ tone = "info", className = "", children }) {
  const styles = {
    info: "border-brand-200 bg-brand-50/80 text-brand-900",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    error: "border-rose-200 bg-rose-50 text-rose-800",
  };

  return (
    <div className={cn("rounded-md border px-4 py-3 text-sm", styles[tone] ?? styles.info, className)}>
      {children}
    </div>
  );
}

export function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="surface-card p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-ink-500">{label}</p>
          <p className="mt-2 text-3xl text-ink-900" style={{ fontFamily: "var(--font-display)" }}>{value}</p>
        </div>
        {Icon ? (
          <div className="gradient-primary rounded-xl p-3 text-white">
            <Icon size={22} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function EmptyState({ title, description, actionLabel, actionTo }) {
  return (
    <div className="rounded-xl border border-dashed border-brand-200 bg-white/85 px-6 py-12 text-center shadow-[0_18px_50px_-28px_rgba(30,25,18,0.35)]">
      <h3 className="text-xl font-semibold text-ink-900">{title}</h3>
      <p className="mx-auto mt-3 max-w-xl text-sm text-ink-500">{description}</p>
      {actionLabel && actionTo ? (
        <Link to={actionTo} className="btn-primary mt-6">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

export function FormField({ label, hint, children }) {
  return (
    <label className="block min-w-0 space-y-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="min-w-0 text-sm font-medium text-ink-700">{label}</span>
        {hint ? <span className="text-xs text-ink-400">{hint}</span> : null}
      </div>
      {children}
    </label>
  );
}

export function TextInput({ className = "", ...props }) {
  return <input className={cn("input-base", className)} {...props} />;
}

export function TextArea({ className = "", ...props }) {
  return <textarea className={cn("input-base min-h-32 resize-y", className)} {...props} />;
}

export function SelectInput({ className = "", ...props }) {
  return <select className={cn("input-base", className)} {...props} />;
}

export function RatingPill({ averageRating, reviewCount, className = "", compact = false }) {
  if (!reviewCount || !averageRating) {
    return (
      <span className={cn("inline-flex items-center gap-2 rounded-xl bg-ink-100 px-3 py-1.5 text-sm font-medium text-ink-500", className)}>
        <MessageSquare size={14} />
        No ratings yet
      </span>
    );
  }

  const filledStars = Math.floor(averageRating);
  const hasHalfLook = averageRating - filledStars >= 0.5;

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-sm shadow-slate-200", className)}>
        <div className="flex items-center gap-1 text-yellow-500">
          {Array.from({ length: 5 }).map((_, index) => {
            const isFilled = index < filledStars;
            const isHalf = !isFilled && index === filledStars && hasHalfLook;

            return (
              <Star
                key={`compact-star-${index}`}
                size={14}
                className={cn(isFilled || isHalf ? "fill-current" : "fill-transparent text-slate-300")}
              />
            );
          })}
        </div>
        <span className="text-sm font-medium text-slate-500">
          {averageRating.toFixed(1)} out of 5 stars
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2 rounded-xl bg-white px-4 py-3 shadow-lg shadow-slate-200", className)}>
      <div className="flex items-center gap-1 lg:gap-2">
        {Array.from({ length: 5 }).map((_, index) => {
          const isFilled = index < filledStars;
          const isHalf = !isFilled && index === filledStars && hasHalfLook;

          return (
            <Star
              key={`rating-star-${index}`}
              size={18}
              className={cn("h-5 w-5 text-yellow-500", isFilled || isHalf ? "fill-current" : "fill-transparent text-yellow-500/45")}
            />
          );
        })}
      </div>
      <span className="text-sm font-medium text-slate-500">
        {averageRating.toFixed(1)} out of 5 stars
      </span>
    </div>
  );
}

export function PropertyCard({
  listing,
  to,
  badge,
  footer,
  overlay,
}) {
  return (
    <Link to={to} className="group block h-full">
      <article className="surface-card h-full overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_60px_-30px_rgba(30,25,18,0.45)]">
        <div className="relative h-56 overflow-hidden bg-ink-100">
          <SafeImage
            src={listing.image || FALLBACK_PG_IMAGE}
            alt={listing.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-900/75 via-ink-900/10 to-transparent" />
          {badge ? <div className="absolute left-4 top-4">{badge}</div> : null}
          {overlay ? <div className="absolute bottom-4 left-4 right-4">{overlay}</div> : null}
        </div>
        <div className="flex flex-1 flex-col gap-4 p-5">
          <div className="space-y-2">
            <h3 className="text-[1.35rem] leading-tight text-ink-900" style={{ fontFamily: "var(--font-display)" }}>{listing.title}</h3>
            <p className="text-sm text-ink-500">{listing.location}</p>
          </div>
          <div className="flex items-center justify-between gap-4">
            <p className="text-xl font-semibold text-ink-900">
              Rs. {Number(listing.price || 0).toLocaleString()}
              <span className="ml-1 text-sm font-medium text-ink-400">/month</span>
            </p>
            {footer}
          </div>
        </div>
      </article>
    </Link>
  );
}



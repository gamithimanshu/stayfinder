import { Building2, MapPinned, ShieldCheck, Sparkles, Users } from "lucide-react";
import { PageIntro, PageSection, PageShell, SectionHeading } from "../components/ui.jsx";

const features = [
  {
    icon: Building2,
    title: "Verified PG discovery",
    description: "Browse accommodation options designed for students, interns, and working professionals.",
  },
  {
    icon: MapPinned,
    title: "Smarter city search",
    description: "Filter by location, budget, and stay preferences to find a better-fit property faster.",
  },
  {
    icon: ShieldCheck,
    title: "Owner and admin workflow",
    description: "Support listing management, approvals, bookings, and cleaner platform operations.",
  },
];

export const About = () => {
  return (
    <>
      <PageSection className="pt-12 sm:pt-16">
        <PageShell>
          <PageIntro
            kicker="About StayFinder"
            title="Built to make finding a PG or hostel feel clear, trustworthy, and fast."
            description="StayFinder is a full-stack accommodation platform that helps people moving to a new city search, compare, and decide with more confidence."
          />
        </PageShell>
      </PageSection>

      <PageSection>
        <PageShell className="grid gap-10 lg:grid-cols-2">
          <div className="surface-card p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">Project info</p>
            <h2 className="panel-title">What this project brings together</h2>
            <p className="mt-4 text-sm leading-7 text-ink-500">
              The platform combines public discovery pages, detailed PG views, wishlist and booking flows, owner listing management, and admin approval tools into one coherent experience.
            </p>
            <p className="text-sm leading-7 text-ink-500">
              It is designed to feel helpful to residents while still supporting the real operational needs of owners and administrators.
            </p>
          </div>

          <div className="gradient-hero rounded-xl px-6 py-7 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">Mission</p>
            <h2 className="mt-3 text-2xl text-white" style={{ fontFamily: "var(--font-display)" }}>Reduce the stress of accommodation search.</h2>
            <p className="mt-4 text-sm leading-7 text-white/75">
              We want users to discover better-fit properties faster, compare them more easily, and trust the process from search to booking.
            </p>
            <div className="mt-6 space-y-3 border-t border-white/10 pt-6">
              <div className="flex items-center gap-3 px-1 py-2 text-sm text-white/85">
                <Users size={18} className="text-sky-300" />
                <span className="text-sm">Help residents choose confidently</span>
              </div>
              <div className="flex items-center gap-3 px-1 py-2 text-sm text-white/85">
                <Sparkles size={18} className="text-sky-300" />
                <span className="text-sm">Make the full stay-search journey smoother</span>
              </div>
            </div>
          </div>
        </PageShell>
      </PageSection>

      <PageSection>
        <PageShell className="space-y-8">
          <SectionHeading
            kicker="Features"
            title="What StayFinder is designed to support"
            description="These are the core areas the product focuses on across residents, owners, and admins."
          />
          <div className="grid gap-8 border-t border-brand-100 pt-8 md:grid-cols-3">
            {features.map((item) => (
              <div key={item.title} className="surface-card p-6">
                <div className="gradient-primary flex h-12 w-12 items-center justify-center rounded-xl text-white">
                  <item.icon size={20} />
                </div>
                <h3 className="mt-5 text-xl text-ink-900" style={{ fontFamily: "var(--font-display)" }}>{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-ink-500">{item.description}</p>
              </div>
            ))}
          </div>
        </PageShell>
      </PageSection>
    </>
  );
};



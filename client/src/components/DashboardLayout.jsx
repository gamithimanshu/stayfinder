import { createElement } from "react";
import { BookOpenCheck, Building2, CheckCircle2, LayoutDashboard, PlusCircle, Users2 } from "lucide-react";
import { NavLink } from "react-router-dom";
import { PageShell } from "./ui.jsx";
import { cn } from "../utils/cn";

const navigation = {
  owner: {
    label: "Owner workspace",
    items: [
      { to: "/owner", label: "Dashboard", icon: LayoutDashboard },
      { to: "/owner/add", label: "Add PG", icon: PlusCircle },
      { to: "/owner/manage", label: "Manage PGs", icon: Building2 },
    ],
  },
  admin: {
    label: "Admin workspace",
    items: [
      { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { to: "/admin/bookings", label: "Bookings", icon: BookOpenCheck },
      { to: "/admin/approve", label: "Approve PG", icon: CheckCircle2 },
      { to: "/admin/users", label: "Users", icon: Users2 },
    ],
  },
};

export function DashboardLayout({ role, kicker, title, description, actions, children }) {
  const config = navigation[role];
  const items = Array.isArray(config?.items) ? config.items : [];

  if (!config) {
    return children;
  }

  return (
    <section className="page-section pt-6 sm:pt-8">
      <PageShell>
        <div className="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-8 lg:items-start">
          <aside className="lg:sticky lg:top-[5.5rem] lg:self-start">
            <div className="overflow-hidden border border-brand-100 bg-white/92 shadow-[0_18px_50px_-28px_rgba(30,25,18,0.2)] backdrop-blur-sm lg:min-h-[calc(100vh-7rem)]">
              <div className="border-b border-brand-100 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">{config.label}</p>
              </div>
              <nav className="flex gap-2 overflow-x-auto p-3 lg:flex-col lg:gap-1 lg:overflow-visible lg:p-4">
                {items.map(({ to, label, icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      cn(
                        "flex min-w-fit items-center gap-3 whitespace-nowrap border border-transparent px-3 py-3 text-sm font-medium transition lg:w-full",
                        isActive
                          ? "border-sky-100 bg-sky-50 text-sky-800"
                          : "text-ink-600 hover:border-ink-100 hover:bg-ink-50 hover:text-ink-900"
                      )
                    }
                  >
                    {createElement(icon, { size: 17 })}
                    <span>{label}</span>
                  </NavLink>
                ))}
              </nav>
            </div>
          </aside>

          <div className="min-w-0 space-y-8">
            <div className="flex min-w-0 flex-col gap-5 border-b border-brand-100 pb-7 md:flex-row md:items-end md:justify-between">
              <div className="min-w-0 space-y-3">
                {kicker ? <p className="text-sm font-semibold text-sky-700">{kicker}</p> : null}
                <div className="min-w-0 space-y-2">
                  <h1 className="text-3xl tracking-tight text-ink-900 sm:text-[2.2rem]" style={{ fontFamily: "var(--font-display)" }}>
                    {title}
                  </h1>
                  {description ? <p className="max-w-3xl text-sm leading-7 text-ink-500 sm:text-[15px]">{description}</p> : null}
                </div>
              </div>
              {actions ? <div className="flex min-w-0 flex-wrap gap-3 md:justify-end">{actions}</div> : null}
            </div>

            {children}
          </div>
        </div>
      </PageShell>
    </section>
  );
}

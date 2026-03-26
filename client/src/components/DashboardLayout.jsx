import { createElement } from "react";
import { Building2, CheckCircle2, LayoutDashboard, PlusCircle, Users2 } from "lucide-react";
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
      { to: "/admin/approve", label: "Approve PG", icon: CheckCircle2 },
      { to: "/admin/users", label: "Users", icon: Users2 },
    ],
  },
};

export function DashboardLayout({ role, kicker, title, description, actions, children }) {
  const config = navigation[role];

  if (!config) {
    return children;
  }

  return (
    <section className="page-section pt-10 sm:pt-12">
      <PageShell>
        <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start">
          <aside className="lg:sticky lg:top-24">
            <div className="border border-brand-100 bg-white">
              <div className="border-b border-brand-100 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">{config.label}</p>
              </div>
              <nav className="flex gap-2 overflow-x-auto p-3 lg:block lg:space-y-1 lg:overflow-visible">
                {config.items.map(({ to, label, icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      cn(
                        "flex min-w-fit items-center gap-3 whitespace-nowrap px-3 py-2.5 text-sm font-medium transition lg:w-full",
                        isActive
                          ? "bg-sky-50 text-sky-800"
                          : "text-ink-600 hover:bg-ink-50 hover:text-ink-900"
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

          <div className="space-y-8">
            <div className="flex flex-col gap-5 border-b border-brand-100 pb-7 md:flex-row md:items-end md:justify-between">
              <div className="space-y-3">
                {kicker ? <p className="text-sm font-semibold text-sky-700">{kicker}</p> : null}
                <div className="space-y-2">
                  <h1 className="text-3xl tracking-tight text-ink-900 sm:text-[2.2rem]" style={{ fontFamily: "var(--font-display)" }}>
                    {title}
                  </h1>
                  {description ? <p className="max-w-3xl text-sm leading-7 text-ink-500 sm:text-[15px]">{description}</p> : null}
                </div>
              </div>
              {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
            </div>

            {children}
          </div>
        </div>
      </PageShell>
    </section>
  );
}

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SurfaceCard } from "../ui.jsx";
import { formatDashboardCount, formatDashboardCurrency } from "./dashboardFormatters.js";

const DEFAULT_ANIM_DURATION = 500;

const safeNumber = (value) => {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
};

const toSeriesRows = (chart) => {
  const labels = Array.isArray(chart?.labels) ? chart.labels : [];
  const datasets = Array.isArray(chart?.datasets) ? chart.datasets : [];

  return labels.map((label, index) => {
    const row = { label };

    datasets.forEach((dataset) => {
      row[dataset.label] = safeNumber(dataset?.data?.[index]);
    });

    return row;
  });
};

const hasData = (chart) => {
  const datasets = Array.isArray(chart?.datasets) ? chart.datasets : [];
  return datasets.some((dataset) => Array.isArray(dataset?.data) && dataset.data.some((value) => safeNumber(value) > 0));
};

function EmptyChartState({ message = "No chart data available yet." }) {
  return (
    <div className="flex h-[260px] items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-center text-sm text-slate-500">
      <p className="max-w-xs">{message}</p>
    </div>
  );
}

function ChartCardShell({ title, subtitle, children, footer }) {
  return (
    <SurfaceCard className="rounded-3xl border border-black/5 bg-white/90 p-6 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-ink-700">{title}</p>
          {subtitle ? <p className="mt-1 text-xs text-ink-500">{subtitle}</p> : null}
        </div>
      </div>
      {children}
      {footer ? <div className="mt-4">{footer}</div> : null}
    </SurfaceCard>
  );
}

export function DonutChartCard({ title, subtitle, chart, valueFormatter = formatDashboardCount, emptyMessage }) {
  const safeData = Array.isArray(chart?.points) ? chart.points : [];

  return (
    <ChartCardShell title={title} subtitle={subtitle}>
      {!safeData.length || !safeData.some((entry) => safeNumber(entry.value) > 0) ? (
        <EmptyChartState message={emptyMessage} />
      ) : (
        <>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  formatter={(value, name) => [valueFormatter(value), name]}
                  contentStyle={{ borderRadius: 16, borderColor: "#e2e8f0" }}
                />
                <Pie
                  data={safeData}
                  dataKey="value"
                  nameKey="label"
                  innerRadius="62%"
                  outerRadius="88%"
                  stroke="#ffffff"
                  strokeWidth={4}
                  animationDuration={DEFAULT_ANIM_DURATION}
                >
                  {safeData.map((entry) => (
                    <Cell key={`pie-${entry.label}`} fill={entry.color || "#0f766e"} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 flex flex-wrap gap-3">
            {safeData.map((entry) => (
              <div key={`legend-${entry.label}`} className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color || "#0f766e" }} />
                <span className="text-xs font-medium text-slate-700">
                  {entry.label}: {valueFormatter(entry.value)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </ChartCardShell>
  );
}

export function MultiBarChartCard({ title, subtitle, chart, valueFormatter = formatDashboardCount, emptyMessage }) {
  const rows = toSeriesRows(chart);
  const datasets = Array.isArray(chart?.datasets) ? chart.datasets : [];

  return (
    <ChartCardShell title={title} subtitle={subtitle}>
      {!hasData(chart) ? (
        <EmptyChartState message={emptyMessage} />
      ) : (
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} width={48} />
              <Tooltip
                formatter={(value, name) => [valueFormatter(value), name]}
                contentStyle={{ borderRadius: 16, borderColor: "#e2e8f0" }}
              />
              <Legend />
              {datasets.map((dataset) => (
                <Bar
                  key={dataset.label}
                  dataKey={dataset.label}
                  fill={dataset.color || "#0f766e"}
                  radius={[10, 10, 0, 0]}
                  animationDuration={DEFAULT_ANIM_DURATION}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCardShell>
  );
}

export function TrendChartCard({ title, subtitle, chart, valueFormatter = formatDashboardCurrency, emptyMessage }) {
  const rows = toSeriesRows(chart);
  const primaryDataset = Array.isArray(chart?.datasets) ? chart.datasets[0] : null;

  return (
    <ChartCardShell title={title} subtitle={subtitle}>
      {!hasData(chart) ? (
        <EmptyChartState message={emptyMessage} />
      ) : (
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rows} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="dashboardAreaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={primaryDataset?.color || "#0f766e"} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={primaryDataset?.color || "#0f766e"} stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} width={56} />
              <Tooltip
                formatter={(value, name) => [valueFormatter(value), name]}
                contentStyle={{ borderRadius: 16, borderColor: "#e2e8f0" }}
              />
              <Area
                type="monotone"
                dataKey={primaryDataset?.label}
                stroke={primaryDataset?.color || "#0f766e"}
                fill="url(#dashboardAreaFill)"
                strokeWidth={3}
                animationDuration={DEFAULT_ANIM_DURATION}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCardShell>
  );
}


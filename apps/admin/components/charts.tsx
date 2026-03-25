"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = ["#2563eb", "#16a34a", "#d97706", "#dc2626", "#7c3aed", "#0891b2", "#e11d48", "#059669"];

type TrendPoint = { date: string; count: number };
type NameCount = { name: string; count: number };

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function TrendAreaChart({
  data,
  color = "#2563eb",
  label = "Count",
}: {
  data: TrendPoint[];
  color?: string;
  label?: string;
}) {
  const formatted = data.map((d) => ({ ...d, label: formatDate(d.date) }));
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={formatted} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border, #e5e7eb)" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "var(--text-secondary, #6b7280)" }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: "var(--text-secondary, #6b7280)" }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: "var(--bg-panel, #fff)",
            border: "1px solid var(--border, #e5e7eb)",
            borderRadius: 8,
            fontSize: 13,
          }}
          labelStyle={{ fontWeight: 600 }}
        />
        <Area
          type="monotone"
          dataKey="count"
          name={label}
          stroke={color}
          strokeWidth={2}
          fill={`url(#grad-${color.replace("#", "")})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function HorizontalBarChart({
  data,
  color = "#2563eb",
}: {
  data: NameCount[];
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(data.length * 40, 120)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border, #e5e7eb)" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: "var(--text-secondary, #6b7280)" }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 12, fill: "var(--text-secondary, #6b7280)" }}
          tickLine={false}
          axisLine={false}
          width={100}
        />
        <Tooltip
          contentStyle={{
            background: "var(--bg-panel, #fff)",
            border: "1px solid var(--border, #e5e7eb)",
            borderRadius: 8,
            fontSize: 13,
          }}
        />
        <Bar dataKey="count" fill={color} radius={[0, 4, 4, 0]} barSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DonutChart({
  data,
}: {
  data: NameCount[];
}) {
  const total = data.reduce((s, d) => s + d.count, 0);
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={3}
          dataKey="count"
          nameKey="name"
          stroke="none"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "var(--bg-panel, #fff)",
            border: "1px solid var(--border, #e5e7eb)",
            borderRadius: 8,
            fontSize: 13,
          }}
          formatter={(value, name) => [
            `${value} (${total > 0 ? Math.round((Number(value) / total) * 100) : 0}%)`,
            String(name),
          ]}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function StatusDonutChart({
  approved,
  pending,
  flagged,
}: {
  approved: number;
  pending: number;
  flagged: number;
}) {
  const data = [
    { name: "Approved", count: approved },
    { name: "Pending", count: pending },
    { name: "Flagged", count: flagged },
  ].filter((d) => d.count > 0);

  const colors = ["#16a34a", "#d97706", "#dc2626"];

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={4}
          dataKey="count"
          nameKey="name"
          stroke="none"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "var(--bg-panel, #fff)",
            border: "1px solid var(--border, #e5e7eb)",
            borderRadius: 8,
            fontSize: 13,
          }}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

type PopularRoute = { from_name: string; to_name: string; search_count: number };

export default function AnalyticsPage() {
  const [routes, setRoutes] = useState<PopularRoute[]>([]);

  useEffect(() => {
    fetch("/api/routes?limit=10")
      .then((r) => r.json())
      .then((d) => setRoutes(d.routes ?? []));
  }, []);

  const chartData = routes.map((r) => ({
    name: `${r.from_name} → ${r.to_name}`,
    searches: r.search_count,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Search Analytics</h1>
      <p className="mt-1 text-sm text-slate-500">Which routes people search for most, last 30 days.</p>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
        {chartData.every((d) => d.searches === 0) ? (
          <p className="py-8 text-center text-sm text-slate-400">No search activity recorded yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 24 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="searches" fill="#1a6df2" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

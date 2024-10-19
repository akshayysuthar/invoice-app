"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

export function Overview({ data }) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart
        data={data.length === 1 ? [...data, { name: "", total: 0 }] : data}
        barSize={data.length === 1 ? 100 : 40} // Adjust bar size when only one data point is available
      >
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          minTickGap={data.length === 1 ? 0 : 10} // Adjust tick gap if only one item
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <Bar dataKey="total" fill="#adfa1d" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { pct } from "@/lib/formato";

export type Linha = Record<string, string | number | null>;

const CORES = ["#7c3aed", "#0891b2", "#9ca3af", "#ea580c"];
const eixoPct = (v: number) => `${Math.round(v * 100)}%`;
const dica = (v: unknown) => (typeof v === "number" ? pct(v) : "sem dados");

export function Barras({ dados, x, series, horizontal = false }: { dados: Linha[]; x: string; series: string[]; horizontal?: boolean }) {
  return (
    <ResponsiveContainer width="100%" height={horizontal ? 40 + dados.length * 34 : 300}>
      <BarChart data={dados} layout={horizontal ? "vertical" : "horizontal"} margin={{ left: horizontal ? 40 : 0 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        {horizontal ? (
          <>
            <XAxis type="number" tickFormatter={eixoPct} />
            <YAxis type="category" dataKey={x} width={150} tick={{ fontSize: 12 }} />
          </>
        ) : (
          <>
            <XAxis dataKey={x} tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={eixoPct} />
          </>
        )}
        <Tooltip formatter={dica} />
        <Legend />
        {series.map((s, i) => (
          <Bar key={s} dataKey={s} fill={CORES[i % CORES.length]} isAnimationActive={false} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Linhas({ dados, series }: { dados: Linha[]; series: string[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={dados}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="ano" />
        <YAxis tickFormatter={eixoPct} domain={["auto", "auto"]} />
        <Tooltip formatter={dica} />
        <Legend />
        {series.map((s, i) => (
          <Line key={s} dataKey={s} stroke={CORES[i % CORES.length]} strokeWidth={2} dot connectNulls isAnimationActive={false} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

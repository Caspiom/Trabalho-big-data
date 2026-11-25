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

// Sexo define o matiz (ferrugem = feminino, azul = masculino); raça define o traço (negros contínuo, brancos tracejado).
const COR: Record<string, string> = {
  Feminino: "var(--fem)",
  Masculino: "var(--masc)",
  Demanda: "var(--demanda)",
  Atendimento: "var(--atendimento)",
  "Mulheres negras": "var(--fem)",
  "Mulheres brancas": "var(--fem)",
  "Homens negros": "var(--masc)",
  "Homens brancos": "var(--masc)",
};
const TRACO: Record<string, string | undefined> = { "Mulheres brancas": "6 4", "Homens brancos": "6 4" };

const eixoPct = (v: number) => `${Math.round(v * 100)}%`;
const dica = (v: unknown) => (typeof v === "number" ? pct(v) : "sem dados");
const tick = { fill: "var(--muted)", fontSize: 12 };
const eixo = { stroke: "var(--line-strong)" };
const dicaEstilo = {
  contentStyle: { background: "var(--surface)", border: "1px solid var(--line-strong)", borderRadius: 4, color: "var(--ink)", fontSize: 13 },
  labelStyle: { color: "var(--ink)", fontWeight: 600 },
  itemStyle: { color: "var(--ink)" },
  cursor: { fill: "var(--line)", fillOpacity: 0.5 },
};
const legenda = { wrapperStyle: { fontSize: 13, color: "var(--ink)", paddingTop: 8 } };

export function Barras({ dados, x, series, horizontal = false }: { dados: Linha[]; x: string; series: string[]; horizontal?: boolean }) {
  return (
    <ResponsiveContainer width="100%" height={horizontal ? 56 + dados.length * 38 : 300}>
      <BarChart data={dados} layout={horizontal ? "vertical" : "horizontal"} margin={{ left: horizontal ? 8 : 0 }}>
        <CartesianGrid stroke="var(--line)" vertical={horizontal} horizontal={!horizontal} />
        {horizontal ? (
          <>
            <XAxis type="number" tickFormatter={eixoPct} tick={tick} axisLine={eixo} tickLine={false} />
            <YAxis type="category" dataKey={x} width={150} tick={tick} axisLine={eixo} tickLine={false} />
          </>
        ) : (
          <>
            <XAxis dataKey={x} tick={tick} axisLine={eixo} tickLine={false} />
            <YAxis tickFormatter={eixoPct} tick={tick} axisLine={false} tickLine={false} />
          </>
        )}
        <Tooltip formatter={dica} {...dicaEstilo} />
        <Legend {...legenda} />
        {series.map((s) => (
          <Bar key={s} dataKey={s} fill={COR[s]} radius={horizontal ? [0, 2, 2, 0] : [2, 2, 0, 0]} isAnimationActive={false} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Linhas({ dados, series }: { dados: Linha[]; series: string[] }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={dados}>
        <CartesianGrid stroke="var(--line)" vertical={false} />
        <XAxis dataKey="ano" tick={tick} axisLine={eixo} tickLine={false} />
        <YAxis tickFormatter={eixoPct} domain={["auto", "auto"]} tick={tick} axisLine={false} tickLine={false} />
        <Tooltip formatter={dica} {...dicaEstilo} cursor={{ stroke: "var(--line-strong)" }} />
        <Legend {...legenda} iconType="plainline" />
        {series.map((s) => (
          <Line
            key={s}
            dataKey={s}
            stroke={COR[s]}
            strokeWidth={2.5}
            strokeDasharray={TRACO[s]}
            dot={{ r: 3, fill: COR[s], strokeWidth: 0 }}
            connectNulls
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

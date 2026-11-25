import { N_MINIMO, type LinhaCategoria, type Serie } from "@/lib/comparar";
import { inteiro, pct, pp } from "@/lib/formato";

// No celular o rótulo fica acima da trilha (senão ela encolhe para ~90px); a partir de sm, três colunas.
const COLUNAS = "grid-cols-[minmax(0,1fr)_5rem] sm:grid-cols-[minmax(8rem,12rem)_minmax(0,1fr)_5.5rem]";
const amplitude = (v: number) => `${(v * 100).toFixed(1).replace(".", ",")} p.p.`;

// Gráfico de pontos: uma linha por categoria, um ponto por grupo, todos na mesma escala (posição é o que o olho lê melhor).
// A escala não começa em zero de propósito: o que importa é a distância entre os grupos.
export function Halteres({ linhas, series }: { linhas: LinhaCategoria[]; series: Serie[] }) {
  const taxas = linhas.flatMap((l) => series.flatMap((s) => (l.pontos[s.valor] ? [l.pontos[s.valor]!.taxa] : [])));
  if (taxas.length === 0) return null;
  const min = Math.max(0, Math.floor((Math.min(...taxas) - 0.03) / 0.05 + 1e-9) * 0.05);
  const max = Math.min(1, Math.ceil((Math.max(...taxas) + 0.03) / 0.05 - 1e-9) * 0.05);
  const passo = max - min <= 0.3 ? 0.05 : 0.1;
  const marcas: number[] = [];
  for (let t = Math.ceil(min / passo - 1e-9) * passo; t <= max + 1e-9; t += passo) marcas.push(Math.round(t * 100) / 100);
  const x = (t: number) => `${((t - min) / (max - min)) * 100}%`;
  const dois = series.length === 2;

  return (
    <div>
      <ul className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {series.map((s) => (
          <li key={s.valor} className="flex items-center gap-1.5">
            <span aria-hidden className="size-3 rounded-full" style={{ background: s.cor }} />
            {s.valor}
          </li>
        ))}
      </ul>
      <div aria-hidden="true">
        <div className={`grid items-end gap-3 border-b border-line-strong pb-1 text-xs text-muted ${COLUNAS}`}>
          <span className="hidden sm:block" />
          <div className="relative col-span-2 mx-2 h-4 sm:col-span-1">
            {marcas.map((t) => (
              <span key={t} className="absolute -translate-x-1/2 tabular-nums" style={{ left: x(t) }}>
                {Math.round(t * 100)}%
              </span>
            ))}
          </div>
          <span className="hidden text-right sm:block">{dois ? "Diferença" : "Amplitude"}</span>
        </div>
        <ul>
          {linhas.map((l) => {
            const presentes = series.flatMap((s) => (l.pontos[s.valor] ? [l.pontos[s.valor]!.taxa] : []));
            const lo = Math.min(...presentes);
            const hi = Math.max(...presentes);
            return (
              <li key={l.categoria} className={`grid items-center gap-3 border-b border-line py-2 ${COLUNAS}`}>
                <span className="min-w-0 text-sm leading-tight">{l.categoria}</span>
                <div className="relative order-3 col-span-2 mx-2 h-7 sm:order-none sm:col-span-1">
                  {marcas.map((t) => (
                    <span key={t} className="absolute inset-y-0 w-px bg-line" style={{ left: x(t) }} />
                  ))}
                  {presentes.length >= 2 && (
                    <span
                      className="absolute top-1/2 h-[3px] -translate-y-1/2 rounded bg-line-strong"
                      style={{ left: x(lo), width: `${((hi - lo) / (max - min)) * 100}%` }}
                    />
                  )}
                  {series.map((s) => {
                    const p = l.pontos[s.valor];
                    if (!p) return null;
                    return (
                      <span
                        key={s.valor}
                        title={`${s.valor}: ${pct(p.taxa)} (${inteiro(p.demandadas)} propostas)`}
                        className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-paper"
                        style={{ left: x(p.taxa), background: s.cor, opacity: p.demandadas < N_MINIMO ? 0.4 : 1 }}
                      />
                    );
                  })}
                </div>
                <span className="text-right text-sm tabular-nums">
                  {dois ? (l.diferenca === null ? "–" : pp(l.diferenca)) : l.amplitude === null ? "–" : amplitude(l.amplitude)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

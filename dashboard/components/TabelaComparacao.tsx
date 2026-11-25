import { N_MINIMO, type LinhaCategoria, type Serie } from "@/lib/comparar";
import { inteiro, pct, pp } from "@/lib/formato";

// Números exatos do gráfico: é também a versão acessível dele.
export function TabelaComparacao({ linhas, series, rotuloCategoria }: { linhas: LinhaCategoria[]; series: Serie[]; rotuloCategoria: string }) {
  const dois = series.length === 2;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse text-sm">
        <caption className="sr-only">Taxa de atendimento de cada grupo, por {rotuloCategoria.toLowerCase()}</caption>
        <thead>
          <tr className="border-b border-line-strong text-xs text-muted">
            <th scope="col" className="sticky left-0 bg-paper py-2 pr-3 text-left font-medium">
              {rotuloCategoria}
            </th>
            {series.map((s) => (
              <th key={s.valor} scope="col" className="px-2 py-2 text-right font-medium">
                <span aria-hidden className="mr-1.5 inline-block size-2.5 rounded-full align-baseline" style={{ background: s.cor }} />
                {s.valor}
              </th>
            ))}
            <th scope="col" className="px-2 py-2 text-right font-medium">
              {dois ? "Diferença" : "Amplitude"}
            </th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={l.categoria} className="border-b border-line">
              <th scope="row" className="sticky left-0 bg-paper py-2 pr-3 text-left font-normal">
                {l.categoria}
              </th>
              {series.map((s) => {
                const p = l.pontos[s.valor];
                return (
                  <td key={s.valor} className="px-2 py-2 text-right tabular-nums">
                    {p ? (
                      <span className={p.demandadas < N_MINIMO ? "opacity-50" : undefined} title={p.demandadas < N_MINIMO ? `Só ${p.demandadas} propostas: instável` : undefined}>
                        {pct(p.taxa)} <span className="text-xs text-muted">({inteiro(p.demandadas)})</span>
                      </span>
                    ) : (
                      <span className="text-muted">–</span>
                    )}
                  </td>
                );
              })}
              <td className="px-2 py-2 text-right tabular-nums">
                {dois ? (l.diferenca === null ? "–" : pp(l.diferenca)) : l.amplitude === null ? "–" : `${(l.amplitude * 100).toFixed(1).replace(".", ",")} p.p.`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-muted">Entre parênteses, o número de propostas submetidas. Valores apagados têm menos de {N_MINIMO} propostas.</p>
    </div>
  );
}

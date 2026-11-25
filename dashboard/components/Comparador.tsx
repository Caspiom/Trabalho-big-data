"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { DIMENSOES, rotuloDimensao, type Dimensao, type Permitidos } from "@/lib/comparar";

type Props = {
  dim: Dimensao;
  valores: string[];
  por: Dimensao | null;
  permitidos: Permitidos;
  cores: Record<string, string>;
};

const seletor =
  "h-11 w-full min-w-0 rounded border border-line-strong bg-surface px-2.5 text-sm font-normal text-ink lg:h-10";

// Todo o estado fica na URL (compartilhável); os filtros e o resto da busca são preservados.
export function Comparador({ dim, valores, por, permitidos, cores }: Props) {
  const router = useRouter();
  const caminho = usePathname();
  const atual = useSearchParams();
  const [atualizando, iniciar] = useTransition();

  function ir(alterar: (p: URLSearchParams) => void) {
    const p = new URLSearchParams(atual.toString());
    alterar(p);
    const busca = p.toString();
    iniciar(() => router.push(busca ? `${caminho}?${busca}` : caminho, { scroll: false }));
  }

  // Trocar a dimensão zera os valores e o detalhe, e tira o filtro dela (comparar e filtrar a mesma coisa não faz sentido).
  const trocarDimensao = (nova: string) =>
    ir((p) => {
      p.set("comparar", nova);
      p.delete("v");
      p.delete("por");
      p.delete(nova);
    });

  const alternar = (v: string) =>
    ir((p) => {
      const lista = valores.includes(v) ? valores.filter((x) => x !== v) : [...valores, v];
      if (lista.length === 0) return;
      p.delete("v");
      for (const x of lista) p.append("v", x);
    });

  const marcarTodos = () =>
    ir((p) => {
      p.delete("v");
      for (const x of permitidos[dim]) p.append("v", x);
    });
  const restaurar = () => ir((p) => p.delete("v"));
  const todosMarcados = valores.length === permitidos[dim].length;

  return (
    <section aria-label="Escolha da comparação" className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          Comparar por
          <select className={seletor} value={dim} onChange={(e) => trocarDimensao(e.target.value)}>
            {DIMENSOES.map((d) => (
              <option key={d.chave} value={d.chave}>
                {d.rotulo}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          Detalhar por
          <select
            className={seletor}
            value={por ?? "nenhum"}
            onChange={(e) => ir((p) => p.set("por", e.target.value))}
          >
            <option value="nenhum">Nenhum (só o total)</option>
            {DIMENSOES.filter((d) => d.chave !== dim).map((d) => (
              <option key={d.chave} value={d.chave}>
                {d.rotulo}
              </option>
            ))}
          </select>
        </label>
      </div>
      <fieldset>
        <legend className="mb-2 flex w-full flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-xs font-medium text-muted">
          <span>
            {rotuloDimensao(dim)}: {valores.length} de {permitidos[dim].length} marcados
          </span>
          <span aria-live="polite" className="font-normal">
            {atualizando ? "Consultando…" : valores.length === 2 ? "A diferença é o 1º menos o 2º." : valores.length > 2 ? "Com 3 ou mais, o destaque é a maior menos a menor taxa." : ""}
          </span>
        </legend>
        <div className="mb-2 flex gap-4 text-xs">
          <button type="button" onClick={marcarTodos} disabled={todosMarcados} className="font-medium text-ink underline underline-offset-2 disabled:text-muted disabled:no-underline">
            Marcar todos
          </button>
          <button type="button" onClick={restaurar} className="font-medium text-ink underline underline-offset-2">
            Restaurar padrão
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {permitidos[dim].map((v) => {
            const marcado = valores.includes(v);
            return (
              <button
                key={v}
                type="button"
                aria-pressed={marcado}
                onClick={() => alternar(v)}
                className={`flex min-h-11 items-center gap-2 rounded border px-3 text-sm lg:min-h-9 ${
                  marcado ? "border-ink bg-surface text-ink" : "border-line-strong text-muted hover:border-ink hover:text-ink"
                }`}
              >
                {marcado && <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: cores[v] }} />}
                {v}
              </button>
            );
          })}
        </div>
      </fieldset>
    </section>
  );
}

"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import type { Selecao } from "@/lib/filtros";

type Campo = { chave: keyof Selecao; rotulo: string; opcoes: readonly (string | number)[] };

// Seleção de um gráfico na URL como "<prefixo>_<chave>" repetido; o resto da busca é preservado.
export function BotoesGrafico({ prefixo, campos, selecao }: { prefixo: string; campos: Campo[]; selecao: Selecao }) {
  const router = useRouter();
  const caminho = usePathname();
  const atual = useSearchParams();
  const [atualizando, iniciar] = useTransition();

  const marcados = (chave: keyof Selecao) => (selecao[chave] ?? []).map(String);

  function ir(alterar: (p: URLSearchParams) => void) {
    const p = new URLSearchParams(atual.toString());
    alterar(p);
    const busca = p.toString();
    iniciar(() => router.push(busca ? `${caminho}?${busca}` : caminho, { scroll: false }));
  }

  const alternar = (chave: keyof Selecao, valor: string) =>
    ir((p) => {
      const nome = `${prefixo}_${chave}`;
      const lista = marcados(chave);
      p.delete(nome);
      for (const v of lista.includes(valor) ? lista.filter((x) => x !== valor) : [...lista, valor]) p.append(nome, v);
    });

  const limpar = () => ir((p) => campos.forEach((c) => p.delete(`${prefixo}_${c.chave}`)));
  const algum = campos.some((c) => marcados(c.chave).length > 0);

  return (
    <div className="space-y-2 border-t border-line pt-3">
      <div className="flex items-baseline justify-between gap-4 text-xs text-muted">
        <span aria-live="polite">
          {atualizando ? "Consultando…" : "Nada marcado = todos."}
        </span>
        <button
          type="button"
          onClick={limpar}
          disabled={!algum}
          className="shrink-0 font-medium text-ink underline underline-offset-2 disabled:text-muted disabled:no-underline"
        >
          Limpar
        </button>
      </div>
      {campos.map(({ chave, rotulo, opcoes }) => (
        <div key={chave} role="group" aria-label={rotulo} className="flex flex-wrap items-center gap-1.5">
          <span className="w-20 shrink-0 text-xs font-medium text-muted">{rotulo}</span>
          {opcoes.map((o) => {
            const valor = String(o);
            const marcado = marcados(chave).includes(valor);
            return (
              <button
                key={valor}
                type="button"
                aria-pressed={marcado}
                onClick={() => alternar(chave, valor)}
                className={`min-h-11 rounded border px-2.5 text-sm lg:min-h-8 ${
                  marcado ? "border-ink bg-surface text-ink" : "border-line-strong text-muted hover:border-ink hover:text-ink"
                }`}
              >
                {valor}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

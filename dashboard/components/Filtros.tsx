"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import type { Opcao } from "@/lib/consultas";
import { ANOS, RACAS, SEXOS, type Filtros as F } from "@/lib/filtros";

type Props = {
  filtros: F;
  areas: Opcao[];
  linhas: Opcao[];
  modalidades: Opcao[];
  regioes: Opcao[];
};

const lista = (valores: (string | number)[]) => valores.map((v) => ({ id: v, nome: String(v) }));

export function Filtros({ filtros, areas, linhas, modalidades, regioes }: Props) {
  const router = useRouter();
  const caminho = usePathname();
  const [atualizando, iniciar] = useTransition();

  const campos: { chave: keyof F; rotulo: string; opcoes: { id: string | number; nome: string }[] }[] = [
    { chave: "ano", rotulo: "Ano da chamada", opcoes: lista(ANOS) },
    { chave: "sexo", rotulo: "Sexo", opcoes: lista(SEXOS) },
    { chave: "raca", rotulo: "Raça/cor", opcoes: lista(RACAS) },
    { chave: "area", rotulo: "Grande área", opcoes: areas },
    { chave: "linha", rotulo: "Linha de fomento", opcoes: linhas },
    { chave: "modalidade", rotulo: "Modalidade", opcoes: modalidades },
    { chave: "regiao", rotulo: "Região", opcoes: regioes },
  ];

  function navegar(chave: keyof F | null, valor = "") {
    const params = new URLSearchParams();
    // chave nula = limpar tudo; sem esse teste, o laço devolveria todos os filtros e o botão não faria nada.
    if (chave) {
      for (const [k, v] of Object.entries(filtros)) if (v !== undefined && k !== chave) params.set(k, String(v));
      if (valor) params.set(chave, valor);
    }
    const busca = params.toString();
    iniciar(() => router.push(busca ? `${caminho}?${busca}` : caminho, { scroll: false }));
  }

  const ativos = Object.values(filtros).filter((v) => v !== undefined).length;

  return (
    <section aria-label="Filtros" className="space-y-4">
      <div className="flex items-baseline justify-between border-b border-ink pb-2">
        <h2 className="font-display text-xl">Filtros</h2>
        <span aria-live="polite" className="text-xs text-muted">
          {atualizando ? "Consultando…" : ativos ? `${ativos} ativo${ativos > 1 ? "s" : ""}` : ""}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
        {campos.map(({ chave, rotulo, opcoes }) => (
          <label key={chave} className="flex min-w-0 flex-col gap-1 text-xs font-medium text-muted">
            {rotulo}
            <select
              className={`h-11 w-full min-w-0 truncate rounded border bg-surface px-2.5 text-sm font-normal text-ink lg:h-10 ${
                filtros[chave] !== undefined ? "border-ink" : "border-line-strong"
              }`}
              value={filtros[chave] ?? ""}
              onChange={(e) => navegar(chave, e.target.value)}
            >
              <option value="">Todos</option>
              {opcoes.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nome}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <button
        type="button"
        disabled={ativos === 0}
        onClick={() => navegar(null)}
        className="h-11 w-full rounded border border-line-strong text-sm text-ink hover:border-ink disabled:opacity-40 disabled:hover:border-line-strong lg:h-10"
      >
        Limpar filtros
      </button>
    </section>
  );
}

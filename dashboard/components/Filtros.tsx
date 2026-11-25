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
    for (const [k, v] of Object.entries(filtros)) if (v !== undefined && k !== chave) params.set(k, String(v));
    if (chave && valor) params.set(chave, valor);
    const busca = params.toString();
    iniciar(() => router.push(busca ? `${caminho}?${busca}` : caminho, { scroll: false }));
  }

  const algumFiltro = Object.values(filtros).some((v) => v !== undefined);

  return (
    <section aria-label="Filtros" className="rounded-lg border border-black/10 p-4 dark:border-white/15">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {campos.map(({ chave, rotulo, opcoes }) => (
          <label key={chave} className="flex flex-col gap-1 text-sm">
            <span className="font-medium">{rotulo}</span>
            <select
              className="rounded border border-black/20 bg-transparent px-2 py-1.5 dark:border-white/25"
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
        <div className="flex items-end gap-3 text-sm">
          <button
            type="button"
            disabled={!algumFiltro}
            onClick={() => navegar(null)}
            className="rounded border border-black/20 px-3 py-1.5 disabled:opacity-40 dark:border-white/25"
          >
            Limpar filtros
          </button>
          <span aria-live="polite" className="opacity-70">
            {atualizando ? "Consultando…" : ""}
          </span>
        </div>
      </div>
    </section>
  );
}

import { Suspense } from "react";
import { Cabecalho } from "@/components/Cabecalho";
import { Comparador } from "@/components/Comparador";
import { Esqueleto } from "@/components/Esqueleto";
import { Filtros } from "@/components/Filtros";
import { Linhas, type Linha } from "@/components/Graficos";
import { Halteres } from "@/components/Halteres";
import { Indicador } from "@/components/Indicador";
import { TabelaComparacao } from "@/components/TabelaComparacao";
import { categorias, corDoValor, lerComparacao, N_MINIMO, rotuloDimensao, totais, type Permitidos, type Serie, type Total } from "@/lib/comparar";
import { comparar, opcoes } from "@/lib/consultas";
import { ANOS, lerFiltros, RACAS, SEXOS } from "@/lib/filtros";
import { inteiro, pct, pp } from "@/lib/formato";

export const metadata = { title: "Comparar grupos · Fomento CNPq" };

export default function Page(props: PageProps<"/comparar">) {
  return (
    <main>
      <Cabecalho
        ativo="comparar"
        titulo="Compare grupos lado a lado"
        texto="Escolha uma dimensão, marque de 2 a 4 valores e veja a taxa de atendimento de cada um. Os filtros à esquerda valem para todos os grupos."
      />
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12">
        <Suspense fallback={<Esqueleto />}>
          <Painel searchParams={props.searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function Painel({ searchParams }: Pick<PageProps<"/comparar">, "searchParams">) {
  const params = await searchParams;
  const filtros = lerFiltros(params);
  const dimensoes = await opcoes();
  const nomes = (o: { nome: string }[]) => o.map((x) => x.nome);
  const permitidos: Permitidos = {
    ano: ANOS.map(String),
    sexo: SEXOS,
    raca: RACAS,
    area: nomes(dimensoes.areas),
    linha: nomes(dimensoes.linhas),
    modalidade: nomes(dimensoes.modalidades),
    regiao: nomes(dimensoes.regioes),
  };
  const cmp = lerComparacao(params, permitidos);
  const celulas = await comparar(filtros, cmp);
  const consultadoEm = new Date().toLocaleTimeString("pt-BR", { timeZone: "America/Bahia" });

  const series: Serie[] = cmp.valores.map((valor, i) => ({ valor, cor: corDoValor(cmp.dim, valor, i) }));
  const cores = Object.fromEntries(series.map((s) => [s.valor, s.cor]));
  const resumo = totais(celulas, cmp.valores);
  const linhas = cmp.por ? categorias(celulas, cmp.valores, cmp.por === "ano" ? "natural" : "amplitude") : [];
  const rotuloPor = cmp.por ? rotuloDimensao(cmp.por) : "";

  return (
    <>
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <Filtros filtros={filtros} {...dimensoes} desativado={cmp.dim} />
      </aside>
      <div className="min-w-0 space-y-10">
        <Comparador dim={cmp.dim} valores={cmp.valores} por={cmp.por} permitidos={permitidos} cores={cores} />
        {resumo.every((t) => t.demandadas === 0) ? (
          <p className="border-y border-line-strong py-10 text-center text-muted">Nenhuma proposta com esses filtros.</p>
        ) : (
          <>
            <Resumo totais={resumo} series={series} />
            {cmp.valores.length < 2 && <p className="text-sm text-muted">Marque ao menos mais um valor para comparar.</p>}
            {cmp.por === "ano" && linhas.length > 0 && (
              <Indicador
                titulo="Taxa de atendimento ao longo dos anos"
                nota={`Uma linha por grupo. Pontos de grupos com poucas propostas num ano (menos de ${N_MINIMO}) oscilam muito: confira a tabela.`}
              >
                <Linhas dados={pivotar(linhas, cmp.valores)} series={cmp.valores} cores={cores} />
                <TabelaComparacao linhas={linhas} series={series} rotuloCategoria={rotuloPor} />
              </Indicador>
            )}
            {cmp.por && cmp.por !== "ano" && linhas.length > 0 && (
              <Indicador
                titulo={`Taxa de atendimento por ${rotuloPor.toLowerCase()}`}
                nota={`Cada ponto é a taxa de um grupo; a barra cinza liga o menor ao maior. Todos na mesma escala, que não começa em zero. Pontos apagados têm menos de ${N_MINIMO} propostas. Ordenado pela maior distância entre os grupos.`}
              >
                <Halteres linhas={linhas} series={series} />
                <TabelaComparacao linhas={linhas} series={series} rotuloCategoria={rotuloPor} />
              </Indicador>
            )}
          </>
        )}
        <footer className="border-t border-line pt-4 text-sm text-muted">
          Consultado no banco às {consultadoEm} (horário de Salvador).
        </footer>
      </div>
    </>
  );
}

function Resumo({ totais, series }: { totais: Total[]; series: Serie[] }) {
  const [a, b] = totais;
  const dif = a && b && a.taxa !== null && b.taxa !== null ? a.taxa - b.taxa : null;
  return (
    <section aria-label="Resumo da comparação" className="grid gap-x-10 gap-y-6 border-y-2 border-ink py-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
      {b && (
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
            {a.grupo} − {b.grupo}
          </p>
          {dif !== null ? (
            <>
              <p className="mt-1 font-display text-5xl leading-none tabular-nums">{pp(dif)}</p>
              <p className="mt-3 max-w-md text-pretty text-sm text-muted">
                Diferença entre as taxas de atendimento, em pontos percentuais, com os filtros atuais.
              </p>
            </>
          ) : (
            <p className="mt-2 max-w-md text-pretty text-sm text-muted">Indisponível: um dos dois grupos não tem propostas com os filtros atuais.</p>
          )}
        </div>
      )}
      <dl className={`grid grid-cols-2 gap-x-4 gap-y-4 self-end ${b ? "" : "md:col-span-2"}`}>
        {totais.map((t, i) => (
          <div key={t.grupo} className="min-w-0 border-l-2 pl-3" style={{ borderColor: series[i].cor }}>
            <dt className="truncate text-xs text-muted">{t.grupo}</dt>
            <dd className="mt-1 font-display text-3xl tabular-nums">{t.taxa === null ? "–" : pct(t.taxa)}</dd>
            <dd className="text-xs text-muted tabular-nums">
              {inteiro(t.atendidas)} de {inteiro(t.demandadas)} propostas
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function pivotar(linhas: ReturnType<typeof categorias>, valores: string[]): Linha[] {
  return linhas.map((l) => {
    const linha: Linha = { ano: Number(l.categoria) };
    for (const v of valores) linha[v] = l.pontos[v]?.taxa ?? null;
    return linha;
  });
}

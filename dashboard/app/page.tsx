import { Suspense } from "react";
import { Cabecalho } from "@/components/Cabecalho";
import { Esqueleto } from "@/components/Esqueleto";
import { Filtros } from "@/components/Filtros";
import { Barras, Linhas, type Linha } from "@/components/Graficos";
import { Indicador } from "@/components/Indicador";
import { diferencaPorArea, evolucao, opcoes, porGrupo, type Diferenca, type Grupo } from "@/lib/consultas";
import { N_MINIMO } from "@/lib/comparar";
import { lerFiltros, RACAS } from "@/lib/filtros";
import { inteiro, pct, pp } from "@/lib/formato";

const RACAS_DECLARADAS = RACAS.filter((r) => r !== "Não informado");
const GRUPOS_SERIE = ["Mulheres negras", "Mulheres brancas", "Homens negros", "Homens brancos"];

export default function Page(props: PageProps<"/">) {
  return (
    <main>
      <Cabecalho
        ativo="geral"
        titulo="Fomento do CNPq por gênero e raça/cor"
        texto="Auditoria de viés no atendimento das propostas de bolsas e auxílios, chamadas de 2019 a 2024 (ODS 5 e ODS 18). Dados consultados ao vivo no PostgreSQL do Aiven."
      />
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12">
        <Suspense fallback={<Esqueleto />}>
          <Painel searchParams={props.searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function Painel({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const filtros = lerFiltros(await searchParams);
  const [dimensoes, grupos, diferencas, serie] = await Promise.all([
    opcoes(),
    porGrupo(filtros),
    diferencaPorArea(filtros),
    evolucao(filtros),
  ]);
  const consultadoEm = new Date().toLocaleTimeString("pt-BR", { timeZone: "America/Bahia" });

  return (
    <>
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <Filtros filtros={filtros} {...dimensoes} />
      </aside>
      <div className="min-w-0 space-y-12">
        {grupos.length === 0 ? (
          <p className="border-y border-line-strong py-10 text-center text-muted">Nenhuma proposta com esses filtros.</p>
        ) : (
          <>
            <Resumo grupos={grupos} />
            <Indicador
              numero={1}
              titulo="Taxa de atendimento por raça/cor e sexo"
              nota="Propostas atendidas ÷ propostas submetidas. Sexo não informado (menos de 0,3% das linhas) fica de fora do gráfico."
            >
              <Barras dados={taxaPorRacaESexo(grupos)} x="raca" series={["Feminino", "Masculino"]} />
            </Indicador>
            <Indicador
              numero={2}
              titulo="Diferença de taxa para os homens brancos, por grande área"
              nota={`Pontos percentuais em relação aos homens brancos (o maior grupo) na mesma área. Células com borda tracejada e itálico têm menos de ${N_MINIMO} propostas e são instáveis: a cor mostra o tamanho da diferença, não a confiança nela.`}
            >
              <TabelaDiferencas linhas={diferencas} />
            </Indicador>
            <div className="grid gap-12 xl:grid-cols-2 xl:gap-10">
              <Indicador
                numero={3}
                titulo="Participação na demanda e no atendimento"
                nota="Quanto cada grupo representa das propostas submetidas e das atendidas. Atendimento menor que a demanda indica sub-representação."
              >
                <Barras dados={participacao(grupos)} x="grupo" series={["Demanda", "Atendimento"]} horizontal />
              </Indicador>
              <Indicador
                numero={4}
                titulo="Evolução da taxa de atendimento, 2019 a 2024"
                nota="Negros = pretos + pardos (critério do IBGE). O filtro de ano não se aplica a esta série. Cor = sexo; traço contínuo = negros, tracejado = brancos."
              >
                <Linhas dados={pivotarSerie(serie)} series={GRUPOS_SERIE} />
              </Indicador>
            </div>
          </>
        )}
        <footer className="border-t border-line pt-4 text-sm text-muted">
          Consultado no banco às {consultadoEm} (horário de Salvador).
        </footer>
      </div>
    </>
  );
}

function Resumo({ grupos }: { grupos: Grupo[] }) {
  const soma = (lista: Grupo[], campo: "demandadas" | "atendidas") => lista.reduce((t, g) => t + g[campo], 0);
  const taxa = (lista: Grupo[]) => (soma(lista, "demandadas") ? soma(lista, "atendidas") / soma(lista, "demandadas") : null);
  const mulheresNegras = taxa(grupos.filter((g) => g.sexo === "Feminino" && ["Preta", "Parda"].includes(g.raca_cor)));
  const homensBrancos = taxa(grupos.filter((g) => g.sexo === "Masculino" && g.raca_cor === "Branca"));
  const temDiferenca = mulheresNegras !== null && homensBrancos !== null;
  const numeros = [
    ["Propostas submetidas", inteiro(soma(grupos, "demandadas"))],
    ["Propostas atendidas", inteiro(soma(grupos, "atendidas"))],
    ["Taxa de atendimento", pct(taxa(grupos) ?? 0)],
  ];
  return (
    <section aria-label="Resumo" className="grid gap-x-10 gap-y-6 border-y-2 border-ink py-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Mulheres negras vs. homens brancos</p>
        {temDiferenca ? (
          <>
            <p className="mt-1 font-display text-5xl leading-none tabular-nums text-fem">{pp(mulheresNegras - homensBrancos)}</p>
            <p className="mt-3 max-w-md text-pretty text-sm text-muted">
              Taxa de atendimento de <strong className="font-semibold text-ink">{pct(mulheresNegras)}</strong> para mulheres
              negras, contra <strong className="font-semibold text-ink">{pct(homensBrancos)}</strong> para homens brancos.
            </p>
          </>
        ) : (
          <p className="mt-2 max-w-md text-pretty text-sm text-muted">
            Indisponível: um dos dois grupos não aparece com os filtros atuais.
          </p>
        )}
      </div>
      <dl className="grid grid-cols-3 divide-x divide-line self-end">
        {numeros.map(([rotulo, valor]) => (
          <div key={rotulo} className="px-3 first:pl-0">
            <dt className="text-xs text-muted">{rotulo}</dt>
            <dd className="mt-1 font-display text-2xl tabular-nums sm:text-3xl">{valor}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

// intensidade vai de 0 a 1; a opacidade máxima vem do tema (--calor-max) para manter o contraste do texto.
const fundo = (lado: "abaixo" | "acima", intensidade: number) => `rgb(var(--${lado}) / calc(${intensidade} * var(--calor-max)))`;

function TabelaDiferencas({ linhas }: { linhas: Diferenca[] }) {
  const colunas = ["Feminino", "Masculino"]
    .flatMap((sexo) => RACAS_DECLARADAS.map((raca) => ({ sexo, raca })))
    .filter((c) => !(c.sexo === "Masculino" && c.raca === "Branca"));
  const areas = [...new Set(linhas.map((l) => l.area))];
  const celula = (area: string, sexo: string, raca: string) =>
    linhas.find((l) => l.area === area && l.sexo === sexo && l.raca_cor === raca);

  return (
    <div className="space-y-3">
      <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="size-3 rounded-sm border border-line-strong" style={{ background: fundo("abaixo", 0.8) }} />
          abaixo dos homens brancos
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="size-3 rounded-sm border border-line-strong" style={{ background: fundo("acima", 0.8) }} />
          acima
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="instavel size-3 rounded-sm border border-line-strong [--inset:1px]" style={{ backgroundColor: fundo("abaixo", 0.8) }} />
          menos de {N_MINIMO} propostas
        </li>
      </ul>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <caption className="sr-only">Diferença em pontos percentuais da taxa de atendimento em relação aos homens brancos, por grande área</caption>
          <thead>
            <tr className="border-b border-line-strong text-xs text-muted">
              <th scope="col" className="sticky left-0 bg-paper py-2 pr-3 text-left font-medium">
                Grande área
              </th>
              {colunas.map((c) => (
                <th key={c.sexo + c.raca} scope="col" className="px-2 py-2 text-right font-medium">
                  {c.sexo === "Feminino" ? "Fem." : "Masc."}
                  <br />
                  {c.raca}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {areas.map((area) => (
              <tr key={area} className="border-b border-line">
                <th scope="row" className="sticky left-0 bg-paper py-2 pr-3 text-left font-normal">
                  {area}
                </th>
                {colunas.map(({ sexo, raca }) => {
                  const c = celula(area, sexo, raca);
                  if (!c || c.diferenca === null)
                    return (
                      <td key={sexo + raca} className="px-2 py-2 text-right text-muted">
                        –
                      </td>
                    );
                  const intensidade = Math.min(Math.abs(c.diferenca) / 0.15, 1);
                  // A cor mostra só a magnitude. Poucas propostas = borda tracejada + itálico, não transparência
                  // (apagar a célula fazia os maiores valores, que vêm de grupos pequenos, parecerem os menores).
                  const instavel = c.demandadas < N_MINIMO;
                  return (
                    <td
                      key={sexo + raca}
                      title={`${inteiro(c.demandadas)} propostas, taxa ${pct(c.taxa)}${instavel ? " (instável)" : ""}`}
                      className={`px-2 py-2 text-right tabular-nums ${instavel ? "instavel" : ""}`}
                      style={{ backgroundColor: fundo(c.diferenca < 0 ? "abaixo" : "acima", intensidade) }}
                    >
                      {pp(c.diferenca)}
                      {instavel && <span className="sr-only"> (menos de {N_MINIMO} propostas)</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function taxaPorRacaESexo(grupos: Grupo[]): Linha[] {
  return RACAS.map((raca) => {
    const linha: Linha = { raca };
    for (const sexo of ["Feminino", "Masculino"]) {
      const g = grupos.find((x) => x.sexo === sexo && x.raca_cor === raca);
      linha[sexo] = g ? g.atendidas / g.demandadas : null;
    }
    return linha;
  });
}

function participacao(grupos: Grupo[]): Linha[] {
  const totalDemanda = grupos.reduce((t, g) => t + g.demandadas, 0);
  const totalAtendida = grupos.reduce((t, g) => t + g.atendidas, 0) || 1;
  const rotulo = (g: Grupo) =>
    g.sexo === "Não informado" || g.raca_cor === "Não informado" ? "Não informado" : `${g.sexo} · ${g.raca_cor}`;
  const somas = new Map<string, { d: number; a: number }>();
  for (const g of grupos) {
    const s = somas.get(rotulo(g)) ?? { d: 0, a: 0 };
    somas.set(rotulo(g), { d: s.d + g.demandadas, a: s.a + g.atendidas });
  }
  return [...somas]
    .map(([grupo, s]) => ({ grupo, Demanda: s.d / totalDemanda, Atendimento: s.a / totalAtendida }))
    .sort((a, b) => b.Demanda - a.Demanda);
}

function pivotarSerie(serie: { ano: number; grupo: string; taxa: number }[]): Linha[] {
  const anos = [...new Set(serie.map((s) => s.ano))];
  return anos.map((ano) => {
    const linha: Linha = { ano };
    for (const s of serie.filter((x) => x.ano === ano)) linha[s.grupo] = s.taxa;
    return linha;
  });
}

import { Suspense } from "react";
import { Filtros } from "@/components/Filtros";
import { Barras, Linhas, type Linha } from "@/components/Graficos";
import { diferencaPorArea, evolucao, opcoes, porGrupo, type Diferenca, type Grupo } from "@/lib/consultas";
import { lerFiltros, RACAS } from "@/lib/filtros";
import { inteiro, pct, pp } from "@/lib/formato";

const RACAS_DECLARADAS = RACAS.filter((r) => r !== "Não informado");
const GRUPOS_SERIE = ["Mulheres negras", "Mulheres brancas", "Homens negros", "Homens brancos"];
const N_MINIMO = 30;

export default function Page(props: PageProps<"/">) {
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Fomento do CNPq por gênero e raça/cor</h1>
        <p className="opacity-75">
          Auditoria de viés no atendimento das propostas de bolsas e auxílios, chamadas de 2019 a 2024 (ODS 5 e ODS 18).
          Dados consultados ao vivo no PostgreSQL do Aiven.
        </p>
      </header>
      <Suspense fallback={<p className="opacity-70">Consultando o banco…</p>}>
        <Painel searchParams={props.searchParams} />
      </Suspense>
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
      <Filtros filtros={filtros} {...dimensoes} />
      {grupos.length === 0 ? (
        <p className="rounded-lg border border-black/10 p-6 text-center dark:border-white/15">Nenhuma proposta com esses filtros.</p>
      ) : (
        <>
          <Cartoes grupos={grupos} />
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
            nota={`Pontos percentuais em relação aos homens brancos (o maior grupo) na mesma área. Vermelho: abaixo; azul: acima. Células claras têm menos de ${N_MINIMO} propostas e são instáveis.`}
          >
            <TabelaDiferencas linhas={diferencas} />
          </Indicador>
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
            nota="Negros = pretos + pardos (critério do IBGE). O filtro de ano não se aplica a esta série."
          >
            <Linhas dados={pivotarSerie(serie)} series={GRUPOS_SERIE} />
          </Indicador>
        </>
      )}
      <footer className="text-sm opacity-70">Consultado no banco às {consultadoEm} (horário de Salvador).</footer>
    </>
  );
}

function Cartoes({ grupos }: { grupos: Grupo[] }) {
  const soma = (lista: Grupo[], campo: "demandadas" | "atendidas") => lista.reduce((t, g) => t + g[campo], 0);
  const taxa = (lista: Grupo[]) => (soma(lista, "demandadas") ? soma(lista, "atendidas") / soma(lista, "demandadas") : null);
  const mulheresNegras = taxa(grupos.filter((g) => g.sexo === "Feminino" && ["Preta", "Parda"].includes(g.raca_cor)));
  const homensBrancos = taxa(grupos.filter((g) => g.sexo === "Masculino" && g.raca_cor === "Branca"));
  const cartoes = [
    ["Propostas submetidas", inteiro(soma(grupos, "demandadas"))],
    ["Propostas atendidas", inteiro(soma(grupos, "atendidas"))],
    ["Taxa de atendimento", pct(taxa(grupos) ?? 0)],
    [
      "Mulheres negras vs. homens brancos",
      mulheresNegras !== null && homensBrancos !== null ? pp(mulheresNegras - homensBrancos) : "sem dados",
    ],
  ];
  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cartoes.map(([rotulo, valor]) => (
        <div key={rotulo} className="rounded-lg border border-black/10 p-4 dark:border-white/15">
          <p className="text-sm opacity-70">{rotulo}</p>
          <p className="text-2xl font-semibold">{valor}</p>
        </div>
      ))}
    </section>
  );
}

function Indicador({ numero, titulo, nota, children }: { numero: number; titulo: string; nota: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2 rounded-lg border border-black/10 p-4 dark:border-white/15">
      <h2 className="text-lg font-semibold">
        {numero}. {titulo}
      </h2>
      <p className="text-sm opacity-70">{nota}</p>
      {children}
    </section>
  );
}

function TabelaDiferencas({ linhas }: { linhas: Diferenca[] }) {
  const colunas = ["Feminino", "Masculino"]
    .flatMap((sexo) => RACAS_DECLARADAS.map((raca) => ({ sexo, raca })))
    .filter((c) => !(c.sexo === "Masculino" && c.raca === "Branca"));
  const areas = [...new Set(linhas.map((l) => l.area))];
  const celula = (area: string, sexo: string, raca: string) =>
    linhas.find((l) => l.area === area && l.sexo === sexo && l.raca_cor === raca);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr>
            <th className="p-1 text-left">Grande área</th>
            {colunas.map((c) => (
              <th key={c.sexo + c.raca} className="p-1 text-right font-medium">
                {c.sexo === "Feminino" ? "Fem." : "Masc."}
                <br />
                {c.raca}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {areas.map((area) => (
            <tr key={area} className="border-t border-black/10 dark:border-white/10">
              <td className="p-1">{area}</td>
              {colunas.map(({ sexo, raca }) => {
                const c = celula(area, sexo, raca);
                if (!c || c.diferenca === null) return <td key={sexo + raca} className="p-1 text-right opacity-40">–</td>;
                const intensidade = Math.min(Math.abs(c.diferenca) / 0.15, 1) * 0.6;
                const cor = c.diferenca < 0 ? `rgba(220,38,38,${intensidade})` : `rgba(37,99,235,${intensidade})`;
                return (
                  <td
                    key={sexo + raca}
                    title={`${inteiro(c.demandadas)} propostas, taxa ${pct(c.taxa)}`}
                    className="p-1 text-right tabular-nums"
                    style={{ backgroundColor: cor, opacity: c.demandadas < N_MINIMO ? 0.4 : 1 }}
                  >
                    {pp(c.diferenca)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
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

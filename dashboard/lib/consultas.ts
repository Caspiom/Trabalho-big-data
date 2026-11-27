import type { PendingQuery, Row } from "postgres";
import type { Celula, Comparacao, Dimensao } from "./comparar";
import { banco } from "./db";
import type { Filtros, Selecao } from "./filtros";

export type Opcao = { id: number; nome: string };
export type Grupo = { sexo: string; raca_cor: string; demandadas: number; atendidas: number };
export type Diferenca = { area: string; sexo: string; raca_cor: string; demandadas: number; taxa: number; diferenca: number | null };
export type Evolucao = { ano: number; grupo: string; taxa: number };

function onde(f: Filtros, extra?: PendingQuery<Row[]>) {
  const sql = banco();
  const condicoes = sql`and`.join([
    extra,
    f.ano && sql`ano_chamada = ${f.ano}`,
    f.sexo && sql`sexo = ${f.sexo}`,
    f.raca && sql`raca_cor = ${f.raca}`,
    f.area && sql`grande_area_id = ${f.area}`,
    f.linha && sql`linha_fomento_id = ${f.linha}`,
    f.modalidade && sql`modalidade_id = ${f.modalidade}`,
    f.regiao && sql`regiao_id = ${f.regiao}`,
  ]);
  return condicoes.length ? sql`where ${condicoes}` : sql``;
}

// Botões de um gráfico da página inicial: vários valores por dimensão.
function selecionados(s: Selecao) {
  const sql = banco();
  const condicoes = sql`and`.join([
    s.ano && sql`ano_chamada in ${sql(s.ano)}`,
    s.sexo && sql`sexo in ${sql(s.sexo)}`,
    s.raca && sql`raca_cor in ${sql(s.raca)}`,
  ]);
  return condicoes.length ? sql`where ${condicoes}` : sql``;
}

export async function opcoes() {
  const sql = banco();
  const [areas, linhas, modalidades, regioes] = await Promise.all([
    sql<Opcao[]>`select id, nome from dim_grande_area order by nome`,
    sql<Opcao[]>`select id, nome from dim_linha_fomento order by nome`,
    sql<Opcao[]>`select id, nome from dim_modalidade order by nome`,
    sql<Opcao[]>`select id, nome from dim_regiao order by nome`,
  ]);
  return { areas, linhas, modalidades, regioes };
}

// Base dos cartões e dos indicadores 1 e 3.
export async function porGrupo(s: Selecao = {}) {
  const sql = banco();
  return sql<Grupo[]>`
    select sexo, raca_cor, sum(qtd_demandada)::int as demandadas, sum(qtd_atendida)::int as atendidas
    from fato_atendimento_grupo ${selecionados(s)}
    group by sexo, raca_cor`;
}

// Indicador 2. O grupo de referência (homens brancos) é calculado sem a seleção de sexo e raça/cor,
// senão ele sumiria ao filtrar; essa seleção só limita as linhas exibidas.
export async function diferencaPorArea(s: Selecao) {
  const sql = banco();
  const exibir = sql`and`.join([s.sexo && sql`g.sexo in ${sql(s.sexo)}`, s.raca && sql`g.raca_cor in ${sql(s.raca)}`]);
  return sql<Diferenca[]>`
    with g as (
      select a.nome as area, sexo, raca_cor, sum(qtd_demandada)::int as demandadas,
             (sum(qtd_atendida)::numeric / sum(qtd_demandada))::float8 as taxa
      from fato_atendimento_grupo f
      join dim_grande_area a on a.id = f.grande_area_id
      ${selecionados({ ano: s.ano })}
      group by a.nome, sexo, raca_cor
    )
    select g.*, g.taxa - r.taxa as diferenca
    from g
    left join g r on r.area = g.area and r.sexo = 'Masculino' and r.raca_cor = 'Branca'
    ${exibir.length ? sql`where ${exibir}` : sql``}
    order by g.area`;
}

// Indicador 4. Negros = pretos + pardos (critério do IBGE).
export async function evolucao(s: Selecao) {
  const sql = banco();
  return sql<Evolucao[]>`
    select ano_chamada::int as ano, grupo,
           (sum(qtd_atendida)::numeric / sum(qtd_demandada))::float8 as taxa
    from (
      select *, case when sexo = 'Feminino' and raca_cor = 'Branca' then 'Mulheres brancas'
                     when sexo = 'Feminino' then 'Mulheres negras'
                     when raca_cor = 'Branca' then 'Homens brancos'
                     else 'Homens negros' end as grupo
      from fato_atendimento_grupo ${selecionados({ ano: s.ano })}
    ) x
    where sexo in ('Feminino', 'Masculino') and raca_cor in ('Branca', 'Preta', 'Parda')
    group by ano_chamada, grupo
    order by ano_chamada`;
}

// Nome da coluna de cada dimensão na subconsulta de comparar(). Lista fechada: nada vindo da URL vira identificador SQL.
const COLUNA: Record<Dimensao, string> = {
  ano: "ano",
  sexo: "sexo",
  raca: "raca_cor",
  area: "area",
  linha: "linha",
  modalidade: "modalidade",
  regiao: "regiao",
};

// Comparação: taxa de cada grupo (valores de uma dimensão), opcionalmente detalhada por outra dimensão.
// Os filtros valem para todos os grupos, menos o filtro da própria dimensão comparada (senão só sobraria um grupo).
export async function comparar(f: Filtros, c: Comparacao) {
  const sql = banco();
  const grupo = sql(COLUNA[c.dim]);
  const categoria = c.por ? sql`${sql(COLUNA[c.por])}::text` : sql`null::text`;
  return sql<Celula[]>`
    select ${grupo}::text as grupo, ${categoria} as categoria,
           sum(qtd_demandada)::int as demandadas, sum(qtd_atendida)::int as atendidas
    from (
      select f.*, f.ano_chamada as ano, a.nome as area, l.nome as linha, m.nome as modalidade, r.nome as regiao
      from fato_atendimento_grupo f
      join dim_grande_area a on a.id = f.grande_area_id
      join dim_linha_fomento l on l.id = f.linha_fomento_id
      join dim_modalidade m on m.id = f.modalidade_id
      join dim_regiao r on r.id = f.regiao_id
    ) x
    ${onde({ ...f, [c.dim]: undefined }, sql`${grupo}::text in ${sql(c.valores)}`)}
    group by 1, 2`;
}

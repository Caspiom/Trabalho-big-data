import { banco } from "./db";
import type { Filtros } from "./filtros";

export type Opcao = { id: number; nome: string };
export type Grupo = { sexo: string; raca_cor: string; demandadas: number; atendidas: number };
export type Diferenca = { area: string; sexo: string; raca_cor: string; demandadas: number; taxa: number; diferenca: number | null };
export type Evolucao = { ano: number; grupo: string; taxa: number };

function onde(f: Filtros) {
  const sql = banco();
  const condicoes = sql`and`.join([
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
export async function porGrupo(f: Filtros) {
  const sql = banco();
  return sql<Grupo[]>`
    select sexo, raca_cor, sum(qtd_demandada)::int as demandadas, sum(qtd_atendida)::int as atendidas
    from fato_atendimento_grupo ${onde(f)}
    group by sexo, raca_cor`;
}

// Indicador 2. O grupo de referência (homens brancos) é calculado sem os filtros de sexo e raça/cor,
// senão ele sumiria ao filtrar; esses dois filtros só limitam as linhas exibidas.
export async function diferencaPorArea(f: Filtros) {
  const sql = banco();
  const exibir = sql`and`.join([f.sexo && sql`g.sexo = ${f.sexo}`, f.raca && sql`g.raca_cor = ${f.raca}`]);
  return sql<Diferenca[]>`
    with g as (
      select a.nome as area, sexo, raca_cor, sum(qtd_demandada)::int as demandadas,
             (sum(qtd_atendida)::numeric / sum(qtd_demandada))::float8 as taxa
      from fato_atendimento_grupo f
      join dim_grande_area a on a.id = f.grande_area_id
      ${onde({ ...f, sexo: undefined, raca: undefined })}
      group by a.nome, sexo, raca_cor
    )
    select g.*, g.taxa - r.taxa as diferenca
    from g
    left join g r on r.area = g.area and r.sexo = 'Masculino' and r.raca_cor = 'Branca'
    ${exibir.length ? sql`where ${exibir}` : sql``}
    order by g.area`;
}

// Indicador 4. Negros = pretos + pardos (critério do IBGE). O filtro de ano não se aplica à série.
export async function evolucao(f: Filtros) {
  const sql = banco();
  return sql<Evolucao[]>`
    select ano_chamada::int as ano, grupo,
           (sum(qtd_atendida)::numeric / sum(qtd_demandada))::float8 as taxa
    from (
      select *, case when sexo = 'Feminino' and raca_cor = 'Branca' then 'Mulheres brancas'
                     when sexo = 'Feminino' then 'Mulheres negras'
                     when raca_cor = 'Branca' then 'Homens brancos'
                     else 'Homens negros' end as grupo
      from fato_atendimento_grupo ${onde({ ...f, ano: undefined })}
    ) x
    where sexo in ('Feminino', 'Masculino') and raca_cor in ('Branca', 'Preta', 'Parda')
    group by ano_chamada, grupo
    order by ano_chamada`;
}

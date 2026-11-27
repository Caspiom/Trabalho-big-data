// Sem imports: este arquivo roda direto no node --test.

export const ANOS = [2019, 2020, 2021, 2022, 2023, 2024];
export const SEXOS = ["Feminino", "Masculino", "Não informado"];
export const RACAS = ["Branca", "Parda", "Preta", "Amarela", "Indígena", "Não informado"];
export const GRUPOS = ["Mulheres negras", "Mulheres brancas", "Homens negros", "Homens brancos"];

export type Filtros = {
  ano?: number;
  sexo?: string;
  raca?: string;
  area?: number;
  linha?: number;
  modalidade?: number;
  regiao?: number;
};

// Botões de um gráfico: vários valores por dimensão. Ausente = sem seleção (vale o filtro global).
export type Selecao = { ano?: number[]; sexo?: string[]; raca?: string[]; grupo?: string[] };

type Parametros = Record<string, string | string[] | undefined>;

function texto(valor: string | string[] | undefined) {
  return Array.isArray(valor) ? valor[0] : valor;
}

function inteiro(valor: string | string[] | undefined, min: number, max: number) {
  const t = texto(valor);
  if (!t || !/^\d+$/.test(t)) return undefined;
  const n = Number(t);
  return n >= min && n <= max ? n : undefined;
}

function opcao(valor: string | string[] | undefined, permitidos: string[]) {
  const t = texto(valor);
  return t && permitidos.includes(t) ? t : undefined;
}

// Valores fora do esperado são ignorados (equivale a "Todos"), nunca chegam ao SQL.
export function lerFiltros(p: Parametros): Filtros {
  const id = (chave: string) => inteiro(p[chave], 1, 32767);
  return {
    ano: inteiro(p.ano, ANOS[0], ANOS[ANOS.length - 1]),
    sexo: opcao(p.sexo, SEXOS),
    raca: opcao(p.raca, RACAS),
    area: id("area"),
    linha: id("linha"),
    modalidade: id("modalidade"),
    regiao: id("regiao"),
  };
}

// Parâmetros "<prefixo>_<dimensão>" repetidos (ex.: g1_sexo=Feminino&g1_sexo=Masculino). Só valores das listas fechadas passam.
export function lerSelecao(p: Parametros, prefixo: string): Selecao {
  const lista = (chave: string, permitidos: string[]) => {
    const v = p[`${prefixo}_${chave}`];
    const valores = [...new Set(Array.isArray(v) ? v : v ? [v] : [])].filter((x) => permitidos.includes(x));
    return valores.length ? valores : undefined;
  };
  return {
    ano: lista("ano", ANOS.map(String))?.map(Number),
    sexo: lista("sexo", SEXOS),
    raca: lista("raca", RACAS),
    grupo: lista("grupo", GRUPOS),
  };
}

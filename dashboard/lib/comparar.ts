// Sem imports: este arquivo roda direto no node --test.

export const N_MINIMO = 30;
// Sem limite de grupos. A paleta tem 13 cores (a maior dimensão, modalidade, tem 13 valores); passando disso as cores se repetem.
export const PALETA = 13;

export const DIMENSOES = [
  { chave: "ano", rotulo: "Ano da chamada" },
  { chave: "sexo", rotulo: "Sexo" },
  { chave: "raca", rotulo: "Raça/cor" },
  { chave: "area", rotulo: "Grande área" },
  { chave: "linha", rotulo: "Linha de fomento" },
  { chave: "modalidade", rotulo: "Modalidade" },
  { chave: "regiao", rotulo: "Região" },
] as const;

export type Dimensao = (typeof DIMENSOES)[number]["chave"];
export type Permitidos = Record<Dimensao, string[]>;
export type Comparacao = { dim: Dimensao; valores: string[]; por: Dimensao | null };
export type Celula = { grupo: string; categoria: string | null; demandadas: number; atendidas: number };
export type Serie = { valor: string; cor: string };
export type Total = { grupo: string; demandadas: number; atendidas: number; taxa: number | null };
export type Ponto = { taxa: number; demandadas: number };
export type Destaque = { tipo: "par" | "amplitude"; de: Total; para: Total; diferenca: number };
export type LinhaCategoria = {
  categoria: string;
  pontos: Record<string, Ponto | undefined>;
  diferenca: number | null; // 1º grupo menos 2º grupo
  amplitude: number | null; // maior taxa menos menor taxa
};

type Parametros = Record<string, string | string[] | undefined>;

export const rotuloDimensao = (d: Dimensao) => DIMENSOES.find((x) => x.chave === d)?.rotulo ?? d;

const PADRAO: Partial<Record<Dimensao, string[]>> = {
  ano: ["2019", "2024"],
  sexo: ["Feminino", "Masculino"],
  raca: ["Branca", "Parda"],
};

// Sem série temporal quando o ano já é o que se compara; senão a evolução é o detalhe mais útil.
export const porPadrao = (dim: Dimensao): Dimensao => (dim === "ano" ? "area" : "ano");

const lista = (v: string | string[] | undefined) => (v === undefined ? [] : Array.isArray(v) ? v : [v]);
const primeiro = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

function valoresPadrao(dim: Dimensao, permitidos: Permitidos) {
  const base = (PADRAO[dim] ?? []).filter((v) => permitidos[dim].includes(v));
  return base.length === 2 ? base : permitidos[dim].slice(0, 2);
}

// Tudo que vem da URL é conferido contra a lista de valores permitidos; o resto é ignorado.
export function lerComparacao(p: Parametros, permitidos: Permitidos): Comparacao {
  const chaves = DIMENSOES.map((d) => d.chave) as Dimensao[];
  const dim = chaves.find((c) => c === primeiro(p.comparar)) ?? "sexo";
  const escolhidos = [...new Set(lista(p.v))].filter((v) => permitidos[dim].includes(v));
  const valores = escolhidos.length ? escolhidos : valoresPadrao(dim, permitidos);
  const bruto = primeiro(p.por);
  const por = bruto === "nenhum" ? null : (chaves.find((c) => c === bruto && c !== dim) ?? porPadrao(dim));
  return { dim, valores, por };
}

// Sexo mantém as cores do restante do painel; os demais usam uma paleta categórica própria.
export function corDoValor(dim: Dimensao, valor: string, indice: number) {
  if (dim === "sexo" && valor === "Feminino") return "var(--fem)";
  if (dim === "sexo" && valor === "Masculino") return "var(--masc)";
  return `var(--cmp-${(indice % PALETA) + 1})`;
}

export const taxa = (atendidas: number, demandadas: number) => (demandadas > 0 ? atendidas / demandadas : null);

export function totais(celulas: Celula[], valores: string[]): Total[] {
  return valores.map((grupo) => {
    const meus = celulas.filter((c) => c.grupo === grupo);
    const demandadas = meus.reduce((t, c) => t + c.demandadas, 0);
    const atendidas = meus.reduce((t, c) => t + c.atendidas, 0);
    return { grupo, demandadas, atendidas, taxa: taxa(atendidas, demandadas) };
  });
}

export function categorias(celulas: Celula[], valores: string[], ordem: "natural" | "amplitude"): LinhaCategoria[] {
  const nomes = [...new Set(celulas.map((c) => c.categoria ?? ""))];
  const linhas = nomes.map((categoria) => {
    const pontos: Record<string, Ponto | undefined> = {};
    for (const v of valores) {
      const c = celulas.find((x) => x.grupo === v && (x.categoria ?? "") === categoria);
      const t = c ? taxa(c.atendidas, c.demandadas) : null;
      if (c && t !== null) pontos[v] = { taxa: t, demandadas: c.demandadas };
    }
    const presentes = valores.flatMap((v) => (pontos[v] ? [pontos[v].taxa] : []));
    const a = pontos[valores[0]];
    const b = pontos[valores[1]];
    return {
      categoria,
      pontos,
      diferenca: a && b ? a.taxa - b.taxa : null,
      amplitude: presentes.length >= 2 ? Math.max(...presentes) - Math.min(...presentes) : null,
    };
  });
  const nome = (a: LinhaCategoria, b: LinhaCategoria) => a.categoria.localeCompare(b.categoria, "pt-BR", { numeric: true });
  return linhas.sort(ordem === "natural" ? nome : (a, b) => (b.amplitude ?? -1) - (a.amplitude ?? -1) || nome(a, b));
}

// Número de destaque do topo. Com 2 grupos: 1º menos 2º. Com 3 ou mais, a ordem da lista é arbitrária, então vale a
// distância entre a maior e a menor taxa, só entre grupos com propostas suficientes (senão um grupo minúsculo decide).
export function destaque(totais: Total[]): Destaque | null {
  const comTaxa = totais.filter((t): t is Total & { taxa: number } => t.taxa !== null);
  if (totais.length === 2) {
    const [a, b] = totais;
    return a.taxa !== null && b.taxa !== null ? { tipo: "par", de: a, para: b, diferenca: a.taxa - b.taxa } : null;
  }
  if (totais.length < 3) return null;
  const firmes = comTaxa.filter((t) => t.demandadas >= N_MINIMO);
  const base = firmes.length >= 2 ? firmes : comTaxa;
  if (base.length < 2) return null;
  const ordenado = [...base].sort((x, y) => y.taxa - x.taxa);
  const de = ordenado[0];
  const para = ordenado[ordenado.length - 1];
  return { tipo: "amplitude", de, para, diferenca: de.taxa - para.taxa };
}

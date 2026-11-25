export const pct = (v: number) => `${(v * 100).toFixed(1).replace(".", ",")}%`;
export const pp = (v: number) => `${v > 0 ? "+" : ""}${(v * 100).toFixed(1).replace(".", ",")} p.p.`;
export const inteiro = (v: number) => v.toLocaleString("pt-BR");

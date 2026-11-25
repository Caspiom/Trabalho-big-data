import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { categorias, corDoValor, lerComparacao, totais, type Celula, type Permitidos } from "./comparar.ts";

const permitidos: Permitidos = {
  ano: ["2019", "2020", "2021", "2022", "2023", "2024"],
  sexo: ["Feminino", "Masculino", "Não informado"],
  raca: ["Branca", "Parda", "Preta", "Amarela", "Indígena", "Não informado"],
  area: ["Engenharias", "Ciências Humanas", "Outra"],
  linha: ["Apoio a Projetos de Pesquisa", "Bolsas no País"],
  modalidade: ["Produtividade em Pesquisa", "Doutorado no Exterior"],
  regiao: ["Nordeste", "Sul"],
};

test("sem parâmetros compara mulheres e homens ao longo dos anos", () => {
  assert.deepEqual(lerComparacao({}, permitidos), { dim: "sexo", valores: ["Feminino", "Masculino"], por: "ano" });
});

test("cada dimensão tem um par padrão e um detalhe diferente dela mesma", () => {
  assert.deepEqual(lerComparacao({ comparar: "ano" }, permitidos), { dim: "ano", valores: ["2019", "2024"], por: "area" });
  assert.deepEqual(lerComparacao({ comparar: "raca" }, permitidos).valores, ["Branca", "Parda"]);
  assert.deepEqual(lerComparacao({ comparar: "regiao" }, permitidos).valores, ["Nordeste", "Sul"]);
});

test("aceita até 4 valores, sem repetição, só os permitidos", () => {
  const c = lerComparacao({ comparar: "ano", v: ["2020", "2020", "2021", "x' OR 1=1 --", "2022", "2023", "2024"] }, permitidos);
  assert.deepEqual(c.valores, ["2020", "2021", "2022", "2023"]);
});

test("dimensão ou detalhe inválidos voltam ao padrão; detalhe nunca repete a dimensão", () => {
  assert.equal(lerComparacao({ comparar: "valor_demandado" }, permitidos).dim, "sexo");
  assert.equal(lerComparacao({ comparar: "sexo", por: "sexo" }, permitidos).por, "ano");
  assert.equal(lerComparacao({ comparar: "sexo", por: "drop table" }, permitidos).por, "ano");
  assert.equal(lerComparacao({ comparar: "sexo", por: "nenhum" }, permitidos).por, null);
  assert.equal(lerComparacao({ comparar: "sexo", por: "raca" }, permitidos).por, "raca");
});

test("valores todos inválidos viram o par padrão", () => {
  assert.deepEqual(lerComparacao({ comparar: "sexo", v: "zzz" }, permitidos).valores, ["Feminino", "Masculino"]);
});

test("sexo mantém as cores do painel; os demais usam a paleta categórica", () => {
  assert.equal(corDoValor("sexo", "Feminino", 0), "var(--fem)");
  assert.equal(corDoValor("sexo", "Masculino", 1), "var(--masc)");
  assert.equal(corDoValor("sexo", "Não informado", 2), "var(--cmp-3)");
  assert.equal(corDoValor("raca", "Branca", 0), "var(--cmp-1)");
});

const celulas: Celula[] = [
  { grupo: "Feminino", categoria: "Engenharias", demandadas: 100, atendidas: 30 },
  { grupo: "Masculino", categoria: "Engenharias", demandadas: 200, atendidas: 80 },
  { grupo: "Feminino", categoria: "Outra", demandadas: 100, atendidas: 40 },
  { grupo: "Masculino", categoria: "Outra", demandadas: 100, atendidas: 41 },
  { grupo: "Feminino", categoria: "Ciências Humanas", demandadas: 10, atendidas: 5 },
];

test("totais somam por grupo e dão taxa nula sem propostas", () => {
  assert.deepEqual(totais(celulas, ["Feminino", "Masculino", "Não informado"]), [
    { grupo: "Feminino", demandadas: 210, atendidas: 75, taxa: 75 / 210 },
    { grupo: "Masculino", demandadas: 300, atendidas: 121, taxa: 121 / 300 },
    { grupo: "Não informado", demandadas: 0, atendidas: 0, taxa: null },
  ]);
});

test("categorias: diferença do 1º menos o 2º, amplitude, ordem por amplitude", () => {
  const l = categorias(celulas, ["Feminino", "Masculino"], "amplitude");
  assert.deepEqual(l.map((x) => x.categoria), ["Engenharias", "Outra", "Ciências Humanas"]);
  assert.ok(Math.abs((l[0].diferenca ?? 0) - (0.3 - 0.4)) < 1e-9);
  assert.equal(l[2].diferenca, null); // falta o grupo Masculino
  assert.equal(l[2].amplitude, null);
});

test("ordem natural põe os anos em sequência", () => {
  const anos: Celula[] = ["2021", "2019", "2020"].map((categoria) => ({ grupo: "Feminino", categoria, demandadas: 10, atendidas: 5 }));
  assert.deepEqual(categorias(anos, ["Feminino"], "natural").map((x) => x.categoria), ["2019", "2020", "2021"]);
});

// Variável CSS inexistente não dá erro: o gráfico só perde a cor (linha sem traço, ponto preto). Este teste pega isso.
test("toda cor usada na comparação está declarada no globals.css, no tema claro e no escuro", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  const [claro, escuro] = css.split("@media (prefers-color-scheme: dark)");
  const usadas = new Set<string>();
  for (const dim of ["ano", "sexo", "raca", "area", "linha", "modalidade", "regiao"] as const) {
    for (const [i, v] of ["Feminino", "Masculino", "x", "y", "z"].entries()) usadas.add(corDoValor(dim, v, i));
  }
  assert.ok(usadas.size >= 6);
  for (const cor of usadas) {
    const nome = /var\((--[\w-]+)\)/.exec(cor)?.[1];
    assert.ok(nome, `cor inesperada: ${cor}`);
    assert.match(claro, new RegExp(`${nome}:`), `${nome} falta no tema claro`);
    assert.match(escuro, new RegExp(`${nome}:`), `${nome} falta no tema escuro`);
  }
});

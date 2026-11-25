import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { categorias, corDoValor, destaque, lerComparacao, PALETA, totais, type Celula, type Permitidos } from "./comparar.ts";

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

test("aceita todos os valores permitidos, sem repetição e sem aceitar o que não existe", () => {
  const c = lerComparacao({ comparar: "ano", v: ["2020", "2020", "2021", "x' OR 1=1 --", "2022", "2023", "2024", "2019"] }, permitidos);
  assert.deepEqual(c.valores, ["2020", "2021", "2022", "2023", "2024", "2019"]);
  const todas = lerComparacao({ comparar: "raca", v: permitidos.raca }, permitidos);
  assert.deepEqual(todas.valores, permitidos.raca);
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

test("sexo mantém as cores do painel; os demais usam a paleta categórica, que recomeça depois da última cor", () => {
  assert.equal(corDoValor("sexo", "Feminino", 0), "var(--fem)");
  assert.equal(corDoValor("sexo", "Masculino", 1), "var(--masc)");
  assert.equal(corDoValor("sexo", "Não informado", 2), "var(--cmp-3)");
  assert.equal(corDoValor("raca", "Branca", 0), "var(--cmp-1)");
  assert.equal(corDoValor("raca", "x", PALETA - 1), `var(--cmp-${PALETA})`);
  assert.equal(corDoValor("raca", "x", PALETA), "var(--cmp-1)");
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
    for (let i = 0; i < PALETA; i++) usadas.add(corDoValor(dim, i === 0 ? "Feminino" : i === 1 ? "Masculino" : `v${i}`, i));
  }
  assert.ok(usadas.size >= PALETA, `esperava ${PALETA} cores distintas, achei ${usadas.size}`);
  for (const cor of usadas) {
    const nome = /var\((--[\w-]+)\)/.exec(cor)?.[1];
    assert.ok(nome, `cor inesperada: ${cor}`);
    assert.match(claro, new RegExp(`${nome}:`), `${nome} falta no tema claro`);
    assert.match(escuro, new RegExp(`${nome}:`), `${nome} falta no tema escuro`);
  }
});

const tot = (grupo: string, demandadas: number, atendidas: number) => ({ grupo, demandadas, atendidas, taxa: demandadas ? atendidas / demandadas : null });

test("destaque com 2 grupos é o 1º menos o 2º", () => {
  const d = destaque([tot("A", 100, 30), tot("B", 100, 40)]);
  assert.equal(d?.tipo, "par");
  assert.ok(Math.abs((d?.diferenca ?? 0) + 0.1) < 1e-9);
});

test("destaque com 3 ou mais é maior menos menor, ignorando a ordem da lista", () => {
  const d = destaque([tot("A", 100, 30), tot("B", 100, 60), tot("C", 100, 10)]);
  assert.equal(d?.tipo, "amplitude");
  assert.deepEqual([d?.de.grupo, d?.para.grupo], ["B", "C"]);
  assert.ok(Math.abs((d?.diferenca ?? 0) - 0.5) < 1e-9);
});

test("destaque ignora grupos com menos de 30 propostas, se houver ao menos 2 firmes", () => {
  const d = destaque([tot("A", 100, 30), tot("B", 100, 40), tot("minúsculo", 2, 2)]);
  assert.deepEqual([d?.de.grupo, d?.para.grupo], ["B", "A"]);
  // sem 2 firmes, usa todos em vez de sumir
  const so = destaque([tot("A", 100, 30), tot("x", 2, 2), tot("y", 3, 0)]);
  assert.deepEqual([so?.de.grupo, so?.para.grupo], ["x", "y"]);
});

test("destaque é nulo com 1 grupo ou quando faltam taxas", () => {
  assert.equal(destaque([tot("A", 100, 30)]), null);
  assert.equal(destaque([tot("A", 100, 30), tot("B", 0, 0)]), null);
  assert.equal(destaque([tot("A", 100, 30), tot("B", 0, 0), tot("C", 0, 0)]), null);
});

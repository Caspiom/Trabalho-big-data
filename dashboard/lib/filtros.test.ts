import assert from "node:assert/strict";
import { test } from "node:test";
import { lerFiltros } from "./filtros.ts";

test("aceita valores válidos", () => {
  assert.deepEqual(
    lerFiltros({ ano: "2023", sexo: "Feminino", raca: "Preta", area: "7", linha: "3", modalidade: "9", regiao: "3" }),
    { ano: 2023, sexo: "Feminino", raca: "Preta", area: 7, linha: 3, modalidade: 9, regiao: 3 },
  );
});

test("ignora valores fora do esperado", () => {
  const f = lerFiltros({ ano: "2018", sexo: "x' OR 1=1 --", raca: "branca", area: "0", linha: "1.5", modalidade: "-2", regiao: "99999" });
  assert.ok(Object.values(f).every((v) => v === undefined));
});

test("sem parâmetros é tudo Todos e parâmetro repetido usa o primeiro", () => {
  assert.ok(Object.values(lerFiltros({})).every((v) => v === undefined));
  assert.equal(lerFiltros({ ano: ["2020", "2021"] }).ano, 2020);
});

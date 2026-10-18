import assert from "node:assert/strict";
import { construirPuzzle, envolverSVG, TIPOS, MARCOS } from "../docs/puzzle.js";

const dDe = (inner, id) => inner.match(new RegExp(`id="${id}" d="([^"]+)"`))?.[1];
const nums = (d) => d.match(/-?\d+(\.\d+)?/g).map(Number);
const sinNaN = (s) => assert.ok(!/NaN|undefined|Infinity/.test(s), "valores raros en el SVG");

for (const t of TIPOS) {
  for (const N of [6, 24, 48, 120, 300]) {
    const r = construirPuzzle({ tipo: t.id, piezas: N, ancho: 180, alto: 120, semilla: N });
    sinNaN(r.inner);
    // número de piezas razonablemente cercano al pedido
    assert.ok(Math.abs(r.piezas - N) <= Math.max(3, N * 0.3), `${t.id}: pedidas ${N}, salen ${r.piezas}`);
    // todos los puntos de los cortes interiores dentro del puzle (las lengüetas no se salen)
    const ci = dDe(r.inner, "cortes");
    assert.ok(ci, `${t.id}: hay cortes interiores`);
    const v = nums(ci);
    for (let i = 0; i < v.length; i += 2) assert.ok(v[i] >= -1e-3 && v[i] <= 180 + 1e-3 && v[i + 1] >= -1e-3 && v[i + 1] <= 120 + 1e-3, `${t.id}/${N}: punto (${v[i]},${v[i + 1]}) fuera`);
    // cada corte es un subtrazado: ninguno repetido
    const subs = ci.split("M").filter(Boolean);
    assert.equal(new Set(subs).size, subs.length, `${t.id}/${N}: cortes duplicados`);
    assert.equal(subs.length, r.cortes, `${t.id}/${N}: nº de cortes`);
  }
}

// rejilla cuadrada: columnas × filas, y cortes = (c-1)·f + (f-1)·c
let r = construirPuzzle({ tipo: "recta", columnas: 5, filas: 4, ancho: 100, alto: 80 });
assert.equal(r.piezas, 20); assert.equal(r.cortes, 4 * 4 + 3 * 5);
r = construirPuzzle({ tipo: "triangular", columnas: 3, filas: 2 });
assert.equal(r.piezas, 12);

// la semilla manda: mismo resultado con la misma, distinto con otra
const a = construirPuzzle({ semilla: 7 }).inner, b = construirPuzzle({ semilla: 7 }).inner, c = construirPuzzle({ semilla: 8 }).inner;
assert.equal(a, b); assert.notEqual(a, c);

// marco y base
const sin = construirPuzzle({ ancho: 200, alto: 150 });
const mc = construirPuzzle({ ancho: 200, alto: 150, marco: "marco", anchoMarco: 15 });
const mb = construirPuzzle({ ancho: 200, alto: 150, marco: "marco-base", anchoMarco: 15, separacion: 6 });
assert.equal([sin.w, sin.h].join(), "200,150");
assert.equal([mc.w, mc.h].join(), "230,180");
assert.equal([mb.w, mb.h].join(), "466,180");
assert.ok(!sin.inner.includes('id="marco"') && mc.inner.includes('id="marco"') && !mc.inner.includes('id="base"') && mb.inner.includes('id="base"'));
for (const m of MARCOS) sinNaN(construirPuzzle({ marco: m }).inner);

// un solo color, sin transformaciones ni texto
const s = envolverSVG(sin.w, sin.h, sin.inner);
assert.equal((s.match(/stroke="/g) || []).length, 1);
assert.ok(!/<text|transform=|fill="#(?!none)/.test(s));
assert.match(s, /<svg [^>]*width="200mm" height="150mm" viewBox="0 0 200 150"/);

console.log("ok");

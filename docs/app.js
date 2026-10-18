import { DEFAULTS, TIPOS, construirPuzzle, envolverSVG } from "./puzzle.js?v=1";

const el = (id) => document.getElementById(id);

window.addEventListener("error", (e) => {
  const s = el("status");
  if (s) { s.textContent = "Error: " + (e.message || "no se pudo iniciar") + ". Prueba a recargar con Ctrl+Shift+R."; s.classList.add("error"); }
});

const NUM = ["ancho", "alto", "piezas", "lengueta", "irregular", "onda", "columnas", "filas", "semilla", "anchoMarco", "separacion", "esquinas", "grosor"];
const NOTAS = {
  clasica: "Cuadrícula con lengüeta y hueco redondeados: el puzle de siempre.",
  recta: "Solo cortes rectos en cuadrícula: la más fácil para empezar.",
  ondulada: "Cortes en curva suave, sin lengüetas.",
  hexagonal: "Piezas hexagonales con lengüetas; las del borde quedan recortadas.",
  "hexagonal-recta": "Piezas hexagonales con cortes rectos.",
  triangular: "Cada casilla se divide en dos triángulos.",
};
let tipoActual = DEFAULTS.tipo, lastSVG = null;

function leer() {
  const p = { ...DEFAULTS };
  for (const k of NUM) { const raw = el(k).value, v = Number(raw); p[k] = raw !== "" && Number.isFinite(v) ? v : DEFAULTS[k]; }
  p.tipo = tipoActual;
  p.marco = el("marco").value;
  p.color = el("color").value || DEFAULTS.color;
  return p;
}

function aplicarDefectos() {
  for (const k of NUM) el(k).value = DEFAULTS[k];
  tipoActual = DEFAULTS.tipo;
  el("marco").value = DEFAULTS.marco;
  el("color").value = DEFAULTS.color;
  pintarTipos(); syncUI();
}

function syncUI() {
  const m = el("marco").value;
  el("anchoMarco").disabled = m === "none";
  el("separacion").disabled = m !== "marco-base";
  const t = TIPOS.find((x) => x.id === tipoActual);
  el("columnas").disabled = el("filas").disabled = t.rejilla === "hex";
  el("tipo-nota").textContent = NOTAS[tipoActual] || "";
}

function pintarTipos() {
  const cont = el("tipos");
  cont.replaceChildren();
  for (const t of TIPOS) {
    const r = construirPuzzle({ tipo: t.id, ancho: 60, alto: 40, piezas: t.rejilla === "hex" ? 8 : 12, semilla: 3, esquinas: 3, color: "#000", grosor: 0.9 });
    const b = document.createElement("button");
    b.type = "button";
    b.title = t.nombre;
    b.setAttribute("role", "radio");
    b.setAttribute("aria-checked", String(t.id === tipoActual));
    b.setAttribute("aria-label", t.nombre);
    if (t.id === tipoActual) b.className = "sel";
    b.innerHTML = `<svg viewBox="-2 -2 64 44" aria-hidden="true" style="color:inherit">${r.inner.replace(/stroke="#000000?"/, 'stroke="currentColor"')}</svg><span style="display:block;font-size:11px;margin-top:2px">${t.nombre}</span>`;
    b.addEventListener("click", () => { tipoActual = t.id; pintarTipos(); onInput(); });
    cont.append(b);
  }
}

function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

el("download-btn").addEventListener("click", () => {
  if (!lastSVG) return;
  const p = leer();
  saveBlob(new Blob([lastSVG], { type: "image/svg+xml" }), `puzzle-${p.tipo}-${p.ancho}x${p.alto}.svg`);
});

function generar() {
  try {
    const p = leer();
    const r = construirPuzzle(p);
    const svg = envolverSVG(r.w, r.h, r.inner, "Puzle");
    el("svg-holder").innerHTML = svg;
    el("stats").textContent = `${r.w.toFixed(0)} × ${r.h.toFixed(0)} mm`;
    el("cuenta").textContent = r.cols ? `${r.cols} × ${r.filas} = ${r.piezas} piezas` : `${r.piezas} piezas`;
    el("avisos").textContent = r.avisos.join(" ");
    lastSVG = svg;
    el("download-btn").disabled = false;
    el("status").textContent = "Listo. Puedes descargar el SVG.";
    el("status").classList.remove("error");
  } catch (err) {
    console.error(err);
    el("status").textContent = "Error al generar: " + (err?.message || err);
    el("status").classList.add("error");
  }
}

let debounce = null;
const programa = () => { clearTimeout(debounce); debounce = setTimeout(generar, 150); };
function onInput() { syncUI(); programa(); }

for (const k of [...NUM, "marco", "color"]) { el(k).addEventListener("input", onInput); el(k).addEventListener("change", onInput); }
el("reset-btn").addEventListener("click", () => { aplicarDefectos(); onInput(); });
el("otro-btn").addEventListener("click", () => { el("semilla").value = Math.floor(Math.random() * 90000) + 10; onInput(); });

aplicarDefectos();
generar();

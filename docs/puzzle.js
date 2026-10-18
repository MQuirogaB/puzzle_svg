// Generador de puzles en SVG para corte láser. Todo en milímetros, un solo color.
//
//   <g id="corte">  contorno, cortes interiores (cada línea una sola vez), marco y base opcionales
//
// Cada corte entre dos piezas se dibuja una única vez (los bordes compartidos no se duplican),
// así que el láser no pasa dos veces por el mismo sitio.

export const TIPOS = [
  { id: "clasica", nombre: "Clásica", rejilla: "cuadrada", borde: "lengueta" },
  { id: "recta", nombre: "Recta", rejilla: "cuadrada", borde: "recta" },
  { id: "ondulada", nombre: "Ondulada", rejilla: "cuadrada", borde: "onda" },
  { id: "hexagonal", nombre: "Hexagonal", rejilla: "hex", borde: "lengueta" },
  { id: "hexagonal-recta", nombre: "Hexagonal recta", rejilla: "hex", borde: "recta" },
  { id: "triangular", nombre: "Triangular", rejilla: "tri", borde: "recta" },
];
export const MARCOS = ["none", "marco", "marco-base"];

export const DEFAULTS = {
  ancho: 200, alto: 150,
  piezas: 48,            // número aproximado de piezas
  columnas: 0, filas: 0, // 0 = automático (solo rejilla cuadrada y triangular)
  tipo: "clasica",
  lengueta: 20,          // tamaño de la lengüeta (% del lado)
  irregular: 4,          // variación aleatoria de las lengüetas (%)
  onda: 12,              // amplitud de la ondulación (% del lado)
  semilla: 1,
  esquinas: 4,           // radio de las esquinas del contorno (mm)
  marco: "none",         // none | marco | marco-base
  anchoMarco: 15,        // anchura del marco (mm)
  separacion: 6,         // hueco entre el marco y la base (mm)
  color: "#ff0000",
  grosor: 0.1,
};

const r3 = (n) => Math.round(n * 1000) / 1000;
const num = (v, d) => (Number.isFinite(v) ? v : d);

export function sanear(p) {
  const q = { ...DEFAULTS, ...p };
  q.ancho = Math.max(20, num(q.ancho, DEFAULTS.ancho));
  q.alto = Math.max(20, num(q.alto, DEFAULTS.alto));
  q.piezas = Math.min(2000, Math.max(2, Math.round(num(q.piezas, DEFAULTS.piezas))));
  q.columnas = Math.max(0, Math.round(num(q.columnas, 0)));
  q.filas = Math.max(0, Math.round(num(q.filas, 0)));
  q.lengueta = Math.min(30, Math.max(8, num(q.lengueta, DEFAULTS.lengueta)));
  q.irregular = Math.min(10, Math.max(0, num(q.irregular, DEFAULTS.irregular)));
  q.onda = Math.min(30, Math.max(2, num(q.onda, DEFAULTS.onda)));
  q.semilla = Math.round(num(q.semilla, 1));
  q.esquinas = Math.max(0, num(q.esquinas, DEFAULTS.esquinas));
  q.anchoMarco = Math.max(3, num(q.anchoMarco, DEFAULTS.anchoMarco));
  q.separacion = Math.max(1, num(q.separacion, DEFAULTS.separacion));
  q.grosor = Math.max(0.01, num(q.grosor, DEFAULTS.grosor));
  if (!TIPOS.some((t) => t.id === q.tipo)) q.tipo = "clasica";
  if (!MARCOS.includes(q.marco)) q.marco = "none";
  return q;
}

/** Generador pseudoaleatorio con semilla (mulberry32). */
function aleatorio(semilla) {
  let a = (semilla * 2654435761) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------
// Un corte entre dos puntos
// ---------------------------------------------------------------------

/**
 * Trazado de un corte de A a B. `cap` limita lo que puede sobresalir la lengüeta.
 * estilo: "recta" | "lengueta" | "onda"
 */
function corte(A, B, estilo, p, cap, rnd, caja) {
  const dx = B[0] - A[0], dy = B[1] - A[1];
  const L = Math.hypot(dx, dy);
  const M = `M${r3(A[0])} ${r3(A[1])}`;
  const recta = `${M}L${r3(B[0])} ${r3(B[1])}`;
  if (estilo === "recta" || L < 1e-6) return recta;
  const ux = dx / L, uy = dy / L, vx = -uy, vy = ux;
  const unit = Math.min(L, cap);
  const j = p.irregular / 100;
  const u = () => (rnd() * 2 - 1) * j;
  const signo0 = rnd() < 0.5 ? -1 : 1;
  const t = p.lengueta / 200;
  const a = u(), b = u(), c = u(), d = u(), e = u();
  const aO = (p.onda / 100) * (0.6 + 0.8 * rnd());
  const construye = (signo) => {
    const xs = [], ys = [];
    const pt = (l, w) => {
      const x = A[0] + ux * l * L + vx * w * unit * signo, y = A[1] + uy * l * L + vy * w * unit * signo;
      xs.push(x); ys.push(y);
      return `${r3(x)} ${r3(y)}`;
    };
    let ruta;
    if (estilo === "onda") ruta = `${M}C${pt(0.33, aO)} ${pt(0.66, -aO)} ${r3(B[0])} ${r3(B[1])}`;
    else ruta =
      `${M}C${pt(0.2, a)} ${pt(0.5 + b + d, -t + c)} ${pt(0.5 - t + b, t + c)}` +
      `C${pt(0.5 - 2 * t + b - d, 3 * t + c)} ${pt(0.5 + 2 * t + b - d, 3 * t + c)} ${pt(0.5 + t + b, t + c)}` +
      `C${pt(0.5 + b + d, -t + c)} ${pt(0.8, e)} ${r3(B[0])} ${r3(B[1])}`;
    const dentro = xs.every((x) => x >= caja.x1 - 1e-6 && x <= caja.x2 + 1e-6) && ys.every((y) => y >= caja.y1 - 1e-6 && y <= caja.y2 + 1e-6);
    return { ruta, dentro };
  };
  const r1 = construye(signo0);
  if (r1.dentro) return r1.ruta;
  const r2 = construye(-signo0);   // si se sale del puzle, la lengüeta se gira hacia el otro lado
  return r2.dentro ? r2.ruta : recta;
}

function rectRedondeado(x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  const X = (v) => r3(x + v), Y = (v) => r3(y + v);
  if (r <= 0) return `M${X(0)} ${Y(0)}H${X(w)}V${Y(h)}H${X(0)}Z`;
  return (
    `M${X(r)} ${Y(0)}H${X(w - r)}A${r3(r)} ${r3(r)} 0 0 1 ${X(w)} ${Y(r)}` +
    `V${Y(h - r)}A${r3(r)} ${r3(r)} 0 0 1 ${X(w - r)} ${Y(h)}` +
    `H${X(r)}A${r3(r)} ${r3(r)} 0 0 1 ${X(0)} ${Y(h - r)}` +
    `V${Y(r)}A${r3(r)} ${r3(r)} 0 0 1 ${X(r)} ${Y(0)}Z`
  );
}

// ---------------------------------------------------------------------
// Rejillas
// ---------------------------------------------------------------------

function colsFilas(p) {
  let c = p.columnas, f = p.filas;
  if (c > 0 && f > 0) return [c, f];
  const N = p.piezas;
  if (p.tipo === "triangular") {
    const n = N / 2;
    c = c || Math.max(1, Math.round(Math.sqrt((n * p.ancho) / p.alto)));
    f = f || Math.max(1, Math.round(n / c));
  } else {
    c = c || Math.max(1, Math.round(Math.sqrt((N * p.ancho) / p.alto)));
    f = f || Math.max(1, Math.round(N / c));
  }
  if (p.columnas > 0 && !p.filas) f = Math.max(1, Math.round((p.tipo === "triangular" ? N / 2 : N) / c));
  if (p.filas > 0 && !p.columnas) c = Math.max(1, Math.round((p.tipo === "triangular" ? N / 2 : N) / f));
  return [c, f];
}

/** Segmentos interiores de una rejilla cuadrada: [A, B, cap]. */
function segmentosCuadrada(W, H, c, f) {
  const cw = W / c, ch = H / f, cap = 1.5 * Math.min(cw, ch);
  const out = [];
  for (let i = 1; i < c; i++) for (let j = 0; j < f; j++) out.push([[i * cw, j * ch], [i * cw, (j + 1) * ch], cap]);
  for (let j = 1; j < f; j++) for (let i = 0; i < c; i++) out.push([[i * cw, j * ch], [(i + 1) * cw, j * ch], cap]);
  return out;
}

function segmentosTriangular(W, H, c, f) {
  const out = segmentosCuadrada(W, H, c, f);
  const cw = W / c, ch = H / f;
  const inr = (cw + ch - Math.hypot(cw, ch)) / 2;
  const cap = 3 * inr;
  for (const s of out) s[2] = cap;
  for (let i = 0; i < c; i++) for (let j = 0; j < f; j++) {
    const x0 = i * cw, y0 = j * ch, x1 = x0 + cw, y1 = y0 + ch;
    out.push((i + j) % 2 === 0 ? [[x0, y0], [x1, y1], cap] : [[x1, y0], [x0, y1], cap]);
  }
  return out;
}

function recortaSegmento(A, B, W, H) {
  let t0 = 0, t1 = 1;
  const dx = B[0] - A[0], dy = B[1] - A[1];
  const ps = [-dx, dx, -dy, dy], qs = [A[0], W - A[0], A[1], H - A[1]];
  for (let k = 0; k < 4; k++) {
    if (Math.abs(ps[k]) < 1e-12) { if (qs[k] < -1e-9) return null; continue; }
    const t = qs[k] / ps[k];
    if (ps[k] < 0) { if (t > t1) return null; if (t > t0) t0 = t; }
    else { if (t < t0) return null; if (t < t1) t1 = t; }
  }
  return [[A[0] + t0 * dx, A[1] + t0 * dy], [A[0] + t1 * dx, A[1] + t1 * dy], t1 - t0];
}

function recortaPoligono(poly, W, H) {
  let out = poly;
  const lados = [
    (p) => p[0] >= 0, (p) => p[0] <= W, (p) => p[1] >= 0, (p) => p[1] <= H,
  ];
  const cruza = [
    (a, b) => { const t = (0 - a[0]) / (b[0] - a[0]); return [0, a[1] + t * (b[1] - a[1])]; },
    (a, b) => { const t = (W - a[0]) / (b[0] - a[0]); return [W, a[1] + t * (b[1] - a[1])]; },
    (a, b) => { const t = (0 - a[1]) / (b[1] - a[1]); return [a[0] + t * (b[0] - a[0]), 0]; },
    (a, b) => { const t = (H - a[1]) / (b[1] - a[1]); return [a[0] + t * (b[0] - a[0]), H]; },
  ];
  for (let k = 0; k < 4 && out.length; k++) {
    const inp = out; out = [];
    for (let i = 0; i < inp.length; i++) {
      const a = inp[i], b = inp[(i + 1) % inp.length];
      const da = lados[k](a), db = lados[k](b);
      if (da) out.push(a);
      if (da !== db) out.push(cruza[k](a, b));
    }
  }
  return out;
}

const area = (poly) => Math.abs(poly.reduce((s, a, i) => { const b = poly[(i + 1) % poly.length]; return s + a[0] * b[1] - b[0] * a[1]; }, 0)) / 2;

/** Rejilla hexagonal recortada al rectángulo. Devuelve { segs, piezas }. */
function rejillaHex(W, H, s) {
  const cx0 = W / 2, cy0 = H / 2;
  const nc = Math.ceil(W / (1.5 * s)) + 2, nr = Math.ceil(H / (Math.sqrt(3) * s)) + 2;
  const vistos = new Map();
  let piezas = 0;
  const key = (a, b) => {
    const ka = `${Math.round(a[0] * 1000)},${Math.round(a[1] * 1000)}`, kb = `${Math.round(b[0] * 1000)},${Math.round(b[1] * 1000)}`;
    return ka < kb ? ka + "|" + kb : kb + "|" + ka;
  };
  for (let c = -nc; c <= nc; c++) for (let r = -nr; r <= nr; r++) {
    const x = cx0 + 1.5 * s * c, y = cy0 + Math.sqrt(3) * s * (r + 0.5 * (c & 1));
    if (x < -2 * s || x > W + 2 * s || y < -2 * s || y > H + 2 * s) continue;
    const v = [];
    for (let k = 0; k < 6; k++) v.push([x + s * Math.cos((k * Math.PI) / 3), y + s * Math.sin((k * Math.PI) / 3)]);
    const rec = recortaPoligono(v, W, H);
    if (rec.length >= 3 && area(rec) > 0.5) piezas++;
    for (let k = 0; k < 6; k++) {
      const a = v[k], b = v[(k + 1) % 6];
      const kk = key(a, b);
      if (vistos.has(kk)) continue;
      const rc = recortaSegmento(a, b, W, H);
      if (!rc) { vistos.set(kk, null); continue; }
      const [A, B, fr] = rc;
      const eps = 1e-6;
      const enBorde = (Math.abs(A[0]) < eps && Math.abs(B[0]) < eps) || (Math.abs(A[0] - W) < eps && Math.abs(B[0] - W) < eps) ||
        (Math.abs(A[1]) < eps && Math.abs(B[1]) < eps) || (Math.abs(A[1] - H) < eps && Math.abs(B[1] - H) < eps);
      if (enBorde || Math.hypot(B[0] - A[0], B[1] - A[1]) < 0.3) { vistos.set(kk, null); continue; }
      vistos.set(kk, { A: a, B: b, A2: A, B2: B, completo: fr > 0.999, s });
    }
  }
  const segs = [];
  const ks = [...vistos.keys()].sort();
  for (const kk of ks) {
    const e = vistos.get(kk);
    if (!e) continue;
    segs.push([e.A2, e.B2, 3 * 0.866 * e.s, e.completo]);
  }
  return { segs, piezas };
}

/** Ajusta el lado del hexágono para acercarse al número de piezas pedido (las del borde cuentan). */
function segmentosHex(W, H, N) {
  const s0 = Math.sqrt((W * H) / (N * 2.598076));
  let mejor = null;
  for (let i = 0; i <= 24; i++) {
    const s = s0 * (0.75 + (0.5 * i) / 24);
    const r = rejillaHex(W, H, s);
    const err = Math.abs(r.piezas - N) + Math.abs(s / s0 - 1) * 0.5;
    if (!mejor || err < mejor.err) mejor = { ...r, err };
    if (r.piezas === N && Math.abs(s / s0 - 1) < 0.03) break;
  }
  return mejor;
}

// ---------------------------------------------------------------------
// Construcción
// ---------------------------------------------------------------------

/** Devuelve { w, h, inner, piezas, avisos, cortes } con el origen arriba a la izquierda. */
export function construirPuzzle(entrada) {
  const p = sanear(entrada);
  const tipo = TIPOS.find((t) => t.id === p.tipo);
  const avisos = [];
  const W = p.ancho, H = p.alto;
  const rnd = aleatorio(p.semilla);
  const conMarco = p.marco !== "none";
  const off = conMarco ? p.anchoMarco : 0;

  let segs = [], piezas = 0, cols = 0, filas = 0;
  if (tipo.rejilla === "hex") {
    const h = segmentosHex(W, H, p.piezas);
    segs = h.segs; piezas = h.piezas;
  } else {
    [cols, filas] = colsFilas(p);
    segs = (tipo.rejilla === "tri" ? segmentosTriangular(W, H, cols, filas) : segmentosCuadrada(W, H, cols, filas)).map((s) => [...s, true]);
    piezas = cols * filas * (tipo.rejilla === "tri" ? 2 : 1);
  }
  if (piezas > 1500) avisos.push("Son muchísimas piezas: el archivo será pesado y el corte largo.");

  // radio de esquinas: que no choque con la primera línea de corte
  let radio = p.esquinas;
  if (cols && filas) radio = Math.min(radio, 0.9 * Math.min(W / cols, H / filas));
  radio = Math.min(radio, W / 2, H / 2);

  const caja = { x1: off, y1: off, x2: off + W, y2: off + H };
  const interior = segs
    .map(([A, B, cap, completo]) => corte([A[0] + off, A[1] + off], [B[0] + off, B[1] + off], completo ? tipo.borde : "recta", p, cap, rnd, caja))
    .join("");

  const contorno = rectRedondeado(off, off, W, H, radio);
  let marco = "", base = "", totalW = W + 2 * off, totalH = H + 2 * off;
  if (conMarco) {
    const re = Math.max(radio, 0) + off * 0.35;
    marco = rectRedondeado(0, 0, totalW, totalH, Math.min(re, off * 1.5));
    if (p.marco === "marco-base") {
      base = rectRedondeado(totalW + p.separacion, 0, totalW, totalH, Math.min(re, off * 1.5));
      totalW = totalW * 2 + p.separacion;
    }
  }

  let d = `<path id="contorno" d="${contorno}"/>`;
  if (interior) d += `<path id="cortes" d="${interior}"/>`;
  if (marco) d += `<path id="marco" d="${marco}"/>`;
  if (base) d += `<path id="base" d="${base}"/>`;
  const inner = `<g id="corte" fill="none" stroke="${p.color}" stroke-width="${p.grosor}" stroke-linecap="round" stroke-linejoin="round">${d}</g>`;
  return { w: totalW, h: totalH, inner, piezas, cols, filas, avisos, cortes: segs.length };
}

export function envolverSVG(w, h, inner, titulo = "") {
  const t = titulo ? `<title>${titulo.replace(/[<&>"]/g, "")}</title>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${r3(w)}mm" height="${r3(h)}mm" viewBox="0 0 ${r3(w)} ${r3(h)}">${t}${inner}</svg>\n`;
}

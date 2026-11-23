function elipsePuntoMedio(xc, yc, rx, ry) {
  const vistos = new Set();
  const puntos = [];
  const agregar = (px, py) => {
    const clave = px + "," + py;
    if (!vistos.has(clave)) {
      vistos.add(clave);
      puntos.push({ x: xc + px, y: yc + py });
    }
  };

  const rx2 = rx * rx, ry2 = ry * ry;
  let x = 0, y = ry;
  let dx = 2 * ry2 * x, dy = 2 * rx2 * y;
  let iter = 0;

  let p1 = ry2 - rx2 * ry + 0.25 * rx2;
  while (dx < dy) {
    iter++;
    agregar( x,  y); agregar(-x,  y); agregar( x, -y); agregar(-x, -y);
    if (p1 < 0) {
      x++;
      dx += 2 * ry2;
      p1 += dx + ry2;
    } else {
      x++; y--;
      dx += 2 * ry2;
      dy -= 2 * rx2;
      p1 += dx - dy + ry2;
    }
  }

  let p2 = ry2 * (x + 0.5) * (x + 0.5) + rx2 * (y - 1) * (y - 1) - rx2 * ry2;
  while (y >= 0) {
    iter++;
    agregar( x,  y); agregar(-x,  y); agregar( x, -y); agregar(-x, -y);
    if (p2 > 0) {
      y--;
      dy -= 2 * rx2;
      p2 += rx2 - dy;
    } else {
      x++; y--;
      dx += 2 * ry2;
      dy -= 2 * rx2;
      p2 += dx - dy + rx2;
    }
  }

  const filas = new Map();
  for (const p of puntos) {
    const f = filas.get(p.y);
    if (!f) filas.set(p.y, { min: p.x, max: p.x });
    else { f.min = Math.min(f.min, p.x); f.max = Math.max(f.max, p.x); }
  }

  const relleno = [...filas.entries()]
    .map(([y, v]) => ({ y, x1: v.min, x2: v.max }))
    .sort((a, b) => a.y - b.y);

  let pixelesRelleno = 0;
  for (const f of relleno) pixelesRelleno += f.x2 - f.x1 + 1;

  return { puntos, iteraciones: iter, relleno, pixelesRelleno };
}

function perimetroElipse(rx, ry) {
  const h = Math.pow(rx - ry, 2) / Math.pow(rx + ry, 2);
  return Math.PI * (rx + ry) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
}

const canvas = document.getElementById("lienzo");
const ctx = canvas.getContext("2d");
const estado = { escala: 6, ox: 0, oy: 0, figura: null };

function aPantalla(x, y) { return [estado.ox + x * estado.escala, estado.oy - y * estado.escala]; }
function aMundo(px, py) { return [(px - estado.ox) / estado.escala, (estado.oy - py) / estado.escala]; }

function ajustarCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  centrar();
}

function centrar() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  let cx = 50, cy = 50, tam = 60;
  if (estado.figura) {
    const f = estado.figura;
    cx = f.xc; cy = f.yc;
    tam = Math.max(f.rx, f.ry);
  }
  estado.escala = Math.min(w, h) / (tam * 2 + 40);
  estado.ox = w / 2 - cx * estado.escala;
  estado.oy = h / 2 + cy * estado.escala;
  dibujar();
}

function dibujarRejilla(w, h) {
  const paso = estado.escala >= 4 ? 10 : 50;
  const [xmin, ymax] = aMundo(0, 0);
  const [xmax, ymin] = aMundo(w, h);
  ctx.font = "10px monospace";
  for (let x = Math.floor(xmin / paso) * paso; x <= xmax; x += paso) {
    const [px] = aPantalla(x, 0);
    ctx.strokeStyle = x === 0 ? "rgba(255,140,60,0.5)" : "rgba(80,45,20,0.6)";
    ctx.lineWidth = x === 0 ? 1 : 0.5;
    ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, h); ctx.stroke();
    if (x !== 0) { ctx.fillStyle = "#6b5540"; ctx.fillText(x, px + 3, Math.min(Math.max(estado.oy, 12), h - 6)); }
  }
  for (let y = Math.floor(ymin / paso) * paso; y <= ymax; y += paso) {
    const [, py] = aPantalla(0, y);
    ctx.strokeStyle = y === 0 ? "rgba(255,140,60,0.5)" : "rgba(80,45,20,0.6)";
    ctx.lineWidth = y === 0 ? 1 : 0.5;
    ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(w, py); ctx.stroke();
    if (y !== 0) { ctx.fillStyle = "#6b5540"; ctx.fillText(y, Math.min(Math.max(estado.ox, 4), w - 30), py - 3); }
  }
}

function dibujar() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  ctx.fillStyle = "#140e1a";
  ctx.fillRect(0, 0, w, h);
  dibujarRejilla(w, h);
  const f = estado.figura;
  if (!f) return;

  const s = estado.escala;

  if (f.relleno) {
    ctx.fillStyle = "rgba(224, 64, 251, 0.28)";
    ctx.strokeStyle = "rgba(224, 64, 251, 0.45)";
    ctx.lineWidth = Math.max(s * 0.25, 1);
    for (const fila of f.relleno) {
      const [px1, py] = aPantalla(fila.x1, fila.y);
      const [px2] = aPantalla(fila.x2, fila.y);
      ctx.fillRect(px1 - s / 2, py - s / 2, (fila.x2 - fila.x1) * s + s, s);
      ctx.beginPath();
      ctx.moveTo(px1, py);
      ctx.lineTo(px2, py);
      ctx.stroke();
    }
  }

  const [cx, cy] = aPantalla(f.xc, f.yc);
  ctx.strokeStyle = "rgba(224, 64, 251, 0.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(cx, cy, f.rx * estado.escala, f.ry * estado.escala, 0, 0, Math.PI * 2);
  ctx.stroke();

  const sq = Math.max(s, 2);
  ctx.fillStyle = "#ff9e2c";
  for (const p of f.puntos) {
    const [px, py] = aPantalla(p.x, p.y);
    ctx.fillRect(px - sq / 2, py - sq / 2, sq, sq);
  }

  ctx.fillStyle = "#ff4444";
  ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#ffaa66";
  ctx.font = "bold 11px monospace";
  ctx.fillText(`Centro (${f.xc}, ${f.yc})  Rx = ${f.rx}  Ry = ${f.ry}`, cx + 10, cy - 10);
}

let arrastrando = false, ultimo = null;
const cursor = { px: -1, py: -1, visible: false };

function dibujarCursor(mx, my, px, py) {
  const w = canvas.clientWidth;
  ctx.save();

  const label = `(${Math.round(mx)}, ${Math.round(my)})`;
  ctx.font = "bold 12px monospace";
  const tw = ctx.measureText(label).width;
  const th = 16, pad = 6;
  let lx = px + 14, ly = py - 14;
  if (lx + tw + pad * 2 > w) lx = px - tw - pad * 2 - 10;
  if (ly - pad < 0) ly = py + 22;

  ctx.fillStyle = "rgba(20, 10, 30, 0.9)";
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(lx - pad, ly - th + 2, tw + pad * 2, th + 4, 5);
  } else {
    ctx.rect(lx - pad, ly - th + 2, tw + pad * 2, th + 4);
  }
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 180, 60, 0.7)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = "#ffe066";
  ctx.fillText(label, lx, ly);

  ctx.restore();
}

canvas.addEventListener("mouseenter", () => { cursor.visible = true; });
canvas.addEventListener("mouseleave", () => {
  cursor.visible = false;
  dibujar();
  document.getElementById("pie").textContent = "X = —   Y = —";
});
canvas.addEventListener("mousedown", e => {
  arrastrando = true;
  ultimo = [e.offsetX, e.offsetY];
});
window.addEventListener("mouseup", () => {
  arrastrando = false;
});
canvas.addEventListener("mousemove", e => {
  const [mx, my] = aMundo(e.offsetX, e.offsetY);
  document.getElementById("pie").textContent = `X = ${Math.round(mx)}   Y = ${Math.round(my)}`;
  if (arrastrando) {
    estado.ox += e.offsetX - ultimo[0];
    estado.oy += e.offsetY - ultimo[1];
    ultimo = [e.offsetX, e.offsetY];
  }
  dibujar();
  if (cursor.visible) {
    dibujarCursor(mx, my, e.offsetX, e.offsetY);
  }
});
canvas.addEventListener("wheel", e => { e.preventDefault(); zoom(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.offsetX, e.offsetY); }, { passive: false });

function zoom(factor, px, py) {
  const [mx, my] = aMundo(px, py);
  estado.escala = Math.min(Math.max(estado.escala * factor, 0.5), 80);
  estado.ox = px - mx * estado.escala;
  estado.oy = py + my * estado.escala;
  dibujar();
  if (cursor.visible) {
    const [curMx, curMy] = aMundo(px, py);
    dibujarCursor(curMx, curMy, px, py);
  }
}
document.getElementById("zoomMas").onclick = () => zoom(1.25, canvas.clientWidth / 2, canvas.clientHeight / 2);
document.getElementById("zoomMenos").onclick = () => zoom(1 / 1.25, canvas.clientWidth / 2, canvas.clientHeight / 2);
document.getElementById("centrar").onclick = centrar;

function leerEntradas() {
  const xc = parseInt(document.getElementById("xc").value, 10);
  const yc = parseInt(document.getElementById("yc").value, 10);
  const rx = parseInt(document.getElementById("rx").value, 10);
  const ry = parseInt(document.getElementById("ry").value, 10);
  const error = document.getElementById("error");
  if ([xc, yc, rx, ry].some(isNaN)) { error.textContent = "Escribe números enteros en Xc, Yc, Rx y Ry."; return null; }
  if (rx < 1 || ry < 1) { error.textContent = "Rx y Ry deben ser de 1 o más."; return null; }
  error.textContent = "";
  return { xc, yc, rx, ry };
}

function calcular() {
  const datos = leerEntradas();
  if (!datos) return;
  const res = elipsePuntoMedio(datos.xc, datos.yc, datos.rx, datos.ry);
  estado.figura = { ...datos, ...res };

  document.getElementById("d-centro").textContent = `(${datos.xc}, ${datos.yc})`;
  document.getElementById("d-rx").textContent = datos.rx;
  document.getElementById("d-ry").textContent = datos.ry;
  document.getElementById("d-area").textContent = (Math.PI * datos.rx * datos.ry).toFixed(2);
  document.getElementById("d-perimetro").textContent = perimetroElipse(datos.rx, datos.ry).toFixed(2);
  document.getElementById("d-puntos").textContent = res.puntos.length;
  const dFilas = document.getElementById("d-filas");
  if (dFilas) dFilas.textContent = res.relleno.length;
  const dPix = document.getElementById("d-pix");
  if (dPix) dPix.textContent = res.pixelesRelleno;
  document.getElementById("d-iter").textContent = res.iteraciones;

  document.getElementById("tabla").innerHTML = res.puntos
    .map((p, i) => `<tr><td>${i + 1}</td><td>${p.x}</td><td>${p.y}</td></tr>`).join("");
  centrar();
}

function limpiar() {
  estado.figura = null;
  ["d-centro","d-rx","d-ry","d-area","d-perimetro","d-puntos","d-filas","d-pix","d-iter"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = "—";
  });
  document.getElementById("tabla").innerHTML = "";
  ["xc","yc","rx","ry"].forEach(id => document.getElementById(id).value = "");
  document.getElementById("error").textContent = "";
  dibujar();
}

document.getElementById("calcular").onclick = calcular;
document.getElementById("limpiar").onclick = limpiar;
["xc","yc","rx","ry"].forEach(id => document.getElementById(id).addEventListener("keydown", e => { if (e.key === "Enter") calcular(); }));

window.addEventListener("resize", ajustarCanvas);
ajustarCanvas();

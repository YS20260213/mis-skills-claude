// ---------- model: g of solute per 100 g of solvent, every 10 °C ----------
const SV = { water: { name: "Water", f: "H₂O", polar: true, max: 100 }, hexane: { name: "Hexane", f: "C₆H₁₄", polar: false, max: 65 } };
const SU = {
  salt: { name: "Salt", f: "NaCl", kind: "ionic", max: 60, step: 1, start: 30, w: [35.7, 35.8, 35.9, 36.1, 36.4, 37, 37.3, 37.8, 38.4, 39, 39.8], h: 0 },
  kno3: { name: "Potassium nitrate", f: "KNO₃", kind: "ionic", max: 250, step: 5, start: 60, w: [13.3, 20.9, 31.6, 45.8, 63.9, 85.5, 110, 138, 169, 202, 246], h: 0 },
  sugar: { name: "Sugar", f: "C₁₂H₂₂O₁₁", kind: "polar", max: 500, step: 10, start: 250, w: [179, 190, 204, 219, 238, 260, 287, 320, 362, 415, 487], h: 0 },
  oil: { name: "Oil", f: "oil", kind: "oil", max: 40, step: 1, start: 15, w: 0, h: Infinity },
  iodine: { name: "Iodine", f: "I₂", kind: "iodine", max: 6, step: 0.1, start: 2, w: [0.014, 0.02, 0.029, 0.039, 0.052, 0.078, 0.1, 0.13, 0.17, 0.22, 0.28], h: [0.62, 0.86, 1.13, 1.48, 1.95, 2.55, 3.3, 3.3, 3.3, 3.3, 3.3] },
  co2: { name: "Carbon dioxide", f: "CO₂", kind: "gas", max: 0.4, step: 0.01, start: 0.25, w: [0.335, 0.232, 0.169, 0.126, 0.097, 0.076, 0.058, 0.045, 0.035, 0.024, 0.012], h: null },
};
const ORDER = Object.keys(SU);
const solAt = (u, v, t) => { const tb = SU[u][v === "water" ? "w" : "h"]; if (tb === null) return null; if (typeof tb === "number") return tb; const a = Math.max(0, Math.min(100, t)) / 10, i = Math.min(9, Math.floor(a)), f = a - i; return tb[i] + (tb[i + 1] - tb[i]) * f; };
const fmtG = (g) => g === null ? "–" : g === Infinity ? "∞" : g === 0 ? "0 g" : g < 1 ? g.toFixed(3) + " g" : g < 10 ? g.toFixed(1) + " g" : Math.round(g) + " g";
const kindWord = (k) => k === "ionic" ? "ionic (made of + and − ions)" : k === "polar" ? "polar" : "nonpolar";

// ---------- state ----------
const ST = { v: "water", u: "salt", set: 20, T: 20, A: 30, D: 0, stir: 0, noSeed: false, t: 0, spin: 0 };
const q = (s) => document.querySelector(s), qa = (s) => [...document.querySelectorAll(s)];
const NSS = "http://www.w3.org/2000/svg";
const mk = (tag, at = {}, parent) => { const e = document.createElementNS(NSS, tag); for (const n in at) e.setAttribute(n, at[n]); if (parent) parent.append(e); return e; };
const P = GEO.P, KS = GEO.KS, still = matchMedia("(prefers-reduced-motion: reduce)");
let CV = {};
const readColors = () => { const cs = getComputedStyle(document.body); for (const n of ["a-na", "a-cl", "a-o", "a-h", "a-c", "a-sug", "a-oil", "a-iod", "a-n", "ok", "warn", "bad", "heat", "glass", "tint", "c1", "c2", "c3", "c4"]) CV[n] = cs.getPropertyValue("--" + n).trim(); CV.ink = cs.getPropertyValue("--anatomy-strong").trim(); CV.mute = cs.getPropertyValue("--anatomy-muted").trim(); CV.faint = cs.getPropertyValue("--anatomy-faint").trim(); CV.dark = document.body.dataset.theme !== "light"; };

// theme
const pref = matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
document.body.dataset.theme = pref;
q("#theme").onclick = () => { document.body.dataset.theme = document.body.dataset.theme === "light" ? "dark" : "light"; readColors(); drawCurve(); drawAll(); };
readColors();

// ---------- controls ----------
function seg(box, items, fn) { for (const key in items) { const b = document.createElement("button"); b.dataset.k = key; b.innerHTML = items[key].name + (items[key].f !== "oil" ? ` <span class="mono" style="opacity:.6">${items[key].f}</span>` : ""); b.onclick = () => { stopDemo(); fn(key); }; q(box).append(b); } }
seg("#solvents", SV, (k) => pickSolvent(k));
seg("#solutes", SU, (k) => pickSolute(k));
qa("[data-jar]").forEach((g) => g.addEventListener("click", () => { stopDemo(); pickSolute(ORDER[+g.dataset.jar]); }));
qa("[data-bottle]").forEach((g) => g.addEventListener("click", () => { stopDemo(); pickSolvent(+g.dataset.bottle ? "hexane" : "water"); }));
q("#temp").oninput = (e) => { ST.set = +e.target.value; sync(); };
q("#amt").oninput = (e) => { ST.A = +e.target.value; if (ST.D > ST.A) ST.D = ST.A; ST.noSeed = false; sync(); };
qa("#stir button").forEach((b) => b.onclick = () => { ST.stir = +b.dataset.v; qa("#stir button").forEach((x) => x.setAttribute("aria-pressed", x === b)); });
function pickSolvent(k) { if (ST.u === "co2" && k === "hexane") ST.u = "salt"; ST.v = k; ST.D = 0; ST.noSeed = false; resetSim(); sync(); }
function pickSolute(k) { if (solAt(k, ST.v, 20) === null) ST.v = "water"; ST.u = k; ST.A = SU[k].start; ST.D = 0; ST.noSeed = false; resetSim(); sync(); }
function sync() {
  const u = SU[ST.u], v = SV[ST.v];
  qa("#solvents button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.k === ST.v));
  qa("#solutes button").forEach((b) => { b.setAttribute("aria-pressed", b.dataset.k === ST.u); b.disabled = solAt(b.dataset.k, ST.v, 20) === null; });
  const t = q("#temp"); t.max = v.max; if (ST.set > v.max) ST.set = v.max; t.value = ST.set;
  const a = q("#amt"); a.max = u.max; a.step = u.step; a.value = ST.A;
  q("#tempV").textContent = Math.round(ST.set) + " °C" + (ST.v === "hexane" ? " · boils at 69" : "");
  q("#amtV").textContent = fmtG(ST.A);
  const title = `${u.name} in ${v.name.toLowerCase()}`;
  q("#benchTitle").textContent = title; q("#curveTitle").textContent = `${u.f === "oil" ? "Oil" : u.f} in ${v.name.toLowerCase()}`;
  qa("[data-jar]").forEach((g) => { const on = ORDER[+g.dataset.jar] === ST.u; g.querySelector("[data-lift]").setAttribute("transform", on ? translateAlong(P, [0, 0, 9]) : ""); g.querySelector(".iso-solid")?.toggleAttribute("data-lit", on); });
  qa("[data-bottle]").forEach((g) => { const on = (+g.dataset.bottle ? "hexane" : "water") === ST.v; g.querySelector("[data-lift]").setAttribute("transform", on ? translateAlong(P, [0, 0, 7]) : ""); g.querySelector(".iso-solid")?.toggleAttribute("data-lit", on); });
  legend(); drawCurve();
}
const JARCOL = { salt: "--anatomy-hi", kno3: "--anatomy-mid", sugar: "--a-sug", oil: "--a-oil", iodine: "--a-iod", co2: "--anatomy-lo" };
qa("[data-fill]").forEach((p) => p.style.fill = `var(${JARCOL[ORDER[+p.dataset.fill]]})`);

// demos
let demoTimer = 0;
function stopDemo() { clearTimeout(demoTimer); demoTimer = 0; }
function runDemo(steps) { stopDemo(); const next = () => { const s = steps.shift(); if (!s) return; s(); demoTimer = setTimeout(next, 5200); }; next(); }
q("#demoLike").onclick = () => runDemo([["water", "salt"], ["water", "oil"], ["hexane", "oil"], ["water", "iodine"], ["hexane", "iodine"], ["hexane", "salt"]].map(([v, u]) => () => { ST.set = 25; pickSolvent(v); pickSolute(u); }));
q("#demoHeat").onclick = () => runDemo([() => { pickSolvent("water"); pickSolute("kno3"); ST.A = 120; ST.set = 10; sync(); }, () => { ST.set = 40; sync(); }, () => { ST.set = 70; sync(); }, () => { ST.set = 15; sync(); }]);
q("#demoSuper").onclick = () => runDemo([() => { pickSolvent("water"); pickSolute("kno3"); ST.A = 100; ST.set = 65; sync(); }, () => { ST.noSeed = true; ST.set = 20; sync(); }]);
q("#seed").onclick = () => { ST.noSeed = false; q("#seed").disabled = true; };

// ---------- Fig 1: bench ----------
const B = GEO.BK, floorZ = B.z + 1.2, surfZ = B.z + 1 + GEO.LIQ, rimZ = B.z + B.h;
const crystalSpots = Array.from({ length: 140 }, (_, i) => { const a = Math.random() * 6.283, r = Math.sqrt(Math.random()) * (B.r - 6); return { x: Math.cos(a) * r, y: Math.sin(a) * r, h: Math.max(0, (1 - r / (B.r - 6)) * 10) * Math.min(1, i / 60) }; })
  .sort((a, b) => depthOf([a.x, a.y, 0], P) - depthOf([b.x, b.y, 0], P));
const crystalG = q('[data-part="crystals"]'), bubbleG = q('[data-part="bubbles"]'), steamG = q('[data-part="steam"]');
let bubbles = [];
for (let i = 0; i < 3; i++) { const p = iso([-14 + i * 14, 6 - i * 6, rimZ + 4], P); mk("path", { d: `M${p[0]} ${p[1]} q-6 -10 0 -20 q6 -10 0 -20 q-6 -10 0 -18` }, steamG); }
const knobAt = { heat: [-34, 69], stir: [-8, 69] };
function benchFrame(dt, left) {
  const u = SU[ST.u], T = ST.T;
  q('[data-part="lcd"] text').textContent = (T < 10 ? " " : "") + T.toFixed(0) + "°C";
  q('[data-part="coils"]').setAttribute("opacity", Math.max(0, Math.min(1, (T - 22) / 60)).toFixed(2));
  const knob = (name, frac) => { const [x, y] = knobAt[name], a = -2.2 + frac * 4.4; q(`[data-part="knob-${name}"]`).setAttribute("d", lineOnTop([x, y], [x + Math.sin(a) * 5.5, y - Math.cos(a) * 5.5], GEO.SHELF_H + 8, P)); };
  knob("heat", ST.set / 100); knob("stir", ST.stir / 2);
  ST.spin += dt * [0, 5, 14][ST.stir] * (still.matches ? 0 : 1);
  const r = 13, c = Math.cos(ST.spin) * r, s = Math.sin(ST.spin) * r;
  q('[data-part="stirbar"]').setAttribute("d", lineOnTop([-c, -s], [c, s], floorZ + 1.5, P));
  const mz = Math.min(GEO.TH_Z1 - 6, GEO.TH_Z0 + 6 + T * 1.25);
  q('[data-part="mercury"]').setAttribute("d", segment([GEO.TH[0], GEO.TH[1], GEO.TH_Z0 + 2], [GEO.TH[0], GEO.TH[1], Math.min(mz, rimZ)], P));
  q('[data-part="mercury-top"]').setAttribute("d", mz > rimZ ? segment([GEO.TH[0], GEO.TH[1], rimZ], [GEO.TH[0], GEO.TH[1], mz], P) : "");
  // liquid colour
  let tint = ST.v === "water" ? CV.tint : CV["a-c"], op = 0.16;
  if (u.kind === "iodine") { const c = ST.D / (ST.v === "water" ? 0.3 : 3.3); tint = ST.v === "water" ? "#9a5b2c" : CV["a-iod"]; op = 0.14 + Math.min(0.55, c * 0.55); }
  const liq = q('[data-part="liquid"]'); liq.style.fill = tint; liq.style.fillOpacity = op;
  const oilH = u.kind === "oil" && ST.v === "water" ? Math.min(18, left * 0.6) : 0;
  const surf = q('[data-part="surface"]');
  if (oilH > 0.3) { const o = cylinder(0, 0, B.r - 1.2, surfZ - oilH, oilH, P, 72); q('[data-part="oil"]').setAttribute("d", o.fill); surf.style.fill = CV["a-oil"]; }
  else { q('[data-part="oil"]').setAttribute("d", ""); surf.style.fill = tint; }
  // crystals heaped on the floor
  const want = u.kind === "oil" || u.kind === "gas" ? 0 : Math.min(crystalSpots.length, Math.round((left / u.max) * 170) + (left > u.step * 0.3 ? 4 : 0));
  while (crystalG.childNodes.length < want) { const sp = crystalSpots[crystalG.childNodes.length], p = iso([sp.x, sp.y, floorZ + sp.h], P), q = 1.5 * KS;
    mk("path", { class: "crystal", d: `M${p[0]} ${p[1] - q}L${p[0] + q} ${p[1]}L${p[0]} ${p[1] + q}L${p[0] - q} ${p[1]}Z` }, crystalG); }
  while (crystalG.childNodes.length > want) crystalG.lastChild.remove();
  crystalG.style.setProperty("--x", 1); crystalG.querySelectorAll("path").forEach((e) => e.style.fill = u.kind === "iodine" ? CV["a-iod"] : u.kind === "polar" ? "#fff8ec" : "");
  // bubbles: escaping gas, or boiling
  const boil = ST.v === "water" ? (T - 85) / 15 : (T - 55) / 10;
  const rate = (u.kind === "gas" ? left * 90 : 0) + Math.max(0, boil) * 8;
  if (!still.matches && Math.random() < rate * dt && bubbles.length < 60) { const a = Math.random() * 6.28, rr = Math.random() * (B.r - 8); bubbles.push({ x: Math.cos(a) * rr, y: Math.sin(a) * rr, z: floorZ + 2, r: 0.8 + Math.random() * 1.6, e: mk("circle", { class: "bubble" }, bubbleG) }); }
  bubbles = bubbles.filter((b) => { b.z += dt * (22 + b.r * 10); const p = iso([b.x + Math.sin(b.z / 5) * 0.8, b.y, b.z], P); b.e.setAttribute("cx", p[0]); b.e.setAttribute("cy", p[1]); b.e.setAttribute("r", (b.r * KS).toFixed(2)); if (b.z > surfZ) { b.e.remove(); return false; } return true; });
  steamG.setAttribute("opacity", Math.max(0, Math.min(0.9, (ST.v === "water" ? (T - 70) / 25 : (T - 45) / 18))).toFixed(2));
  steamG.style.transform = `translateY(${-((ST.t * 8) % 8)}px)`;
  q("#benchRead").textContent = `${T.toFixed(1)} °C · stirrer ${["off", "slow", "fast"][ST.stir]}`;
}

// ---------- Fig 2: particle view ----------
const cv = q("#sim"), cx = cv.getContext("2d"), VW = 500, VH = 340, SURF = 58;
cx.scale(2, 2);
let mols = [], parts = [];
function resetSim() {
  mols = []; const n = ST.v === "water" ? 70 : 30;
  for (let i = 0; i < n; i++) mols.push({ x: Math.random() * VW, y: SURF + 10 + Math.random() * (VH - SURF - 20), a: Math.random() * 6.28, vx: 0, vy: 0 });
  parts = []; const cols = 8;
  for (let i = 0; i < 32; i++) { const col = i % cols, row = Math.floor(i / cols), hx = VW / 2 - 60 + col * 17 + (row % 2) * 0, hy = VH - 14 - row * 16;
    parts.push({ i, hx, hy, x: hx, y: hy, free: false, vx: 0, vy: 0, a: Math.random() * 6, g: Math.random() * 6.28 }); }
}
function ball(x, y, r, col) { const g = cx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r); g.addColorStop(0, CV.dark ? "#ffffffcc" : "#ffffff"); g.addColorStop(0.35, col); g.addColorStop(1, col); cx.fillStyle = g; cx.beginPath(); cx.arc(x, y, r, 0, 6.283); cx.fill(); }
function drawSolvent(m, ang) {
  cx.save(); cx.translate(m.x, m.y); cx.rotate(ang);
  if (ST.v === "water") { for (const s of [-1, 1]) { const hx = Math.cos(s * 0.91) * 8, hy = Math.sin(s * 0.91) * 8; cx.strokeStyle = CV.mute; cx.lineWidth = 1.4; cx.beginPath(); cx.moveTo(0, 0); cx.lineTo(hx, hy); cx.stroke(); ball(hx, hy, 3.6, CV["a-h"]); } ball(0, 0, 6.2, CV["a-o"]); }
  else { cx.strokeStyle = CV["a-c"]; cx.lineWidth = 2; cx.beginPath(); for (let j = 0; j < 6; j++) cx.lineTo(-17.5 + j * 7, j % 2 ? 3.5 : -3.5); cx.stroke(); for (let j = 0; j < 6; j++) ball(-17.5 + j * 7, j % 2 ? 3.5 : -3.5, 3, CV["a-c"]); }
  cx.restore();
}
function drawSolute(p) {
  const k = SU[ST.u].kind; cx.save(); cx.translate(p.x, p.y);
  if (k === "ionic") { const plus = p.i % 2 === 0, r = plus ? 5.2 : 7.4; if (p.free && ST.v === "water") { cx.strokeStyle = plus ? CV["a-na"] : CV["a-cl"]; cx.globalAlpha = 0.35; cx.setLineDash([2, 3]); cx.beginPath(); cx.arc(0, 0, 17, 0, 6.283); cx.stroke(); cx.setLineDash([]); cx.globalAlpha = 1; }
    ball(0, 0, r, plus ? CV["a-na"] : CV["a-cl"]); cx.fillStyle = "#fff"; cx.font = "bold 9px system-ui"; cx.textAlign = "center"; cx.textBaseline = "middle"; cx.fillText(plus ? "+" : "−", 0, 0.5); }
  else { cx.rotate(p.a);
    if (k === "polar") { cx.strokeStyle = CV["a-sug"]; cx.lineWidth = 2; cx.beginPath(); for (let j = 0; j < 6; j++) cx.lineTo(Math.cos(j * 1.047) * 7, Math.sin(j * 1.047) * 7); cx.closePath(); cx.globalAlpha = 0.25; cx.fillStyle = CV["a-sug"]; cx.fill(); cx.globalAlpha = 1; cx.stroke(); for (let j = 0; j < 6; j += 2) ball(Math.cos(j * 1.047) * 10, Math.sin(j * 1.047) * 10, 2.4, CV["a-o"]); }
    else if (k === "oil") { cx.strokeStyle = CV["a-oil"]; cx.lineWidth = 3.4; cx.lineCap = "round"; cx.lineJoin = "round"; cx.beginPath(); for (let j = 0; j < 6; j++) cx.lineTo(-15 + j * 6, j % 2 ? 3 : -3); cx.stroke(); }
    else if (k === "iodine") { ball(-4.6, 0, 5, CV["a-iod"]); ball(4.6, 0, 5, CV["a-iod"]); }
    else { ball(-8, 0, 4.2, CV["a-o"]); ball(8, 0, 4.2, CV["a-o"]); ball(0, 0, 4.4, CV["a-c"]); } }
  cx.restore();
}
function simFrame(dt) {
  const u = SU[ST.u], k = u.kind, heat = 0.45 + ST.T / 45, mv = still.matches ? 0.15 : 1;
  const nShow = Math.max(ST.A > 0 ? 2 : 0, Math.round(parts.length * Math.min(1, ST.A / u.max))), nFree = Math.round(nShow * (ST.A > 0 ? ST.D / ST.A : 0));
  cx.clearRect(0, 0, VW, VH);
  // headspace and liquid
  const lg = cx.createLinearGradient(0, SURF, 0, VH); lg.addColorStop(0, (ST.v === "water" ? CV.tint : CV["a-c"]) + "30"); lg.addColorStop(1, (ST.v === "water" ? CV.tint : CV["a-c"]) + "08");
  cx.fillStyle = lg; cx.beginPath(); cx.moveTo(0, VH); for (let x = 0; x <= VW; x += 5) cx.lineTo(x, SURF + Math.sin(x / 22 + ST.t * 1.6) * 2.2); cx.lineTo(VW, VH); cx.fill();
  cx.strokeStyle = CV.glass; cx.globalAlpha = 0.6; cx.lineWidth = 1.2; cx.beginPath(); for (let x = 0; x <= VW; x += 5) cx.lineTo(x, SURF + Math.sin(x / 22 + ST.t * 1.6) * 2.2); cx.stroke(); cx.globalAlpha = 1;
  cx.strokeStyle = CV.faint; cx.lineWidth = 0.5; for (let x = 50; x < VW; x += 50) { cx.beginPath(); cx.moveTo(x, 0); cx.lineTo(x, VH); cx.stroke(); }
  const layer = k === "oil" && ST.v === "water";
  parts.forEach((p, j) => {
    p.show = j < nShow; if (!p.show) return; const want = j < nFree;
    if (want && !p.free) { p.free = true; p.vx = (Math.random() - 0.5) * 2; p.vy = -1.5 - Math.random(); }
    if (!want) p.free = false;
    let hx = p.hx, hy = p.hy;
    if (layer) { hx = 18 + (j % 12) * 40; hy = SURF + 10 + Math.floor(j / 12) * 12; }
    if (k === "gas" && !want) { hx = 20 + ((j * 67) % (VW - 40)); hy = 12 + ((j * 23) % 34); }
    if (p.free) { p.vx += (Math.random() - 0.5) * 0.7 * heat; p.vy += (Math.random() - 0.5) * 0.7 * heat; p.vx *= 0.93; p.vy *= 0.93; const sp = (1 + ST.stir * 0.7) * mv; p.x += p.vx * sp; p.y += p.vy * sp;
      if (p.x < 10 || p.x > VW - 10) p.vx *= -1; if (p.y < SURF + 12 || p.y > VH - 10) p.vy *= -1; p.x = Math.max(10, Math.min(VW - 10, p.x)); p.y = Math.max(SURF + 12, Math.min(VH - 10, p.y)); p.a += 0.03 * mv; }
    else if (k === "gas") { p.x += (hx - p.x) * 0.04 + (Math.random() - 0.5) * 3 * heat * mv; p.y += (hy - p.y) * 0.04 + (Math.random() - 0.5) * 3 * heat * mv; p.a += 0.08 * mv; }
    else { const jig = Math.random() < 0.3 ? (Math.random() - 0.5) * 0.6 * heat : 0; p.x += (hx - p.x) * 0.08 + jig; p.y += (hy - p.y) * 0.08; p.a += ((layer ? Math.sin(ST.t + j) * 0.4 : 0) - p.a) * 0.1; }
  });
  const free = parts.filter((p) => p.show && p.free);
  mols.forEach((m) => {
    m.vx += (Math.random() - 0.5) * 0.9 * heat; m.vy += (Math.random() - 0.5) * 0.9 * heat; m.vx *= 0.9; m.vy *= 0.9;
    if (ST.v === "water" && (k === "ionic" || k === "polar")) { let best = null, bd = 34; for (const p of free) { const d = Math.hypot(p.x - m.x, p.y - m.y); if (d < bd) { bd = d; best = p; } }
      if (best) { const to = Math.atan2(best.y - m.y, best.x - m.x), ring = k === "ionic" ? (best.i % 2 === 0 ? 15 : 18) : 17; m.vx += Math.cos(to) * (bd - ring) * 0.025; m.vy += Math.sin(to) * (bd - ring) * 0.025;
        const target = k === "ionic" && best.i % 2 === 1 ? to : to + Math.PI; let d = target - m.a; d = Math.atan2(Math.sin(d), Math.cos(d)); m.a += d * 0.18; } }
    if (layer && m.y < SURF + 36) m.vy += 0.45;
    const sp = (1 + ST.stir * 0.5) * mv; m.x += m.vx * sp; m.y += m.vy * sp; m.a += (Math.random() - 0.5) * 0.08 * mv;
    if (m.x < -10) m.x += VW + 20; if (m.x > VW + 10) m.x -= VW + 20; m.y = Math.max(SURF + 8, Math.min(VH - 8, m.y));
    drawSolvent(m, m.a);
  });
  parts.forEach((p) => p.show && drawSolute(p));
  // on-screen captions in the screen's own type
  cx.fillStyle = CV.mute; cx.font = "10px ui-monospace,Menlo,monospace"; cx.textAlign = "left";
  cx.fillText(`${SV[ST.v].f} · ${SV[ST.v].polar ? "POLAR" : "NONPOLAR"}   +   ${u.f === "oil" ? "OIL" : u.f}`, 10, 16);
  cx.fillText(k === "gas" ? "GAS ABOVE THE LIQUID" : "AIR", 10, 34);
  cx.textAlign = "right"; cx.fillText(`${ST.T.toFixed(0)} °C`, VW - 10, 16);
  cx.strokeStyle = CV.mute; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(VW - 60, VH - 10); cx.lineTo(VW - 10, VH - 10); cx.moveTo(VW - 60, VH - 13); cx.lineTo(VW - 60, VH - 7); cx.moveTo(VW - 10, VH - 13); cx.lineTo(VW - 10, VH - 7); cx.stroke();
  cx.fillText("1 nm", VW - 10, VH - 16);
  q("#simRead").textContent = `${free.length} / ${nShow} particles free`;
}
function legend() {
  const k = SU[ST.u].kind, items = [];
  if (ST.v === "water") items.push(["a-o", "O (δ−)"], ["a-h", "H (δ+)"]); else items.push(["a-c", "C in hexane"]);
  if (k === "ionic") items.push(["a-na", ST.u === "salt" ? "Na⁺ ion" : "K⁺ ion"], ["a-cl", ST.u === "salt" ? "Cl⁻ ion" : "NO₃⁻ ion"]);
  if (k === "polar") items.push(["a-sug", "sugar molecule"]); if (k === "oil") items.push(["a-oil", "oil molecule"]); if (k === "iodine") items.push(["a-iod", "I₂ molecule"]); if (k === "gas") items.push(["a-o", "CO₂ molecule"]);
  q("#legend").innerHTML = items.map(([c, t]) => `<span><i style="background:var(--${c})"></i>${t}</span>`).join("");
}

// ---------- Fig 3: live curve ----------
const C3 = { x0: 64, x1: 672, y0: 320, y1: 26 };
let X3, Y3, top3;
function drawCurve() {
  const g = q("#curve"); g.innerHTML = ""; const u = SU[ST.u], v = ST.v, tmax = SV[v].max, cap20 = solAt(ST.u, v, 20);
  const vals = [0, 20, 40, 60, 80, 100].map((t) => solAt(ST.u, v, t)).filter((x) => x !== null && x !== Infinity);
  top3 = niceMax(Math.max(u.max, ...vals)); X3 = (t) => C3.x0 + (t / 100) * (C3.x1 - C3.x0); Y3 = (gr) => C3.y0 - (Math.min(gr, top3) / top3) * (C3.y0 - C3.y1);
  const grid = mk("g", { class: "grid" }, g);
  for (let i = 0; i <= 5; i++) { const gv = (top3 * i) / 5; mk("line", { x1: C3.x0, x2: C3.x1, y1: Y3(gv), y2: Y3(gv) }, grid); const t = mk("text", { x: C3.x0 - 10, y: Y3(gv) + 4, "text-anchor": "end" }, g); t.textContent = gv === 0 ? "0" : gv < 1 ? gv.toFixed(2) : Math.round(gv); }
  for (let t = 0; t <= 100; t += 20) { const tx = mk("text", { x: X3(t), y: C3.y0 + 22, "text-anchor": "middle" }, g); tx.textContent = t + "°"; }
  mk("line", { class: "axis", x1: C3.x0, x2: C3.x1, y1: C3.y0, y2: C3.y0 }, g);
  const yl = mk("text", { x: C3.x0 - 40, y: 12, "text-anchor": "start" }, g); yl.textContent = "g / 100 g";
  const xl = mk("text", { x: C3.x1, y: C3.y0 + 22, "text-anchor": "end" }, g); xl.textContent = "°C";
  const defs = mk("defs", {}, g);
  const lgU = mk("linearGradient", { id: "gU", x1: 0, x2: 0, y1: 0, y2: 1 }, defs); mk("stop", { offset: 0, "stop-color": CV.ok, "stop-opacity": 0.22 }, lgU); mk("stop", { offset: 1, "stop-color": CV.ok, "stop-opacity": 0.02 }, lgU);
  const pat = mk("pattern", { id: "hatch", width: 6, height: 6, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" }, defs); mk("line", { x1: 0, y1: 0, x2: 0, y2: 6, stroke: CV.mute, "stroke-width": 1, opacity: 0.35 }, pat);
  if (cap20 === Infinity || cap20 === 0) {
    const big = mk("text", { x: (C3.x0 + C3.x1) / 2, y: 150, "text-anchor": "middle", class: "lbl", style: "font-size:20px;fill:var(--anatomy-strong)" }, g);
    big.textContent = cap20 === Infinity ? "No limit: they mix in any amount" : "Almost zero: it does not dissolve";
    const sm = mk("text", { x: (C3.x0 + C3.x1) / 2, y: 180, "text-anchor": "middle" }, g);
    sm.textContent = `${u.name} is ${kindWord(u.kind).split(" ")[0]} · ${SV[v].name.toLowerCase()} is ${SV[v].polar ? "polar" : "nonpolar"}`;
    if (cap20 === 0) mk("line", { x1: X3(0), x2: X3(tmax), y1: Y3(0) - 1, y2: Y3(0) - 1, stroke: CV.c1, "stroke-width": 2.2 }, g);
  } else {
    let d = "", area = `M${X3(0)} ${C3.y0}`; for (let t = 0; t <= tmax; t += 1) { const p = `${X3(t).toFixed(1)} ${Y3(solAt(ST.u, v, t)).toFixed(1)}`; d += (t ? "L" : "M") + p; area += "L" + p; }
    area += `L${X3(tmax)} ${C3.y0}Z`; mk("path", { d: area, fill: "url(#gU)" }, g);
    mk("path", { d: d + `L${X3(tmax)} ${C3.y1}L${X3(0)} ${C3.y1}Z`, fill: CV.bad, opacity: 0.05 }, g);
    mk("path", { class: "curve", d, stroke: CV.c1 }, g);
    const lab = (x, y, t, c, anchor = "start") => { const e = mk("text", { x, y, class: "lbl", fill: c, "text-anchor": anchor }, g); e.textContent = t; };
    lab(X3(tmax) - 8, C3.y0 - 12, "UNSATURATED · room for more", CV.ok, "end");
    lab(X3(3), C3.y1 + 16, "ABOVE THE LINE · too much: solid stays, or supersaturated", CV.bad);
    const lt = Math.min(tmax, 85), ly = Y3(solAt(ST.u, v, lt)); lab(X3(lt) - 6, ly - 10, "saturated (on the line)", CV.c1, "end");
    if (tmax < 100) { mk("rect", { x: X3(tmax), y: C3.y1, width: X3(100) - X3(tmax), height: C3.y0 - C3.y1, fill: "url(#hatch)" }, g); const bt = mk("text", { x: (X3(tmax) + X3(100)) / 2, y: 170, "text-anchor": "middle" }, g); bt.textContent = "boils"; }
  }
  mk("line", { id: "cur3", y1: C3.y1, y2: C3.y0, stroke: CV.heat, "stroke-dasharray": "3 4", "stroke-width": 1.2 }, g);
  mk("line", { id: "gap3", stroke: CV.mute, "stroke-width": 1, "stroke-dasharray": "1 3" }, g);
  mk("circle", { id: "ptA", r: 7, fill: "none", stroke: CV.ink, "stroke-width": 1.6 }, g);
  mk("circle", { id: "ptD", r: 5, fill: CV.heat, stroke: "var(--anatomy-card)", "stroke-width": 2 }, g);
  mk("text", { id: "ptT", class: "lbl", fill: CV.ink }, g);
  mk("rect", { x: C3.x0, y: C3.y1, width: C3.x1 - C3.x0, height: C3.y0 - C3.y1, fill: "transparent", id: "hit3" }, g);
  hover("#curve", "#tip3", "#curvePlate", 700, C3, (t) => { const c = solAt(ST.u, ST.v, t); return c === null || c === Infinity || t > SV[ST.v].max ? null : `${t} °C → ${fmtG(c)} can dissolve`; });
}
function curveFrame(cap) {
  if (!X3 || cap === Infinity || cap === 0 || cap === null) { q("#curveRead").textContent = cap === Infinity ? "no limit" : "≈ 0 g"; return; }
  const x = X3(ST.T), ya = Y3(ST.A), yd = Y3(ST.D);
  for (const id of ["cur3"]) { q("#" + id).setAttribute("x1", x); q("#" + id).setAttribute("x2", x); }
  q("#ptA").setAttribute("cx", x); q("#ptA").setAttribute("cy", ya); q("#ptD").setAttribute("cx", x); q("#ptD").setAttribute("cy", yd);
  const gp = q("#gap3"); gp.setAttribute("x1", x); gp.setAttribute("x2", x); gp.setAttribute("y1", ya); gp.setAttribute("y2", yd);
  const tl = q("#ptT"); tl.setAttribute("x", x + (x > 520 ? -12 : 12)); tl.setAttribute("y", Math.max(C3.y1 + 34, ya - 10)); tl.setAttribute("text-anchor", x > 520 ? "end" : "start"); tl.textContent = `added ${fmtG(ST.A)}`;
  q("#curveRead").textContent = `${ST.T.toFixed(0)} °C · limit ${fmtG(cap)}`;
}
function niceMax(v) { const p = Math.pow(10, Math.floor(Math.log10(v))); for (const m of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (m * p >= v) return m * p; return v; }
function hover(svgSel, tipSel, plateSel, vbW, box, text) {
  const svg = q(svgSel), tip = q(tipSel);
  svg.onpointermove = (e) => { const r = svg.getBoundingClientRect(), vx = ((e.clientX - r.left) / r.width) * vbW, t = Math.round(((vx - box.x0) / (box.x1 - box.x0)) * 100);
    const s = t >= 0 && t <= 100 ? text(t) : null; if (!s) { tip.style.opacity = 0; return; }
    const pr = q(plateSel).getBoundingClientRect(); tip.innerHTML = s; tip.style.opacity = 1; tip.style.left = Math.min(pr.width - 220, e.clientX - pr.left + 14) + "px"; tip.style.top = e.clientY - pr.top - 44 + "px";
    const hl = svg.querySelector(".hl"); const x = box.x0 + (t / 100) * (box.x1 - box.x0); if (hl) { hl.setAttribute("x1", x); hl.setAttribute("x2", x); hl.style.opacity = 1; } };
  svg.onpointerleave = () => { tip.style.opacity = 0; const hl = svg.querySelector(".hl"); if (hl) hl.style.opacity = 0; };
}

// ---------- Fig 4: classic curves ----------
const ALL = [["KNO₃", "c1", SU.kno3.w], ["KCl", "c2", [28, 31.2, 34.2, 37.2, 40.1, 42.6, 45.8, 48.8, 51.3, 53.9, 56.3]], ["NaCl", "c3", SU.salt.w], ["Ce₂(SO₄)₃", "c4", [21.4, 14.5, 9.8, 7.2, 5.6, 4.6, 3.9, 3.2, 2.6, 2.2, 1.8]]];
const C4 = { x0: 60, x1: 690, y0: 352, y1: 22 };
function drawAll() {
  const g = q("#all"); g.innerHTML = ""; const X = (t) => C4.x0 + (t / 100) * (C4.x1 - C4.x0), Y = (v) => C4.y0 - (v / 250) * (C4.y0 - C4.y1);
  const grid = mk("g", { class: "grid" }, g);
  for (let v = 0; v <= 250; v += 50) { mk("line", { x1: C4.x0, x2: C4.x1, y1: Y(v), y2: Y(v) }, grid); const t = mk("text", { x: C4.x0 - 10, y: Y(v) + 4, "text-anchor": "end" }, g); t.textContent = v; }
  for (let t = 0; t <= 100; t += 10) { const tx = mk("text", { x: X(t), y: C4.y0 + 22, "text-anchor": "middle" }, g); tx.textContent = t + (t === 100 ? " °C" : ""); }
  mk("line", { class: "axis", x1: C4.x0, x2: C4.x1, y1: C4.y0, y2: C4.y0 }, g);
  mk("line", { class: "hl", y1: C4.y1, y2: C4.y0, stroke: CV.mute, "stroke-dasharray": "3 4", style: "opacity:0" }, g);
  ALL.forEach(([name, c, vals]) => { const d = vals.map((v, i) => `${i ? "L" : "M"}${X(i * 10)} ${Y(v)}`).join(""); mk("path", { class: "curve", d, stroke: CV[c], "stroke-width": 2.5 }, g);
    vals.forEach((v, i) => mk("circle", { cx: X(i * 10), cy: Y(v), r: 2.6, fill: CV[c], stroke: "var(--anatomy-card)", "stroke-width": 1.5 }, g));
    const end = vals[10], lx = name === "KNO₃" ? X(92) : X(100) + 6, ly = name === "KNO₃" ? Y(228) : Y(end) + (name === "NaCl" ? -6 : name === "KCl" ? -4 : 4);
    const t = mk("text", { x: lx, y: ly, class: "lbl", fill: CV.ink, "text-anchor": name === "KNO₃" ? "end" : "start" }, g); t.textContent = name; });
  const cr = mk("circle", { cx: X(22), cy: Y(36), r: 9, fill: "none", stroke: CV.ink, "stroke-dasharray": "2 3" }, g);
  const ct = mk("text", { x: X(24), y: Y(36) - 16 }, g); ct.textContent = "same amount here";
  const lg = mk("g", {}, g); ALL.forEach(([name, c], i) => { mk("line", { x1: C4.x0 + 12 + i * 92, x2: C4.x0 + 30 + i * 92, y1: C4.y1 + 6, y2: C4.y1 + 6, stroke: CV[c], "stroke-width": 2.5 }, lg); const t = mk("text", { x: C4.x0 + 36 + i * 92, y: C4.y1 + 10 }, lg); t.textContent = name; });
  hover("#all", "#tip4", "#allPlate", 760, C4, (t) => `${t} °C<br>` + ALL.map(([n, , v]) => { const a = t / 10, i = Math.min(9, Math.floor(a)); return `${n}: ${(v[i] + (v[i + 1] - v[i]) * (a - i)).toFixed(1)} g`; }).join("<br>"));
}

// ---------- story ----------
function explain(cap, state) {
  const u = SU[ST.u], v = SV[ST.v], k = u.kind;
  if (ST.noSeed && state === "supersaturated") return `<b>Supersaturated!</b> We heated the water to 65 °C, dissolved 100 g of KNO₃, and cooled it slowly to 20 °C. The limit is now only ${fmtG(cap)}, but all 100 g are still dissolved. It is <b>not stable</b>. Press <b>Drop seed crystal</b> and watch the extra come out.`;
  if (cap === 0 || (k === "iodine" && ST.v === "water")) return `<b>${u.name}</b> is ${kindWord(k)}. <b>${v.name}</b> is ${v.polar ? "polar" : "nonpolar"}. They are <b>not alike</b>, so the solvent cannot pull the particles away from each other. ${k === "oil" ? "Oil is lighter than water, so it makes a layer on top." : k === "iodine" ? "Only a tiny bit dissolves, and the water turns light brown." : "The crystals stay at the bottom."}`;
  if (cap === Infinity) return `Oil and hexane are both <b>nonpolar</b>. Like dissolves like, so they <b>mix in any amount</b>. There is no saturation point.`;
  if (k === "ionic") return `Water is <b>polar</b>. Its <b>δ− oxygen</b> side turns toward the <b>+ ions</b>, and its <b>δ+ hydrogen</b> side turns toward the <b>− ions</b>. Water molecules pull ions off the crystal and surround them (dashed rings). ${state === "saturated" ? "Now it is <b>saturated</b>: ions leave and join the crystal at the same speed." : ST.D < ST.A - 0.01 ? "Dissolving… " + (ST.stir ? "stirring makes it faster." : "try stirring to make it faster.") : "Everything dissolved: there is room for more."}`;
  if (k === "polar") return `Sugar is <b>polar</b>, like water. Water molecules stick to the OH groups of sugar and carry the molecules away. ${ST.T > 50 ? "Hot water holds much more sugar." : "Heat it: hot water holds much more sugar."}`;
  if (k === "iodine") return `Iodine and hexane are both <b>nonpolar</b>, so iodine dissolves and the liquid turns <b>purple</b>. In water it would barely dissolve.`;
  if (k === "gas") return `CO₂ gas dissolves a little in water. <b>Heat makes gases escape</b>: at ${ST.T.toFixed(0)} °C only ${fmtG(cap)} can stay. The rest bubbles out. This is why warm soda goes flat.`;
  return "";
}

// ---------- learn tabs ----------
const mini = (level, solid, col, extra = "") => `<svg viewBox="0 0 120 92" aria-hidden="true"><ellipse cx="60" cy="84" rx="36" ry="6" fill="var(--anatomy-halo)" opacity=".25"/><path d="M34 14v62a26 8 0 0 0 52 0V14" fill="var(--glass)" fill-opacity=".05" stroke="var(--glass)"/>
${level ? `<path d="M35 ${82 - level}v${level - 6}a25 7 0 0 0 50 0v-${level - 6}z" fill="var(${col})" fill-opacity=".25"/><ellipse cx="60" cy="${82 - level}" rx="25" ry="6" fill="var(${col})" fill-opacity=".3" stroke="var(--glass)" stroke-opacity=".6"/>` : ""}
${Array.from({ length: solid }, (_, i) => `<rect x="${44 + (i * 7) % 32}" y="${72 - Math.floor(i / 5) * 4}" width="4" height="4" transform="rotate(45 ${46 + (i * 7) % 32} ${74 - Math.floor(i / 5) * 4})" fill="var(--anatomy-face)" stroke="var(--anatomy-hi)" stroke-width=".6"/>`).join("")}
<ellipse cx="60" cy="14" rx="26" ry="8" fill="none" stroke="var(--glass)"/>${extra}</svg>`;
const dots = (n, col, y0, y1, r = 2.2) => Array.from({ length: n }, (_, i) => `<circle r="${r}" fill="var(${col})" cx="${42 + ((i * 37) % 36)}" cy="${y0 + ((i * 53) % (y1 - y0))}"><animate attributeName="cy" values="${y0 + ((i * 53) % (y1 - y0))};${y0 + ((i * 29 + 13) % (y1 - y0))};${y0 + ((i * 53) % (y1 - y0))}" dur="${3 + (i % 4)}s" repeatCount="indefinite"/></circle>`).join("");
const TABS = [
  ["Types", "Solutions can be gas, liquid or solid", [
    ["Gas in gas", "Air", "Oxygen spreads in nitrogen.", mini(0, 0, "--tint", dots(10, "--a-o", 20, 74) + dots(12, "--a-n", 20, 74, 1.8))],
    ["Gas in liquid", "Soda", "CO₂ is pushed into water.", mini(48, 0, "--tint", dots(8, "--anatomy-hi", 40, 76, 1.6))],
    ["Liquid in liquid", "Vinegar", "Acetic acid in water.", mini(44, 0, "--warn", dots(8, "--warn", 42, 76))],
    ["Solid in liquid", "Sea water", "Salt in water.", mini(46, 0, "--tint", dots(6, "--a-na", 40, 76) + dots(6, "--a-cl", 40, 76))],
    ["Solid in solid", "Brass", "Zinc in copper. An alloy.", `<svg viewBox="0 0 120 92" aria-hidden="true"><path d="M30 40l30-16 30 16-30 16z" fill="var(--anatomy-top)" stroke="var(--anatomy-hi)"/><path d="M30 40v22l30 16V56z" fill="var(--anatomy-shade-1)" stroke="var(--anatomy-hi)"/><path d="M90 40v22L60 78V56z" fill="var(--anatomy-shade-3)" stroke="var(--anatomy-hi)"/>${Array.from({ length: 12 }, (_, i) => `<circle cx="${42 + (i % 4) * 12}" cy="${34 + Math.floor(i / 4) * 6 + (i % 2) * 2}" r="2.6" fill="var(${i % 4 === 1 ? "--a-iod" : "--warn"})"/>`).join("")}</svg>`],
    ["Liquid in solid", "Dental filling", "Mercury in silver (amalgam).", `<svg viewBox="0 0 120 92" aria-hidden="true"><path d="M44 16c10-6 22-6 32 0 6 14-2 52-8 52-4 0-4-18-8-18s-4 18-8 18c-6 0-14-38-8-52z" fill="var(--anatomy-top)" stroke="var(--anatomy-hi)"/><ellipse cx="60" cy="24" rx="9" ry="5" fill="var(--anatomy-mid)"/></svg>`],
  ]],
  ["How full", "Unsaturated, saturated, supersaturated", [
    ["Unsaturated", "Room for more", "Less solute than it can hold. More will still dissolve.", mini(46, 0, "--ok", dots(5, "--a-na", 42, 76))],
    ["Saturated", "Full", "Holds the most it can. Extra stays at the bottom. Particles leave and join at the same speed.", mini(46, 9, "--warn", dots(10, "--a-na", 42, 72))],
    ["Supersaturated", "Too full", "Holds more than the limit, after slow cooling. One seed crystal makes the extra come out fast.", mini(46, 1, "--bad", dots(16, "--a-na", 42, 76))],
    ["Dilute · concentrated", "A little or a lot", "Dilute: a little solute. Concentrated: a lot. These words only compare two solutions.", mini(46, 0, "--tint", dots(3, "--a-na", 42, 76)) ],
  ]],
  ["Heat & pressure", "Temperature changes how much can dissolve", [
    ["Solids", "Hot = usually more", "Hot particles move fast and hit the crystal harder. KNO₃ and sugar change a lot; salt changes very little.", mini(46, 2, "--heat", dots(10, "--a-sug", 42, 76))],
    ["Gases", "Hot = less", "Gas particles escape faster from hot water. Warm soda goes flat.", mini(46, 0, "--tint", dots(3, "--anatomy-hi", 44, 76, 1.6) + `<g fill="none" stroke="var(--glass)">${[0, 1, 2].map((i) => `<circle cx="${50 + i * 10}" r="2.5"><animate attributeName="cy" values="76;34" dur="${1.4 + i * 0.4}s" repeatCount="indefinite"/></circle>`).join("")}</g>`)],
    ["Pressure", "Only for gases", "More pressure pushes more gas into the liquid. Open a soda: pressure drops, bubbles come out.", `<svg viewBox="0 0 120 92" aria-hidden="true"><path d="M50 4h20v10l8 10v62H42V24l8-10z" fill="var(--glass)" fill-opacity=".08" stroke="var(--glass)"/><rect x="48" y="0" width="24" height="6" fill="var(--bad)"/><path d="M43 40h34v45H43z" fill="var(--tint)" fill-opacity=".25"/>${dots(10, "--anatomy-hi", 44, 82, 1.4).replace(/cx="(\d+)/g, (m, x) => `cx="${+x + 6}`)}</svg>`],
  ]],
  ["Like dissolves like", "Polar with polar, nonpolar with nonpolar", null],
  ["Faster", "Speed is not amount", [
    ["Stirring", "Fresh solvent", "Moves new solvent next to the crystal.", mini(46, 4, "--tint", `<path d="M60 18v44" stroke="var(--anatomy-hi)" stroke-width="2"/><rect x="50" y="60" width="20" height="4" rx="2" fill="var(--anatomy-hi)"><animateTransform attributeName="transform" type="rotate" from="0 60 62" to="360 60 62" dur="1s" repeatCount="indefinite"/></rect>`)],
    ["Heat", "Faster particles", "Particles move faster and hit harder.", mini(46, 3, "--heat", dots(8, "--a-o", 42, 76))],
    ["Small pieces", "More surface", "Powder has much more surface than one big lump.", `<svg viewBox="0 0 120 92" aria-hidden="true"><rect x="16" y="40" width="30" height="30" fill="var(--anatomy-top)" stroke="var(--anatomy-hi)"/>${Array.from({ length: 9 }, (_, i) => `<rect x="${70 + (i % 3) * 12}" y="${40 + Math.floor(i / 3) * 12}" width="8" height="8" fill="var(--anatomy-top)" stroke="var(--anatomy-hi)"/>`).join("")}<text x="31" y="84" text-anchor="middle" font-size="9" fill="var(--anatomy-muted)">slow</text><text x="88" y="84" text-anchor="middle" font-size="9" fill="var(--anatomy-muted)">fast</text></svg>`],
    ["Remember", "Speed ≠ amount", "Stirring and small pieces only change the speed. Only temperature (and pressure for gases) changes how much can dissolve.", `<svg viewBox="0 0 120 92" aria-hidden="true"><path d="M20 70 Q60 70 100 22" fill="none" stroke="var(--c1)" stroke-width="2.5"/><path d="M20 70 Q30 30 100 22" fill="none" stroke="var(--heat)" stroke-width="2.5" stroke-dasharray="4 4"/><line x1="18" y1="22" x2="102" y2="22" stroke="var(--anatomy-mid)" stroke-dasharray="2 3"/><text x="104" y="25" font-size="8" fill="var(--anatomy-muted)">limit</text></svg>`],
  ]],
];
const likeHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;align-items:start">
<div><svg viewBox="0 0 320 130" style="width:100%;height:auto" aria-label="A polar water molecule and a nonpolar hexane molecule">
<g transform="translate(70 66)"><line x1="0" y1="0" x2="-26" y2="22" stroke="var(--anatomy-mid)" stroke-width="3"/><line x1="0" y1="0" x2="26" y2="22" stroke="var(--anatomy-mid)" stroke-width="3"/><circle r="20" fill="var(--a-o)"/><circle cx="-26" cy="22" r="11" fill="var(--a-h)" stroke="var(--anatomy-mid)"/><circle cx="26" cy="22" r="11" fill="var(--a-h)" stroke="var(--anatomy-mid)"/>
<text y="-28" text-anchor="middle" font-size="13" fill="var(--anatomy-strong)">δ−</text><text x="-26" y="50" text-anchor="middle" font-size="13" fill="var(--anatomy-strong)">δ+</text><text x="26" y="50" text-anchor="middle" font-size="13" fill="var(--anatomy-strong)">δ+</text></g>
<text x="70" y="126" text-anchor="middle" font-size="11" fill="var(--anatomy-muted)" font-family="ui-monospace,monospace">WATER · POLAR</text>
<g transform="translate(180 60)" fill="var(--a-c)"><path d="M0 8 L18 -8 L36 8 L54 -8 L72 8 L90 -8" stroke="var(--a-c)" stroke-width="4" fill="none"/>${[0, 18, 36, 54, 72, 90].map((x, i) => `<circle cx="${x}" cy="${i % 2 ? -8 : 8}" r="8"/>`).join("")}</g>
<text x="225" y="126" text-anchor="middle" font-size="11" fill="var(--anatomy-muted)" font-family="ui-monospace,monospace">HEXANE · NONPOLAR</text></svg>
<p><b>Polar</b> molecules have a δ− side and a δ+ side, like a tiny magnet. They pull on ions and on other polar molecules. <b>Nonpolar</b> molecules have no charged sides. They mix with other nonpolar molecules.</p></div>
<table><thead><tr><th>Solute</th><th>Type</th><th>In water</th><th>In hexane</th></tr></thead><tbody>
<tr><td>Salt · NaCl</td><td>ionic</td><td class="y">dissolves</td><td class="n">no</td></tr>
<tr><td>Sugar</td><td>polar</td><td class="y">dissolves</td><td class="n">no</td></tr>
<tr><td>Cooking oil</td><td>nonpolar</td><td class="n">no · floats</td><td class="y">mixes</td></tr>
<tr><td>Iodine · I₂</td><td>nonpolar</td><td class="n">tiny · brown</td><td class="y">dissolves · purple</td></tr>
</tbody></table></div>`;
TABS.forEach(([name, sub, tiles], i) => {
  const b = document.createElement("button"); b.setAttribute("role", "tab"); b.setAttribute("aria-selected", i === 0); b.textContent = name; q("#tabs").append(b);
  const p = document.createElement("div"); p.className = "panel" + (tiles ? " tiles" : "") + (i === 0 ? " on" : ""); p.setAttribute("role", "tabpanel");
  p.innerHTML = tiles ? tiles.map(([tag, h, t, art]) => `<div class="tile">${art}<span class="tag">${tag}</span><h4>${h}</h4><div>${t}</div></div>`).join("") : likeHTML;
  q("#panels").append(p);
  b.onclick = () => { qa("#tabs button").forEach((x, j) => x.setAttribute("aria-selected", j === i)); qa("#panels .panel").forEach((x, j) => x.classList.toggle("on", j === i)); };
});

// ---------- main loop ----------
let last = 0, lastSay = "", visible = true;
function tick(now) {
  const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016); last = now; ST.t += dt;
  ST.T += (ST.set - ST.T) * (1 - Math.exp(-dt / (still.matches ? 0.01 : 1.1))); if (Math.abs(ST.set - ST.T) < 0.05) ST.T = ST.set;
  const u = SU[ST.u], cap = solAt(ST.u, ST.v, ST.T);
  let target = Math.min(ST.A, cap);
  if (ST.noSeed && ST.D > target && ST.D >= ST.A - 1e-6) target = ST.D;
  const rate = 0.14 * (1 + ST.T / 40) * (1 + 1.5 * ST.stir) * (target < ST.D ? 2.5 : 1);
  ST.D += (target - ST.D) * (1 - Math.exp(-dt * rate * (still.matches ? 40 : 1))); if (Math.abs(target - ST.D) < u.step * 0.02) ST.D = target;
  const left = Math.max(0, ST.A - ST.D);
  const state = cap === Infinity ? "mixes" : cap === 0 || cap < 0.05 && u.kind === "iodine" ? "no" : ST.D > cap * 1.02 ? "supersaturated" : ST.A >= cap * 0.98 && ST.D >= cap * 0.98 ? "saturated" : "unsaturated";
  if (ST.noSeed && state === "supersaturated") q("#seed").disabled = false;
  q("#sCap").textContent = fmtG(cap); q("#sDis").textContent = fmtG(ST.D); q("#sLeft").textContent = fmtG(left);
  const col = { unsaturated: "ok", saturated: "warn", supersaturated: "bad", mixes: "ok", no: "bad" }[state];
  const words = { unsaturated: "Unsaturated — room for more", saturated: "Saturated — full", supersaturated: "Supersaturated — too full", mixes: "Mixes completely", no: "Does not dissolve" }[state];
  q("#state").style.color = CV[col]; q("#state span").textContent = words; q("#state span").style.color = "var(--anatomy-strong)"; q("#state i").style.background = CV[col];
  const ratio = cap === Infinity ? 0.5 : cap > 0 ? ST.D / cap : ST.A > 0 ? 1.5 : 0;
  q("#mFill").style.width = Math.min(100, (ratio / 1.5) * 100) + "%"; q("#mFill").style.background = CV[col];
  const say = explain(cap, state); if (say !== lastSay) { q("#say").innerHTML = say; lastSay = say; }
  const steps = qa("#steps div"), dissolving = ST.D < target - 1e-3 || ST.D > 0;
  steps.forEach((s, i) => s.classList.toggle("on", state !== "no" && (i === 0 || (i === 1 && ST.D > 0) || (i === 2 && ST.D > 0 && ST.v === "water"))));
  curveFrame(cap); benchFrame(dt, left); if (visible) simFrame(dt);
  requestAnimationFrame(tick);
}
new IntersectionObserver((e) => { visible = e[e.length - 1].isIntersecting; }).observe(cv);
resetSim(); sync(); drawAll(); requestAnimationFrame(tick);

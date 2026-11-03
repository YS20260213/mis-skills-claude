// Energy in the wetland — slide deck. node build.mjs → index.html
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../.claude/skills/anatomy/kit/iso-kit.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const W = 720, H = 560;

// ---------- terrarium plan (x, y floor, z up) ----------
const TANK = { x: -90, y: -55, w: 180, d: 110, r: 0 };
const GLASS_H = 120;
const L = { gravel: [0, 14], charcoal: [14, 4], soil: [18, 22] };   // [z, h]
const TOP = 40;                                                     // soil surface
const POND = { x: 38, y: 8, r: 26 };
const BASE = { x: -102, y: -67, w: 204, d: 134, r: 8 };

const P = k.fitProjection([...k.boxCorners(BASE, -14, 0), ...k.boxCorners(TANK, 0, GLASS_H + 70)], W, H, { pad: 22, azimuth: 40, elevation: 28 });
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const pt = (p) => at(p).map((v) => v.toFixed(1));
const poly = (pts) => "M" + pts.map((p) => pt(p).join(" ")).join("L") + "Z";
const lift = (dz) => { const a = at([0, 0, 0]), b = at([0, 0, dz]); return [b[0] - a[0], b[1] - a[1]]; };
const tones = (top, s0, s1, s2, s3, hi, mid = hi, lo = mid) => `--anatomy-paper:${s1};--anatomy-face:${s1};--anatomy-top:${top};--anatomy-shade-0:${s0};--anatomy-shade-1:${s1};--anatomy-shade-2:${s2};--anatomy-shade-3:${s3};--anatomy-hi:${hi};--anatomy-mid:${mid};--anatomy-lo:${lo};--anatomy-faint:${lo}`;
let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

// glass box: back faces, then contents, then front faces
const [x0, x1, y0, y1] = [TANK.x, TANK.x + TANK.w, TANK.y, TANK.y + TANK.d];
const backFaces = [
  [[x0, y0, 0], [x1, y0, 0], [x1, y0, GLASS_H], [x0, y0, GLASS_H]],
  [[x0, y0, 0], [x0, y1, 0], [x0, y1, GLASS_H], [x0, y0, GLASS_H]],
];
const frontFaces = [
  [[x0, y1, 0], [x1, y1, 0], [x1, y1, GLASS_H], [x0, y1, GLASS_H]],
  [[x1, y0, 0], [x1, y1, 0], [x1, y1, GLASS_H], [x1, y0, GLASS_H]],
];
const edge = (a, b) => `M${pt(a).join(" ")}L${pt(b).join(" ")}`;

function stand() {
  const out = [`<path class="iso-halo" d="${k.haloOf(BASE, -14, 14, P)}"/>`];
  for (const [x, y] of k.corners(BASE, 14)) out.push(S(k.cylinder(x, y, 6, -14, 4, P, 24), { tone: "mid" }));
  out.push(S(k.slabOf(BASE, -10, 10, P, 6, 1.2), { tone: "mid" }));
  out.push(k.lineSvg(k.planOutline(k.insetPlan(BASE, 5), 0, P), { tone: "lo" }));
  out.push(k.dotsSvg(k.corners(BASE, 9).map(([x, y]) => at([x, y, 0])), { size: 0.6 }));
  const plate = { x: BASE.x + 64, y: BASE.y + BASE.d - 10, w: 76, d: 7, r: 1 };
  out.push(S(k.slabOf(plate, 0, 0.8, P, 2), { tone: "lo", crease: "none" }));
  out.push(k.faceTextSvg(k.topMatrix([plate.x + 6, plate.y + 5], 0.8, P, "x"), "MINI WETLAND · TERRARIUM", { size: 3.4, tone: "mid" }));
  return `<g class="layer" data-step="1" style="${tones("#fff6e4", "#d9b98a", "#e6c99c", "#efd8b0", "#f6e6c8", "#7a5a32", "#a8845a", "#c9a77a")}">${out.join("")}</g>`;
}
function glassBack() {
  return `<g class="layer glass" data-step="1">${backFaces.map((f) => `<path class="glass-back" d="${poly(f)}"/>`).join("")}<path class="glass-floor" d="${poly([[x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0]])}"/>
  ${[edge([x0, y0, 0], [x0, y0, GLASS_H]), edge([x0, y0, GLASS_H], [x1, y0, GLASS_H]), edge([x0, y0, GLASS_H], [x0, y1, GLASS_H])].map((d) => `<path class="glass-edge far" d="${d}"/>`).join("")}</g>`;
}
function slabLayer(name, step, [z, h], look, texture) {
  const plan = k.insetPlan(TANK, 1.5);
  let tex = "";
  if (texture) {
    const pts = [];
    for (let i = 0; i < texture.n; i++) {
      const onFront = rnd() < 0.55, zz = z + 1 + rnd() * (h - 2);
      const p = onFront ? [plan.x + 3 + rnd() * (plan.w - 6), plan.y + plan.d, zz] : [plan.x + plan.w, plan.y + 3 + rnd() * (plan.d - 6), zz];
      const s = at(p), r = (texture.r[0] + rnd() * (texture.r[1] - texture.r[0])) * k.cameraOf(P).k;
      pts.push(`<ellipse cx="${s[0].toFixed(1)}" cy="${s[1].toFixed(1)}" rx="${r.toFixed(2)}" ry="${(r * 0.8).toFixed(2)}" fill="${texture.col[Math.floor(rnd() * texture.col.length)]}"/>`);
    }
    tex = `<g class="tex">${pts.join("")}</g>`;
  }
  return `<g class="layer drop" data-step="${step}" data-name="${name}" style="${look}">${S(k.slabOf(plan, z, h, P, 2), { tone: "hi", crease: "lo" })}${tex}</g>`;
}
function topScatter(step, n, z, col, r = [1.2, 2.6], avoid = POND) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const x = TANK.x + 6 + rnd() * (TANK.w - 12), y = TANK.y + 6 + rnd() * (TANK.d - 12);
    if (avoid && Math.hypot(x - avoid.x, y - avoid.y) < avoid.r + 4) continue;
    const s = at([x, y, z]), rr = (r[0] + rnd() * (r[1] - r[0])) * k.cameraOf(P).k;
    out.push(`<ellipse cx="${s[0].toFixed(1)}" cy="${s[1].toFixed(1)}" rx="${rr.toFixed(2)}" ry="${(rr * 0.5).toFixed(2)}" fill="${col[i % col.length]}"/>`);
  }
  return out.join("");
}
function pond() {
  const rim = k.cylinder(POND.x, POND.y, POND.r + 3, TOP - 3, 3.4, P, 64);
  const water = k.cylinder(POND.x, POND.y, POND.r, TOP - 2.2, 2.4, P, 64);
  const ripples = [0.4, 0.7].map((f, i) => `<path class="ripple r${i}" d="${k.ring(POND.x, POND.y, POND.r * f, TOP + 0.3, P, 48)}"/>`).join("");
  const stones = Array.from({ length: 11 }, (_, i) => { const a = (i / 11) * 6.283 + 0.3, s = at([POND.x + Math.cos(a) * (POND.r + 3), POND.y + Math.sin(a) * (POND.r + 3), TOP + 0.5]); const r = (2.2 + (i % 3)) * k.cameraOf(P).k;
    return `<ellipse cx="${s[0].toFixed(1)}" cy="${s[1].toFixed(1)}" rx="${r.toFixed(1)}" ry="${(r * 0.62).toFixed(1)}" fill="url(#gStone)" stroke="#6b6f78" stroke-width=".5"/>`; });
  // stones behind the pond first, in front after the water
  const behind = stones.filter((_, i) => Math.sin((i / 11) * 6.283 + 0.3) + Math.cos((i / 11) * 6.283 + 0.3) < 0), front = stones.filter((s) => !behind.includes(s));
  return `<g class="layer drop" data-step="5" style="${tones("#9aa3ad", "#6f7782", "#7f8893", "#8e97a2", "#a2abb5", "#4b525c", "#6b737d", "#8a929c")}">${behind.join("")}${S(rim, { tone: "hi" })}
  <path class="water-body" d="${water.fill}"/><path class="water-top" d="${water.top}"/>${ripples}${front.join("")}</g>`;
}
// plants and creatures placed by <use> at iso points; scale in screen px
const place = (step, href, [x, y, z], size, cls = "", extra = "") => { const s = at([x, y, z]); return `<g class="layer grow ${cls}" data-step="${step}" ${extra}><use href="#${href}" x="${(s[0] - size / 2).toFixed(1)}" y="${(s[1] - size).toFixed(1)}" width="${size}" height="${size}"/></g>`; };
function plants() {
  const items = [
    ["cattail", [-70, -40], 120], ["cattail", [-48, -46], 104], ["reeds", [-80, -12], 92], ["cattail", [62, -42], 112], ["fern", [-20, -36], 70],
    ["reeds", [10, -44], 84], ["fern", [-64, 30], 64], ["lily", [POND.x - 6, POND.y + 4], 34, TOP + 0.4], ["lily", [POND.x + 10, POND.y - 8], 26, TOP + 0.4], ["moss", [-30, 30], 44], ["moss", [-2, 34], 38], ["moss", [-52, 6], 40], ["reeds", [80, 34], 70],
  ];
  return items.map(([h, [x, y], size, z]) => ({ d: k.depthOf([x, y, 0], P), s: place(6, h, [x, y, z ?? TOP], size * 1.45, "sway") })).sort((a, b) => a.d - b.d).map((o) => o.s).join("");
}
function creatures() {
  return [
    place(7, "snail", [-36, 40, TOP], 34),
    place(7, "frog", [POND.x - 28, POND.y + 22, TOP], 60, "hop", 'data-hot="frog"'),
    place(7, "dragonfly", [-10, -6, TOP + 56], 80, "hover", 'data-hot="dragonfly"'),
    place(7, "beetle", [-58, 24, TOP], 24),
  ].join("");
}
function glassFront() {
  const edges = [edge([x0, y1, 0], [x0, y1, GLASS_H]), edge([x1, y1, 0], [x1, y1, GLASS_H]), edge([x1, y0, 0], [x1, y0, GLASS_H]),
    edge([x0, y1, GLASS_H], [x1, y1, GLASS_H]), edge([x1, y0, GLASS_H], [x1, y1, GLASS_H]), edge([x0, y1, 0], [x1, y1, 0]), edge([x1, y0, 0], [x1, y1, 0])];
  const shine = [[x0 + 18, y1, 20], [x0 + 30, y1, GLASS_H - 8]];
  const drops = Array.from({ length: 26 }, () => { const onFront = rnd() < 0.6, z = GLASS_H - 6 - rnd() * 40, p = onFront ? [x0 + 8 + rnd() * (TANK.w - 16), y1, z] : [x1, y0 + 8 + rnd() * (TANK.d - 16), z]; const s = at(p);
    return `<circle class="drop-c" cx="${s[0].toFixed(1)}" cy="${s[1].toFixed(1)}" r="${(0.7 + rnd() * 1.3).toFixed(2)}" style="animation-delay:${(rnd() * 6).toFixed(2)}s"/>`; }).join("");
  return `<g class="layer glass" data-step="1">${frontFaces.map((f) => `<path class="glass-front" d="${poly(f)}"/>`).join("")}<path class="glass-shine" d="${edge(...shine)}"/>
  ${edges.map((d) => `<path class="glass-edge" d="${d}"/>`).join("")}</g><g class="drops">${drops}</g>`;
}
function lid() {
  const plan = k.insetPlan(TANK, -2);
  const lamp = { x: -14, y: -14, w: 28, d: 28, r: 3 };
  return `<g class="layer drop" data-step="8" style="${tones("#e9f6ff", "#a9c9de", "#bcd7ea", "#cfe3f1", "#e1eef7", "#3a6a8c", "#6e9ab8", "#9dbdd4")}">
  ${S(k.slabOf(plan, GLASS_H, 3, P, 2, 0.6), { tone: "hi", crease: "lo" })}
  ${k.lineSvg(k.planOutline(k.insetPlan(plan, 8), GLASS_H + 3, P, 2), { tone: "lo" })}
  ${k.dotsSvg(k.corners(plan, 5).map(([x, y]) => at([x, y, GLASS_H + 3])), { size: 0.6 })}
  ${S(k.cylinder(0, 0, 3, GLASS_H + 3, 40, P, 16), { tone: "mid" })}
  <g style="${tones("#fff3c4", "#e0b84a", "#ecc65c", "#f4d473", "#f9e29a", "#7a5a12", "#b08a2a", "#d6b04a")}">${S(k.slabOf(lamp, GLASS_H + 43, 10, P, 4, 0.8), { tone: "hi" })}</g>
  <path class="lamp-glow" d="${poly([[-12, -12, GLASS_H + 43], [12, -12, GLASS_H + 43], [12, 12, GLASS_H + 43], [-12, 12, GLASS_H + 43]])}"/></g>`;
}
// energy overlays (step 9 "run")
function flows() {
  const lampC = at([0, 0, GLASS_H + 42]);
  const rays = [[-60, -30], [-20, -30], [60, -36], [-50, 20], [POND.x, POND.y]].map(([x, y], i) => { const e = at([x, y, TOP + 30]); return `<path class="ray" d="M${lampC[0].toFixed(1)} ${lampC[1].toFixed(1)}L${e[0].toFixed(1)} ${e[1].toFixed(1)}" style="animation-delay:${i * 0.3}s"/>`; }).join("");
  const route = [[-60, -36, TOP + 50], [-20, -10, TOP + 58], [POND.x - 28, POND.y + 22, TOP + 14]].map((p) => pt(p).join(" "));
  const heat = [[-80, 0], [0, -50], [70, -20], [40, 50]].map(([x, y], i) => { const s = at([x, y, GLASS_H + 8]); return `<path class="heat" d="M${s[0]} ${s[1]} q-5 -9 0 -18 q5 -9 0 -18" style="animation-delay:${i * 0.5}s"/>`; }).join("");
  const vapor = [0, 1, 2].map((i) => { const s = at([POND.x - 10 + i * 10, POND.y, TOP + 4]); return `<path class="vapor" d="M${s[0]} ${s[1]} q-4 -10 0 -20 q4 -10 0 -20" style="animation-delay:${i * 0.7}s"/>`; }).join("");
  return `<g class="run">${rays}<path id="eRoute" class="e-route" d="M${route[0]}Q${route[1]} ${route[2]}"/>
  ${[0, 1, 2].map((i) => `<circle class="e-dot" r="4"><animateMotion dur="3.6s" begin="${i * 1.2}s" repeatCount="indefinite" rotate="auto"><mpath href="#eRoute"/></animateMotion></circle>`).join("")}${heat}${vapor}</g>`;
}

const svg = k.figureSvg({
  width: W, height: H,
  label: "A glass terrarium built step by step: gravel, charcoal, soil, a small pond, wetland plants, small animals and a lid with a lamp.",
  body: [
    `<defs><radialGradient id="gStone" cx=".35" cy=".3"><stop offset="0" stop-color="#e7e9ee"/><stop offset="1" stop-color="#8b919c"/></radialGradient>
     <linearGradient id="gWater" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#7fd3ff"/><stop offset="1" stop-color="#2f8fd8"/></linearGradient></defs>`,
    stand(), glassBack(),
    slabLayer("gravel", 2, L.gravel, tones("#d8d2c8", "#a39a8c", "#b3ab9e", "#c3bcb1", "#d2ccc3", "#6d655a", "#8c8476", "#aaa295"), { n: 140, r: [0.9, 2.2], col: ["#8f877a", "#c9c1b3", "#a79f91", "#e2dbcf", "#7d7568"] }),
    slabLayer("charcoal", 3, L.charcoal, tones("#4a4a52", "#25252b", "#2e2e35", "#38383f", "#43434b", "#15151a", "#2a2a30", "#3a3a42"), { n: 40, r: [0.5, 1.1], col: ["#111", "#55555e"] }),
    slabLayer("soil", 4, L.soil, tones("#8a5a35", "#5a3618", "#69401f", "#784b27", "#86562f", "#3a220d", "#53321a", "#6a4224"), { n: 90, r: [0.4, 1.0], col: ["#3d2410", "#a87a50", "#2b1a0b"] }),
    `<g class="layer drop" data-step="4">${topScatter(4, 70, TOP, ["#6b4220", "#9a6a3c", "#4e2f14"], [0.6, 1.5])}</g>`,
    pond(),
    `<g class="layer grow" data-step="6">${topScatter(6, 46, TOP + 0.2, ["#4caf50", "#7cc84a", "#2e8b3e"], [1.6, 3.4])}</g>`,
    plants(), creatures(), flows(), glassFront(), lid(),
  ],
});

const page = readFileSync(join(HERE, "deck.html"), "utf8")
  .replace("/*ISO_CSS*/", k.ISO_CSS)
  .replace("<!--TERRARIUM-->", svg)
  .replace("/*LIFT*/", `const LIFT=${JSON.stringify(lift(150))};`);
writeFileSync(join(HERE, "index.html"), page);
console.log("wrote index.html", (page.length / 1024).toFixed(0) + " KB");

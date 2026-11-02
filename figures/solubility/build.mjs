// Solubility Lab — built with the anatomy kit.  node build.mjs  → index.html
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../.claude/skills/anatomy/kit/iso-kit.mjs";
import { kitScript } from "../../.claude/skills/anatomy/scripts/inline-kit.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const W = 760, H = 560;

// ---------- world plan (x, y on the bench, z up) ----------
const PLATE = { x: -150, y: -140, w: 300, d: 270, r: 10 };
const PLATE_H = 12, FOOT_H = 6;
const HP = { x: -56, y: -56, w: 112, d: 112, r: 9 }, HP_H = 26;          // hot plate body
const SHELF = { x: -56, y: 56, w: 112, d: 26, r: 4 }, SHELF_H = 14;     // control step in front
const DISC_R = 44, DISC_Z = HP_H, DISC_H = 3;
const BK = { x: 0, y: 0, r: 36, z: DISC_Z + DISC_H, h: 84 };           // beaker
const LIQ = 58;                                                         // liquid height (100 mL)
const ROD = [14, -104], ROD_TOP = 196;
const TH = [14, -16], TH_Z0 = BK.z + 6, TH_Z1 = 176;                    // thermometer
const ARM_Z = 150;
const JARS = [-96, -66, -36, -6, 24, 54].map((y) => [112, y]);          // solute jars
const JAR_R = 10.5, JAR_H = 26;
const BOTTLES = [[-104, 100], [-72, 100]];                              // solvent bottles

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [ROD[0], ROD[1], ROD_TOP + 6], [TH[0], TH[1], TH_Z1 + 8]],
  W, H, { pad: 26, azimuth: 45 },
);
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (pts, style) => k.dotsSvg(pts, style);
const depth = (x, y, z = 0) => k.depthOf([x, y, z], P);
const pt = (p) => at(p).map((v) => v.toFixed(1)).join(" ");

// ---------- parts ----------
function plate() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  for (const [x, y] of k.corners(PLATE, 24).sort((a, b) => depth(...a) - depth(...b))) {
    out.push(S(k.cylinder(x, y, 8, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 6, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 6), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 12);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.4, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.55 }));
  // ruler strip along the front-left edge (+y)
  const strip = { x: -128, y: PLATE.y + PLATE.d - 16, w: 150, d: 8, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const t = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.8, 0.6, [2, 3.8], P);
  out.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
  out.push(D([at([strip.x + 2, strip.y + 4, 0.6]), at([strip.x + strip.w - 2, strip.y + 4, 0.6])], { size: 0.45 }));
  // label plate front-right with three rule lines + engraved name
  const lab = { x: 64, y: 96, w: 62, d: 24, r: 2 };
  out.push(S(k.slabOf(lab, 0, 1.2, P, 3, 0.4), { tone: "mid" }));
  out.push(k.faceTextSvg(k.topMatrix([lab.x + 6, lab.y + 9], 1.2, P, "x"), "SOLUBILITY · 01", { size: 4, tone: "mid" }));
  [14, 18].forEach((dy) => out.push(L(k.lineOnTop([lab.x + 6, lab.y + dy], [lab.x + lab.w - 6, lab.y + dy], 1.2, P), { tone: "lo", free: true })));
  out.push(D(k.corners(lab, 2.5).map(([x, y]) => at([x, y, 1.2])), { size: 0.4 }));
  return out.join("");
}

function stand() {
  const out = [];
  const base = { x: ROD[0] - 26, y: ROD[1] - 22, w: 52, d: 34, r: 4 };
  out.push(S(k.slabOf(base, 0, 7, P, 4, 0.8), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(base, 4), 7, P, 3), { tone: "faint" }));
  out.push(D(k.corners(base, 5).map(([x, y]) => at([x, y, 7])), { size: 0.45 }));
  out.push(S(k.cylinder(ROD[0], ROD[1], 5.5, 7, 4, P, 24), { tone: "mid" }));
  out.push(S(k.cylinder(ROD[0], ROD[1], 3.4, 11, ROD_TOP - 11, P, 24), { tone: "mid", crease: "none" }));
  out.push(S(k.cylinder(ROD[0], ROD[1], 4, ROD_TOP, 2, P, 24), { tone: "mid" }));
  return out.join("");
}

function hotplate() {
  const out = [`<path class="iso-halo" d="${k.haloOf(k.insetPlan({ ...HP, d: HP.d + SHELF.d }, -2), 0, 1, P)}" style="filter:blur(6px)"/>`];
  out.push(S(k.slabOf(HP, 0, HP_H, P, 6, 1.2), { tone: "mid" }));
  out.push(L(k.sideSeam(HP, 6, P, 6), { tone: "lo" }));
  // vents on the right face (+x): short closed slots
  for (let i = 0; i < 7; i++) {
    const y = -40 + i * 10;
    out.push(L(k.segment([HP.x + HP.w, y, 12], [HP.x + HP.w, y + 6, 12], P) + k.segment([HP.x + HP.w, y, 18], [HP.x + HP.w, y + 6, 18], P) + k.segment([HP.x + HP.w, y, 12], [HP.x + HP.w, y, 18], P) + k.segment([HP.x + HP.w, y + 6, 12], [HP.x + HP.w, y + 6, 18], P), { tone: "lo" }));
  }
  out.push(D(k.corners(HP, 7).map(([x, y]) => at([x, y, HP_H])), { size: 0.5 }));
  out.push(S(k.slabOf(SHELF, 0, SHELF_H, P, 3, 0.8), { tone: "mid" }));
  // LCD window on the shelf top
  const lcd = { x: 12, y: 60, w: 36, d: 16, r: 1.5 };
  out.push(S(k.slabOf(lcd, SHELF_H, 0.5, P, 2), { tone: "lo", crease: "none" }));
  out.push(`<g data-part="lcd" transform="${k.topMatrix([lcd.x + 3, lcd.y + 11.5], SHELF_H + 0.6, P, "x")}"><text class="lcd" font-size="9" font-family="ui-monospace,monospace">20°C</text></g>`);
  // ceramic top disc + heating coil rings (glow live)
  out.push(S(k.cylinder(0, 0, DISC_R, DISC_Z, DISC_H, P, 72, 0.6), { tone: "hi", crease: "lo" }));
  out.push(`<g data-part="coils" class="coils" opacity="0">${[16, 25, 34].map((r) => `<path d="${k.ring(0, 0, r, DISC_Z + DISC_H, P, 64)}"/>`).join("")}</g>`);
  out.push(L(k.ring(0, 0, DISC_R - 3, DISC_Z + DISC_H, P, 72), { tone: "faint" }));
  return out.join("");
}

function knob(x, y, part) {
  const out = [];
  out.push(S(k.cylinder(x, y, 7.5, SHELF_H, 2, P, 32), { tone: "mid" }));
  out.push(S(k.cylinder(x, y, 6, SHELF_H + 2, 6, P, 32), { tone: "mid" }));
  out.push(L(k.knurl(x, y, 6, SHELF_H + 2, SHELF_H + 8, 30, P), { tone: "lo" }));
  out.push(L(k.ring(x, y, 9.5, SHELF_H, P, 32), { tone: "faint" }));
  const ticks = k.radialTicks(x, y, 9.5, 11, 5, SHELF_H, [1, 2], P, -2.2, 4.4);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(`<path data-part="${part}" class="iso-line" data-tone="lit" data-free="end" d="${k.lineOnTop([x, y], [x, y - 5.5], SHELF_H + 8, P)}" style="stroke-width:1.2"/>`);
  return out.join("");
}

// glass beaker in layers: back wall, contents (live), front glass
const glassBody = k.cylinder(BK.x, BK.y, BK.r, BK.z, BK.h, P, 72);
const liquid = k.cylinder(BK.x, BK.y, BK.r - 1.2, BK.z + 1, LIQ, P, 72);
function beakerBack() {
  return `<path class="glass-back" d="${glassBody.fill}"/>` +
    `<path class="glass-floor" d="${k.cylinder(BK.x, BK.y, BK.r - 1, BK.z, 1, P, 72).top}"/>`;
}
function beakerFront() {
  const out = [];
  out.push(`<path class="glass-front" d="${glassBody.fill}"/>`);
  // graduations on the front-left of the glass (facing the viewer)
  const marks = [[20, "25"], [32, "50"], [44, "75"], [LIQ + 1, "100 mL"]];
  for (const [z, t] of marks) {
    const a0 = Math.PI * 0.62, a1 = Math.PI * (t === "100 mL" ? 0.74 : 0.69);
    const p0 = [BK.r * Math.cos(a0), BK.r * Math.sin(a0), BK.z + z], p1 = [BK.r * Math.cos(a1), BK.r * Math.sin(a1), BK.z + z];
    out.push(`<path class="grad" d="${k.segment(p0, p1, P)}"/>`);
  }
  for (let z = 8; z < LIQ; z += 4) {
    const a = Math.PI * 0.62, b = Math.PI * 0.65;
    out.push(`<path class="grad minor" d="${k.segment([BK.r * Math.cos(a), BK.r * Math.sin(a), BK.z + z], [BK.r * Math.cos(b), BK.r * Math.sin(b), BK.z + z], P)}"/>`);
  }
  out.push(k.faceTextSvg(k.sideMatrix([-12, BK.r - 4], BK.z + LIQ + 4, P, "left"), "100 mL", { size: 4, tone: "mid" }));
  out.push(`<path class="glass-edge" d="${glassBody.outline}"/>`);
  out.push(`<path class="glass-edge" d="${k.ring(BK.x, BK.y, BK.r, BK.z + BK.h, P, 72)}"/>`);
  out.push(`<path class="glass-edge thin" d="${k.ring(BK.x, BK.y, BK.r - 1.4, BK.z + BK.h, P, 72)}"/>`);
  // highlight streak
  const h0 = at([BK.r * Math.cos(1.9), BK.r * Math.sin(1.9), BK.z + 10]), h1 = at([BK.r * Math.cos(1.9), BK.r * Math.sin(1.9), BK.z + BK.h - 10]);
  out.push(`<path class="glass-shine" d="M${h0[0]} ${h0[1]}L${h1[0]} ${h1[1]}"/>`);
  // spout
  const s0 = at([-BK.r * 0.72, -BK.r * 0.72, BK.z + BK.h]), s1 = at([-BK.r * 0.86, -BK.r * 0.86, BK.z + BK.h + 3]);
  out.push(`<path class="glass-edge" d="M${s0[0]} ${s0[1]}L${s1[0]} ${s1[1]}"/>`);
  return out.join("");
}

function thermometer(lowZ, highZ) {
  const out = [];
  out.push(S(k.cylinder(TH[0], TH[1], 2.6, lowZ, highZ - lowZ, P, 20), { tone: "hi", crease: "none" }));
  return out.join("");
}

function clampArm() {
  const out = [];
  const boss = { x: ROD[0] - 7, y: ROD[1] - 7, w: 14, d: 14, r: 2.5 };
  out.push(S(k.slabOf(boss, ARM_Z - 6, 14, P, 4, 0.6), { tone: "mid" }));
  out.push(S(k.cylinder(ROD[0] - 10, ROD[1], 3, ARM_Z - 2, 6, P, 18), { tone: "mid" }));
  out.push(L(k.knurl(ROD[0] - 10, ROD[1], 3, ARM_Z - 2, ARM_Z + 4, 16, P), { tone: "lo" }));
  const arm = { x: TH[0] - 3, y: ROD[1] + 7, w: 6, d: TH[1] - ROD[1] - 7 + 3, r: 2 };
  out.push(S(k.slabOf(arm, ARM_Z, 4, P, 3, 0.5), { tone: "mid" }));
  out.push(S(k.cylinder(TH[0], TH[1], 5, ARM_Z - 2, 8, P, 24), { tone: "mid" }));
  out.push(D([at([TH[0], arm.y + 8, ARM_Z + 4]), at([TH[0], arm.y + arm.d - 14, ARM_Z + 4])], { size: 0.45 }));
  return out.join("");
}

function jar(x, y, i) {
  const out = [`<g data-jar="${i}" class="pick" tabindex="-1">`];
  out.push(`<path class="iso-halo" d="${k.haloOf({ x: x - JAR_R, y: y - JAR_R, w: JAR_R * 2, d: JAR_R * 2, r: JAR_R }, 4, 1, P)}" style="filter:blur(3px)"/>`);
  out.push(`<g data-lift>`);
  out.push(S(k.cylinder(x, y, JAR_R, 4, JAR_H, P, 40), { tone: "hi", crease: "lo" }));
  out.push(`<path class="jar-fill" data-fill="${i}" d="${k.cylinder(x, y, JAR_R - 0.6, 5, JAR_H * 0.55, P, 40).fill}"/>`);
  out.push(L(k.sideArc(x, y, JAR_R, 4 + JAR_H * 0.3, P, 24) + k.sideArc(x, y, JAR_R, 4 + JAR_H * 0.75, P, 24), { tone: "lo" }));
  out.push(S(k.cylinder(x, y, JAR_R + 0.6, 4 + JAR_H, 5, P, 40, 0.4), { tone: "mid" }));
  out.push(L(k.knurl(x, y, JAR_R + 0.6, 4 + JAR_H, 4 + JAR_H + 5, 40, P), { tone: "lo" }));
  out.push(`</g></g>`);
  return out.join("");
}

function bottle(x, y, i) {
  const out = [`<g data-bottle="${i}" class="pick">`];
  out.push(`<path class="iso-halo" d="${k.haloOf({ x: x - 13, y: y - 13, w: 26, d: 26, r: 13 }, 0, 1, P)}" style="filter:blur(3px)"/>`);
  out.push(`<g data-lift>`);
  out.push(S(k.cylinder(x, y, 13, 0, 40, P, 48), { tone: "hi", crease: "lo" }));
  out.push(L(k.sideArc(x, y, 13, 12, P, 32) + k.sideArc(x, y, 13, 28, P, 32), { tone: "lo" }));
  out.push(S(k.cylinder(x, y, 9, 40, 4, P, 36), { tone: "hi", crease: "lo" }));
  out.push(S(k.cylinder(x, y, 5, 44, 8, P, 24), { tone: "hi", crease: "lo" }));
  out.push(S(k.cylinder(x, y, 6.2, 52, 7, P, 24, 0.4), { tone: "mid" }));
  out.push(L(k.knurl(x, y, 6.2, 52, 59, 22, P), { tone: "lo" }));
  out.push(k.faceTextSvg(k.sideMatrix([x - 7, y + 13], 22, P, "left"), i === 0 ? "H₂O" : "C₆H₁₄", { size: 4, tone: "mid" }));
  out.push(`</g></g>`);
  return out.join("");
}

function tray(plan) {
  return S(k.slabOf(plan, 0, 4, P, 4, 0.6), { tone: "mid" }) + L(k.planOutline(k.insetPlan(plan, 3), 4, P, 3), { tone: "faint" }) +
    D(k.corners(plan, 3.5).map(([x, y]) => at([x, y, 4])), { size: 0.4 });
}

// ---------- assemble in painter's order ----------
const fixed = [plate(), stand()];
const jarTray = { x: 98, y: -112, w: 28, d: 180, r: 4 };
const botTray = { x: -122, y: 84, w: 68, d: 32, r: 4 };
const body = [
  ...fixed,
  tray(jarTray),
  ...JARS.map(([x, y], i) => ({ d: depth(x, y), s: jar(x, y, i) })).sort((a, b) => a.d - b.d).map((o) => o.s),
  hotplate(),
  knob(-34, 69, "knob-heat"),
  knob(-8, 69, "knob-stir"),
  `<path class="led" data-part="led" d=""/>`,
  beakerBack(),
  `<g data-part="crystals"></g>`,
  `<path data-part="stirbar" class="stirbar" d=""/>`,
  `<path data-part="liquid" class="liquid" d="${liquid.fill}"/>`,
  `<path data-part="oil" class="oil" d=""/>`,
  `<path data-part="surface" class="surface" d="${liquid.top}"/>`,
  thermometer(TH_Z0, BK.z + BK.h),
  `<path data-part="mercury" class="mercury" d=""/>`,
  `<circle data-part="bulb" class="mercury-bulb" cx="${at([TH[0], TH[1], TH_Z0 + 2])[0]}" cy="${at([TH[0], TH[1], TH_Z0 + 2])[1]}" r="${(3.2 * k.cameraOf(P).k).toFixed(2)}"/>`,
  `<g data-part="bubbles"></g>`,
  beakerFront(),
  thermometer(BK.z + BK.h, TH_Z1),
  `<path data-part="mercury-top" class="mercury" d=""/>`,
  clampArm(),
  `<g data-part="steam" class="steam"></g>`,
  tray(botTray),
  ...BOTTLES.map(([x, y], i) => ({ d: depth(x, y), s: bottle(x, y, i) })).sort((a, b) => a.d - b.d).map((o) => o.s),
];

const svg = k.figureSvg({
  width: W, height: H,
  label: "A lab bench for solubility: a hot plate and stirrer under a glass beaker, a thermometer held by a clamp stand, a tray of six solute jars and two solvent bottles.",
  body,
});

const GEO = { P, BK, LIQ, TH, TH_Z0, TH_Z1, JARS, JAR_R, BOTTLES, SHELF_H, KS: k.cameraOf(P).k };
const live = `const GEO=${JSON.stringify(GEO)};\n` + readFileSync(join(HERE, "live.js"), "utf8");
const page = readFileSync(join(HERE, "page.html"), "utf8")
  .replace("/*ISO_CSS*/", k.ISO_CSS)
  .replace("<!--BENCH-->", svg)
  .replace("/*SCRIPT*/", (kitScript() + "\n" + live).replace(/<\/(script)/gi, "<\\/$1"));
writeFileSync(join(HERE, "index.html"), page);
console.log("wrote index.html", (page.length / 1024).toFixed(0) + " KB");

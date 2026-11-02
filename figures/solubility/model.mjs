// Solubility model: every number the figure shows comes from here.
// Values are grams of solute that dissolve in 100 g of solvent, at 1 atm,
// tabulated every 10 °C from 0 °C. Sources: CRC Handbook / standard school tables
// (NaCl, KNO3, KCl, sucrose, CO2); iodine and cerium sulfate are rounded ("about").

export const TEMPS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

export const SOLVENTS = {
  water: { name: "Water", formula: "H₂O", polar: true, boils: 100, max: 100 },
  hexane: { name: "Hexane", formula: "C₆H₁₄", polar: false, boils: 69, max: 65 },
};

// kind: "ionic" (crystal of ions), "polar" (crystal of polar molecules),
// "nonpolar-solid", "nonpolar-liquid", "gas".
export const SOLUTES = {
  salt: {
    name: "Table salt", formula: "NaCl", kind: "ionic", polar: true, max: 60, step: 1, start: 20,
    curve: { water: [35.7, 35.8, 35.9, 36.1, 36.4, 37.0, 37.3, 37.8, 38.4, 39.0, 39.8], hexane: 0 },
  },
  kno3: {
    name: "Potassium nitrate", formula: "KNO₃", kind: "ionic", polar: true, max: 250, step: 5, start: 60,
    curve: { water: [13.3, 20.9, 31.6, 45.8, 63.9, 85.5, 110, 138, 169, 202, 246], hexane: 0 },
  },
  sugar: {
    name: "Sugar", formula: "C₁₂H₂₂O₁₁", kind: "polar", polar: true, max: 500, step: 10, start: 150,
    curve: { water: [179, 190, 204, 219, 238, 260, 287, 320, 362, 415, 487], hexane: 0 },
  },
  oil: {
    name: "Cooking oil", formula: "fat", kind: "nonpolar-liquid", polar: false, max: 40, step: 1, start: 15,
    curve: { water: 0, hexane: Infinity },
  },
  iodine: {
    name: "Iodine", formula: "I₂", kind: "nonpolar-solid", polar: false, max: 6, step: 0.1, start: 2,
    curve: {
      water: [0.014, 0.020, 0.029, 0.039, 0.052, 0.078, 0.10, 0.13, 0.17, 0.22, 0.28],
      hexane: [0.62, 0.86, 1.13, 1.48, 1.95, 2.55, 3.30, 3.30, 3.30, 3.30, 3.30],
    },
  },
  co2: {
    name: "Carbon dioxide", formula: "CO₂", kind: "gas", polar: false, max: 0.4, step: 0.01, start: 0.2,
    curve: { water: [0.335, 0.232, 0.169, 0.126, 0.097, 0.076, 0.058, 0.045, 0.035, 0.024, 0.012], hexane: null },
  },
};

// Grams that can dissolve in 100 g of solvent at temperature t (°C).
export function solubility(solute, solvent, t) {
  const table = SOLUTES[solute].curve[solvent];
  if (table === null || table === undefined) return null;
  if (typeof table === "number") return table;
  const at = Math.max(0, Math.min(100, t)) / 10;
  const i = Math.min(9, Math.floor(at));
  const f = at - i;
  return table[i] + (table[i + 1] - table[i]) * f;
}

// Does "like dissolve like" say yes?
export function alike(solute, solvent) {
  return SOLUTES[solute].polar === SOLVENTS[solvent].polar;
}

// How full a solution is: amount dissolved against how much can dissolve.
export function stateOf(dissolved, capacity) {
  if (capacity === Infinity) return "mixes completely";
  if (capacity <= 0) return "does not dissolve";
  const r = dissolved / capacity;
  if (r > 1.02) return "supersaturated";
  if (r > 0.98) return "saturated";
  return "unsaturated";
}

// Speed of dissolving (fraction of the gap closed per second): heat and stirring
// make it faster, but they never change how much CAN dissolve (except heat, via the curve).
export function rateOf(t, stir) {
  return 0.18 * (1 + t / 40) * (1 + 1.6 * stir);
}

// Extra solubility table for the classic chart on the page (g / 100 g water).
export const CHART = {
  kno3: { label: "KNO₃", values: SOLUTES.kno3.curve.water },
  kcl: { label: "KCl", values: [28.0, 31.2, 34.2, 37.2, 40.1, 42.6, 45.8, 48.8, 51.3, 53.9, 56.3] },
  nacl: { label: "NaCl", values: SOLUTES.salt.curve.water },
  ce: { label: "Ce₂(SO₄)₃", values: [21.4, 14.5, 9.8, 7.2, 5.6, 4.6, 3.9, 3.2, 2.6, 2.2, 1.8] },
};

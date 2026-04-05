/**
 * Linear journey from Earth's core to the Sun. No wrapping.
 * 
 * norm 0.00 → Core center (-6,371 km from surface)
 * norm 0.50 → Sea Level (0 km)
 * norm 1.00 → The Sun (+149,600,000 km)
 *
 * Piecewise segments give generous space to interesting zones.
 */

const SEGS = [
  // Underground (norm 0.00 → 0.50)
  [0.00, 0.04, -6371, -5150],     // inner core
  [0.04, 0.10, -5150, -2891],     // outer core
  [0.10, 0.20, -2891, -35],       // mantle
  [0.20, 0.25, -35,   -10.935],   // hadal zone / mariana
  [0.25, 0.32, -10.935, -3.784],  // abyssal / titanic
  [0.32, 0.42, -3.784, -0.2],     // twilight zone
  [0.42, 0.50, -0.2,   0],        // sunlight zone → surface
  // Above surface (norm 0.50 → 1.00)
  [0.50, 0.53, 0,      8.849],    // troposphere / everest
  [0.53, 0.56, 8.849,  12],       // jets
  [0.56, 0.60, 12,     39],       // stratosphere
  [0.60, 0.64, 39,     100],      // kármán line
  [0.64, 0.68, 100,    408],      // ISS
  [0.68, 0.72, 408,    35786],    // geostationary
  [0.72, 0.78, 35786,  384400],   // moon
  [0.78, 0.84, 384400, 41400000], // venus closest approach (~41.4M km)
  [0.84, 0.92, 41400000, 91700000], // mercury closest (~91.7M km)
  [0.92, 1.00, 91700000, 149600000], // sun
];

function lerp(a, b, t) { return a + (b - a) * t; }

export function normToAltKm(norm) {
  const n = Math.max(0, Math.min(1, norm));
  for (const [ns, ne, as, ae] of SEGS) {
    if (n >= ns && n <= ne) return lerp(as, ae, (n - ns) / (ne - ns));
  }
  return n >= 1 ? 149600000 : -6371;
}

export function altKmToNorm(km) {
  for (const [ns, ne, as, ae] of SEGS) {
    const lo = Math.min(as, ae), hi = Math.max(as, ae);
    if (km >= lo && km <= hi) return ns + ((km - as) / (ae - as)) * (ne - ns);
  }
  return km >= 149600000 ? 1.0 : 0.0;
}

export function kmToY(km) { return altKmToNorm(km) * 5000; }

/** Ordered list of landmark norms for jump navigation */
export const LANDMARKS = [
  { norm: 0.02, label: 'Inner Core' },
  { norm: 0.07, label: 'Outer Core' },
  { norm: 0.15, label: 'Mantle' },
  { norm: 0.22, label: 'Mariana Trench' },
  { norm: 0.28, label: 'Titanic' },
  { norm: 0.37, label: 'Twilight Zone' },
  { norm: 0.46, label: 'Sunlight Zone' },
  { norm: 0.50, label: 'Sea Level' },
  { norm: 0.52, label: 'Mt. Everest' },
  { norm: 0.55, label: 'Commercial Jets' },
  { norm: 0.58, label: 'Stratosphere' },
  { norm: 0.62, label: 'Kármán Line' },
  { norm: 0.66, label: 'ISS' },
  { norm: 0.70, label: 'Geostationary' },
  { norm: 0.75, label: 'Moon' },
  { norm: 0.81, label: 'Venus' },
  { norm: 0.88, label: 'Mercury' },
  { norm: 0.96, label: 'Sun' },
];

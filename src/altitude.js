/**
 * Symmetric world: drilling through Earth from space to space.
 * 
 * norm (Y/H) layout — symmetric around 0.5 (core):
 * 
 *   1.00 → Deep Space (top)        +1000 km
 *   0.92 → ISS                     +408 km
 *   0.85 → Kármán Line             +100 km
 *   0.78 → Stratosphere            +39 km
 *   0.73 → Commercial jets         +12 km
 *   0.70 → Everest                 +8.849 km
 *   0.68 → Sea Level (top)         0 km
 *   0.64 → Titanic depth           −3.784 km
 *   0.60 → Mariana Trench          −10.935 km
 *   0.56 → Crust                   −35 km
 *   0.53 → Upper Mantle            −2891 km
 *   0.50 → CORE                    −6371 km
 *   --- mirror below ---
 *   0.47 → Upper Mantle (bottom)
 *   0.44 → Crust (bottom)
 *   0.40 → Mariana Trench (bottom)
 *   0.36 → Titanic depth (bottom)
 *   0.32 → Sea Level (bottom)
 *   0.30 → Everest (bottom)
 *   0.27 → Jets (bottom)
 *   0.22 → Stratosphere (bottom)
 *   0.15 → Kármán Line (bottom)
 *   0.08 → ISS (bottom)
 *   0.00 → Deep Space (bottom) — wraps to 1.00
 *
 * Top half (norm 0.50 → 1.00): core to space
 * Bottom half (norm 0.50 → 0.00): core to space (mirrored)
 */

// Top half segments: norm 0.50→1.00 maps to -6371→+1000 km
const TOP_SEGS = [
  [0.50, 0.53, -6371, -2891],
  [0.53, 0.56, -2891, -35],
  [0.56, 0.60, -35,   -10.935],
  [0.60, 0.64, -10.935, -3.784],
  [0.64, 0.68, -3.784, 0],
  [0.68, 0.70, 0,     8.849],
  [0.70, 0.73, 8.849, 12],
  [0.73, 0.78, 12,    39],
  [0.78, 0.85, 39,    100],
  [0.85, 0.92, 100,   408],
  [0.92, 1.00, 408,   1000],
];

function lerp(a, b, t) { return a + (b - a) * t; }

/**
 * Convert norm (0-1) to real altitude in km.
 * Top half (0.5-1.0): going up from core to space
 * Bottom half (0.0-0.5): mirror of top half (other side of Earth)
 */
export function normToAltKm(norm) {
  const n = Math.max(0, Math.min(1, norm));
  // Use top half for both sides (symmetric)
  const topN = n >= 0.5 ? n : 1.0 - n; // mirror bottom half
  for (const [ns, ne, as, ae] of TOP_SEGS) {
    if (topN >= ns && topN <= ne) {
      const t = (topN - ns) / (ne - ns);
      return lerp(as, ae, t);
    }
  }
  return topN >= 1 ? 1000 : -6371;
}

/**
 * Convert real altitude in km to norm (0-1).
 * Returns the TOP half norm (0.5-1.0). 
 * For bottom half, caller mirrors: bottomNorm = 1.0 - topNorm
 */
export function altKmToNorm(km) {
  for (const [ns, ne, as, ae] of TOP_SEGS) {
    const lo = Math.min(as, ae), hi = Math.max(as, ae);
    if (km >= lo && km <= hi) {
      const t = (km - as) / (ae - as);
      return ns + t * (ne - ns);
    }
  }
  return km >= 1000 ? 1.0 : 0.5;
}

/** Convert km to Y position (top hemisphere) */
export function kmToY(km) { return altKmToNorm(km) * 5000; }

/** Convert km to Y position (bottom hemisphere, mirrored) */
export function kmToYBottom(km) { return (1.0 - altKmToNorm(km)) * 5000; }

/**
 * Piecewise-linear altitude mapping.
 * Gives generous space to ocean and near-surface zones.
 *
 * norm → real altitude (km):
 *   0.00 → -6,371  (inner core center)
 *   0.10 → -5,150  (outer/inner core boundary)
 *   0.18 → -2,891  (mantle/outer core boundary)
 *   0.25 → -35     (crust base)
 *   0.30 → -11     (mariana trench)
 *   0.35 → -3.8    (titanic depth)
 *   0.42 → -0.2    (light penetration limit)
 *   0.50 → 0       (sea level)
 *   0.55 → 8.849   (everest)
 *   0.60 → 12      (commercial jets)
 *   0.70 → 39      (felix baumgartner)
 *   0.80 → 100     (karman line)
 *   0.90 → 408     (ISS)
 *   1.00 → 1,000   (deep space)
 */

const SEGMENTS = [
  // [normStart, normEnd, altStart, altEnd]
  [0.00, 0.10, -6371, -5150],
  [0.10, 0.18, -5150, -2891],
  [0.18, 0.25, -2891, -35],
  [0.25, 0.30, -35,   -11],
  [0.30, 0.35, -11,   -3.8],
  [0.35, 0.42, -3.8,  -0.2],
  [0.42, 0.50, -0.2,  0],
  [0.50, 0.55, 0,     8.849],
  [0.55, 0.60, 8.849, 12],
  [0.60, 0.70, 12,    39],
  [0.70, 0.80, 39,    100],
  [0.80, 0.90, 100,   408],
  [0.90, 1.00, 408,   1000],
];

export function normToAltKm(norm) {
  const n = Math.max(0, Math.min(1, norm));
  for (const [ns, ne, as, ae] of SEGMENTS) {
    if (n >= ns && n <= ne) {
      const t = (n - ns) / (ne - ns);
      return as + t * (ae - as);
    }
  }
  return n >= 1 ? 1000 : -6371;
}

export function altKmToNorm(km) {
  for (const [ns, ne, as, ae] of SEGMENTS) {
    if ((km >= as && km <= ae) || (km <= as && km >= ae)) {
      const t = (km - as) / (ae - as);
      return ns + t * (ne - ns);
    }
  }
  return km >= 1000 ? 1.0 : 0.0;
}

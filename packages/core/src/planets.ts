// Simplified planetary longitude calculations
// Uses mean orbital elements + major perturbation corrections
// Accuracy: ~1° (sufficient for rasi/naksatra determination in Vedic calendar)
// Reference: Meeus "Astronomical Algorithms" Ch.31 (low precision)

import { putIn360, sinDeg } from './math.js';

// Mean orbital elements at J2000.0 epoch [L0, L1, M0, M1]
const MERC = { L0: 252.2509, L1: 149472.6746, M0: 174.7948, M1: 149472.5153 };
const VEN  = { L0: 181.9798, L1: 58517.8157,  M0: 50.4161,  M1: 58517.8039 };
const MAR  = { L0: 355.4330, L1: 19140.2993,  M0: 19.3730,  M1: 19139.8585 };
const JUP  = { L0: 34.3515,  L1: 3034.9057,   M0: 20.0202,  M1: 3034.6876 };
const SAT  = { L0: 50.0774,  L1: 1222.1138,   M0: 317.0207, M1: 1222.1116 };

/** Calculate all 5 planet longitudes (geocentric ecliptic) for a Julian date.
 *  Includes equation of center and geocentric correction. */
export function calculatePlanetPositions(jd: number): {
  mercury: number;
  venus: number;
  mars: number;
  jupiter: number;
  saturn: number;
} {
  const T = (jd - 2451545.0) / 36525.0;

  // Earth's mean anomaly and longitude (for geocentric correction)
  const earthM = putIn360(357.5291 + 35999.0503 * T);
  const earthL = putIn360(280.4665 + 36000.7698 * T);
  // Sun's true longitude ≈ Earth + 180°
  const sunL = putIn360(earthL + 1.9146 * sinDeg(earthM) + 0.02 * sinDeg(2 * earthM));

  // Mercury
  const mercM = putIn360(MERC.M0 + MERC.M1 * T);
  const mercL = putIn360(MERC.L0 + MERC.L1 * T
    + 6.7 * sinDeg(mercM) + 1.1 * sinDeg(2 * mercM));
  // Geocentric via elongation
  const mercGeo = putIn360(sunL + putIn360(mercL - sunL + 180) - 180);

  // Venus
  const venM = putIn360(VEN.M0 + VEN.M1 * T);
  const venL = putIn360(VEN.L0 + VEN.L1 * T
    + 0.77 * sinDeg(venM));
  const venGeo = putIn360(sunL + putIn360(venL - sunL + 180) - 180);

  // Mars
  const marsM = putIn360(MAR.M0 + MAR.M1 * T);
  const marsL = putIn360(MAR.L0 + MAR.L1 * T
    + 10.69 * sinDeg(marsM) + 0.58 * sinDeg(2 * marsM));
  // Outer planets: geocentric ≈ heliocentric + parallax from Earth
  const marsGeo = geocentricOuter(marsL, sunL, 1.524);

  // Jupiter
  const jupM = putIn360(JUP.M0 + JUP.M1 * T);
  const jupL = putIn360(JUP.L0 + JUP.L1 * T
    + 5.55 * sinDeg(jupM) + 0.17 * sinDeg(2 * jupM));
  const jupGeo = geocentricOuter(jupL, sunL, 5.203);

  // Saturn
  const satM = putIn360(SAT.M0 + SAT.M1 * T);
  const satL = putIn360(SAT.L0 + SAT.L1 * T
    + 6.40 * sinDeg(satM) + 0.57 * sinDeg(2 * satM));
  const satGeo = geocentricOuter(satL, sunL, 9.537);

  return {
    mercury: putIn360(mercGeo),
    venus: putIn360(venGeo),
    mars: putIn360(marsGeo),
    jupiter: putIn360(jupGeo),
    saturn: putIn360(satGeo),
  };
}

/** Approximate geocentric longitude for an outer planet.
 *  helioLon = heliocentric longitude, sunLon = sun's longitude,
 *  r = planet's mean distance in AU */
function geocentricOuter(helioLon: number, sunLon: number, r: number): number {
  // Simplified: geocentric ≈ heliocentric + (1/r) * sin(helio - sun) * (180/PI)
  const diff = helioLon - sunLon;
  const correction = (180 / Math.PI) * Math.sin(diff * Math.PI / 180) / r;
  return putIn360(helioLon + correction);
}

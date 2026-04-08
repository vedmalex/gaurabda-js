// Planetary positions: Rahu (North Node) and Ketu (South Node)
// Plus wrapper for all graha longitudes at sunrise

import { putIn360 } from './math.js';
import { getAyanamsa } from './ayanamsha.js';
import { getRasiName } from './rasi.js';
import { getNaksatraName } from './strings.js';
import { intFloor } from './math.js';

/** Mean longitude of Rahu (ascending lunar node) for a Julian date.
 *  Meeus, Astronomical Algorithms, Ch. 47 */
export function getRahuLongitude(jd: number): number {
  const T = (jd - 2451545.0) / 36525.0;
  // Mean longitude of ascending node (Omega)
  const omega = 125.04452
    + (-1934.136261 + (0.0020708 + (1.0 / 450000) * T) * T) * T;
  return putIn360(omega);
}

/** Ketu = Rahu + 180° */
export function getKetuLongitude(jd: number): number {
  return putIn360(getRahuLongitude(jd) + 180.0);
}

/** Get rasi index (0-11) for a given tropical longitude and ayanamsa */
function getRasiIdx(longitude: number, ayanamsa: number): number {
  return intFloor(putIn360(longitude - ayanamsa) / 30.0);
}

/** Get naksatra index (0-26) for a given tropical longitude and ayanamsa */
function getNaksatraIdx(longitude: number, ayanamsa: number): number {
  return intFloor(putIn360(longitude - ayanamsa) * 3.0 / 40.0);
}

export interface GrahaPosition {
  name: string;
  nameSanskrit: string;
  longitude: number;
  rasi: string;
  naksatra: string;
  rasiIdx: number;
  naksatraIdx: number;
}

/** Calculate positions of all available grahas for a given Julian date */
export function getGrahaPositions(
  jd: number,
  sunLongitude: number,
  moonLongitude: number,
): GrahaPosition[] {
  const ayanamsa = getAyanamsa(jd);

  const grahas: { name: string; nameSanskrit: string; lon: number }[] = [
    { name: 'Sun', nameSanskrit: 'Surya', lon: sunLongitude },
    { name: 'Moon', nameSanskrit: 'Chandra', lon: moonLongitude },
    { name: 'Rahu', nameSanskrit: 'Rahu', lon: getRahuLongitude(jd) },
    { name: 'Ketu', nameSanskrit: 'Ketu', lon: getKetuLongitude(jd) },
  ];

  return grahas.map(g => ({
    name: g.name,
    nameSanskrit: g.nameSanskrit,
    longitude: g.lon,
    rasi: getRasiName(getRasiIdx(g.lon, ayanamsa)),
    naksatra: getNaksatraName(getNaksatraIdx(g.lon, ayanamsa)),
    rasiIdx: getRasiIdx(g.lon, ayanamsa),
    naksatraIdx: getNaksatraIdx(g.lon, ayanamsa),
  }));
}

// All 9 Vedic grahas: Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu

import { putIn360, intFloor } from './math.js';
import { getAyanamsa } from './ayanamsha.js';
import { getRasiName } from './rasi.js';
import { getNaksatraName } from './strings.js';
import { calculatePlanetPositions } from './planets.js';

/** Mean longitude of Rahu (ascending lunar node), Meeus Ch.47 */
export function getRahuLongitude(jd: number): number {
  const T = (jd - 2451545.0) / 36525.0;
  return putIn360(125.04452 + (-1934.136261 + (0.0020708 + (1.0 / 450000) * T) * T) * T);
}

/** Ketu = Rahu + 180° */
export function getKetuLongitude(jd: number): number {
  return putIn360(getRahuLongitude(jd) + 180.0);
}

function rasiIdx(lon: number, aya: number): number { return intFloor(putIn360(lon - aya) / 30.0); }
function naksIdx(lon: number, aya: number): number { return intFloor(putIn360(lon - aya) * 3.0 / 40.0); }

export interface GrahaPosition {
  name: string;
  nameSanskrit: string;
  longitude: number;
  rasi: string;
  naksatra: string;
  rasiIdx: number;
  naksatraIdx: number;
}

/** Calculate positions of all 9 Vedic grahas for a given Julian date */
export function getGrahaPositions(
  jd: number,
  sunLongitude: number,
  moonLongitude: number,
): GrahaPosition[] {
  const aya = getAyanamsa(jd);
  const planets = calculatePlanetPositions(jd);

  const list: { name: string; skt: string; lon: number }[] = [
    { name: 'Sun',     skt: 'Surya',    lon: sunLongitude },
    { name: 'Moon',    skt: 'Chandra',  lon: moonLongitude },
    { name: 'Mars',    skt: 'Mangala',  lon: planets.mars },
    { name: 'Mercury', skt: 'Budha',    lon: planets.mercury },
    { name: 'Jupiter', skt: 'Guru',     lon: planets.jupiter },
    { name: 'Venus',   skt: 'Shukra',   lon: planets.venus },
    { name: 'Saturn',  skt: 'Shani',    lon: planets.saturn },
    { name: 'Rahu',    skt: 'Rahu',     lon: getRahuLongitude(jd) },
    { name: 'Ketu',    skt: 'Ketu',     lon: getKetuLongitude(jd) },
  ];

  return list.map(g => ({
    name: g.name,
    nameSanskrit: g.skt,
    longitude: g.lon,
    rasi: getRasiName(rasiIdx(g.lon, aya)),
    naksatra: getNaksatraName(naksIdx(g.lon, aya)),
    rasiIdx: rasiIdx(g.lon, aya),
    naksatraIdx: naksIdx(g.lon, aya),
  }));
}

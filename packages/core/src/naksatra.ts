// Converted from js/GCNaksatra.js (176 lines)
// Name lookups moved to strings.ts; this module has calculation functions

import { putIn360, intFloor } from './math.js';
import { getAyanamsa } from './ayanamsha.js';
import { getMoonLongitude } from './core-astronomy.js';
import { GregorianDateTime } from './gregorian-date-time.js';
import type { EarthData } from './earth-data.js';

const PHI = 40.0 / 3.0; // 13.333° per naksatra (360/27)

/** Find next naksatra start (binary search, 20 iterations).
 *  Returns [naksatraIndex, date] */
export function getNextNaksatra(ed: EarthData, startDate: GregorianDateTime): [naksatraIndex: number, date: GregorianDateTime] {
  const d = startDate.clone();
  const xd = startDate.clone();
  const jday0 = startDate.getJulianComplete();
  const ayanamsa = getAyanamsa(jday0);
  let scanStep = 0.5;

  let longitudeMoon = getMoonLongitude(d, ed);
  let l1 = putIn360(longitudeMoon - ayanamsa);
  let prevNaks = intFloor(l1 / PHI);
  let newNaks = -1;

  let counter = 0;
  while (counter < 20) {
    xd.set(d);

    d.shour += scanStep;
    if (d.shour > 1.0) {
      d.shour -= 1.0;
      d.nextDay();
    }

    longitudeMoon = getMoonLongitude(d, ed);
    const l2 = putIn360(longitudeMoon - ayanamsa);
    newNaks = intFloor(l2 / PHI);

    if (prevNaks !== newNaks) {
      d.set(xd);
      scanStep *= 0.5;
      counter++;
    } else {
      l1 = l2;
    }
  }

  return [newNaks, d];
}

/** Find previous naksatra start (binary search, 20 iterations).
 *  Returns [naksatraIndex, date] */
export function getPrevNaksatra(ed: EarthData, startDate: GregorianDateTime): [naksatraIndex: number, date: GregorianDateTime] {
  const d = startDate.clone();
  const xd = startDate.clone();
  const jday0 = startDate.getJulianComplete();
  const ayanamsa = getAyanamsa(jday0);
  let scanStep = 0.5;

  let longitudeMoon = getMoonLongitude(d, ed);
  let l1 = putIn360(longitudeMoon - ayanamsa);
  let prevNaks = intFloor(l1 / PHI);
  let newNaks = -1;

  let counter = 0;
  while (counter < 20) {
    xd.set(d);

    d.shour -= scanStep;
    if (d.shour < 0.0) {
      d.shour += 1.0;
      d.previousDay();
    }

    longitudeMoon = getMoonLongitude(d, ed);
    const l2 = putIn360(longitudeMoon - ayanamsa);
    newNaks = intFloor(l2 / PHI);

    if (prevNaks !== newNaks) {
      d.set(xd);
      scanStep *= 0.5;
      counter++;
    } else {
      l1 = l2;
    }
  }

  return [newNaks, d];
}

// Converted from js/GCYoga.js (92 lines)
// FIX: Convert.ToInt32(Math.floor(...)) → intFloor()
// Name lookup moved to strings.ts; this module has calculation functions

import { putIn360, intFloor } from './math.js';
import { getAyanamsa } from './ayanamsha.js';
import { getSunLongitude, getMoonLongitude } from './core-astronomy.js';
import { GregorianDateTime } from './gregorian-date-time.js';
import type { EarthData } from './earth-data.js';

const PHI = 40.0 / 3.0; // 13.333° per yoga (360/27)

/** Find next yoga start (binary search, 20 iterations).
 *  Returns [yogaIndex, date] */
export function getNextYogaStart(ed: EarthData, startDate: GregorianDateTime): [yogaIndex: number, date: GregorianDateTime] {
  const d = startDate.clone();
  const xd = startDate.clone();
  const jday0 = startDate.getJulianComplete();
  const ayanamsha = getAyanamsa(jday0);
  let scanStep = 0.5;

  let longitudeMoon = getMoonLongitude(d, ed);
  let longitudeSun = getSunLongitude(d, ed);
  let l1 = putIn360(longitudeMoon + longitudeSun - 2 * ayanamsha);
  let prevTit = intFloor(l1 / PHI);
  let newTit = -1;

  let counter = 0;
  while (counter < 20) {
    xd.set(d);

    d.shour += scanStep;
    if (d.shour > 1.0) {
      d.shour -= 1.0;
      d.nextDay();
    }

    longitudeMoon = getMoonLongitude(d, ed);
    longitudeSun = getSunLongitude(d, ed);
    const l2 = putIn360(longitudeMoon + longitudeSun - 2 * ayanamsha);
    newTit = intFloor(l2 / PHI);

    if (prevTit !== newTit) {
      d.set(xd);
      scanStep *= 0.5;
      counter++;
    } else {
      l1 = l2;
    }
  }

  return [newTit, d];
}

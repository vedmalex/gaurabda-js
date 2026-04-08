// Converted from js/GCTithi.js (596 lines)
// Name lookup (GetName) already in strings.ts
// CalcTithiDate/CalcTithiEnd moved to astro-data.ts to avoid circular dependency

import { putIn360, intFloor } from './math.js';
import { getSunLongitude, getMoonLongitude } from './core-astronomy.js';
import { GregorianDateTime } from './gregorian-date-time.js';
import type { EarthData } from './earth-data.js';

const PHI = 12.0; // 360/30 degrees per tithi

/** Find next tithi start (binary search, 20 iterations).
 *  Returns [tithiIndex 0..29, date] */
export function getNextTithiStart(ed: EarthData, startDate: GregorianDateTime): [tithiIndex: number, date: GregorianDateTime] {
  const d = startDate.clone();
  const xd = startDate.clone();
  let scanStep = 0.5;

  let longitudeSun = getSunLongitude(d, ed);
  let longitudeMoon = getMoonLongitude(d, ed);
  let l1 = putIn360(longitudeMoon - longitudeSun - 180.0);
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

    longitudeSun = getSunLongitude(d, ed);
    longitudeMoon = getMoonLongitude(d, ed);
    const l2 = putIn360(longitudeMoon - longitudeSun - 180.0);
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

/** Find previous tithi start (binary search, 20 iterations).
 *  Returns [tithiIndex 0..29, date] */
export function getPrevTithiStart(ed: EarthData, startDate: GregorianDateTime): [tithiIndex: number, date: GregorianDateTime] {
  const d = startDate.clone();
  const xd = startDate.clone();
  let scanStep = 0.5;

  let longitudeMoon = getMoonLongitude(d, ed);
  let longitudeSun = getSunLongitude(d, ed);
  let l1 = putIn360(longitudeMoon - longitudeSun - 180.0);
  let prevTit = intFloor(l1 / PHI);
  let newTit = -1;

  let counter = 0;
  while (counter < 20) {
    xd.set(d);

    d.shour -= scanStep;
    if (d.shour < 0.0) {
      d.shour += 1.0;
      d.previousDay();
    }

    longitudeSun = getSunLongitude(d, ed);
    longitudeMoon = getMoonLongitude(d, ed);
    const l2 = putIn360(longitudeMoon - longitudeSun - 180.0);
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

/** Get tithi duration, start and end times relative to sunrise.
 *  Returns [duration, tithiBegin, tithiEnd] in day fractions */
export function getTithiTimes(ed: EarthData, vc: GregorianDateTime, sunRise: number): [duration: number, begin: number, end: number] {
  vc.shour = sunRise;
  const [, d1] = getPrevTithiStart(ed, vc);
  const [, d2] = getNextTithiStart(ed, vc);

  const titBeg = d1.shour + d1.getJulian() - vc.getJulian();
  const titEnd = d2.shour + d2.getJulian() - vc.getJulian();

  return [titEnd - titBeg, titBeg, titEnd];
}

// ── Tithi helper predicates ─────────────────────────────────────────

export function tithiIsEkadasi(a: number): boolean { return a === 10 || a === 25; }
export function tithiIsDvadasi(a: number): boolean { return a === 11 || a === 26; }
export function tithiIsTrayodasi(a: number): boolean { return a === 12 || a === 27; }
export function tithiIsCaturdasi(a: number): boolean { return a === 13 || a === 28; }
export function tithiIsFullNewMoon(a: number): boolean { return a === 14 || a === 29; }

export function tithiLessEkadasi(a: number): boolean { return a === 9 || a === 24 || a === 8 || a === 23; }
export function tithiLessDvadasi(a: number): boolean { return a === 10 || a === 25 || a === 9 || a === 24; }
export function tithiLessTrayodasi(a: number): boolean { return a === 11 || a === 26 || a === 10 || a === 25; }

export function prevPrevTithi(a: number): number { return (a + 28) % 30; }
export function prevTithi(a: number): number { return (a + 29) % 30; }
export function nextTithi(a: number): number { return (a + 1) % 30; }
export function nextNextTithi(a: number): number { return (a + 2) % 30; }

export function tithiLessThan(a: number, b: number): boolean {
  return a === prevTithi(b) || a === prevPrevTithi(b);
}

export function tithiGreaterThan(a: number, b: number): boolean {
  return a === nextTithi(b) || a === nextNextTithi(b);
}

/** TRUE when transit from A to B is between T and U */
export function tithiTransit(t: number, u: number, a: number, b: number): boolean {
  return (t === a && u === b)
    || (t === a && u === nextTithi(b))
    || (t === prevTithi(a) && u === b);
}

export function tithiDist(a: number, b: number): number {
  let r = a - b;
  while (r < -15) r += 30;
  return r;
}

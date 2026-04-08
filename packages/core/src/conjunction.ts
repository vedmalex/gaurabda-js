// Converted from js/GCConjunction.js (375 lines)
// FIX B7: Math.Abs → Math.abs

import { putIn360, putIn180, intFloor } from './math.js';
import { SunData } from './sun.js';
import { getMoonLongitude } from './core-astronomy.js';
import { GregorianDateTime } from './gregorian-date-time.js';
import type { EarthData } from './earth-data.js';

/** Test whether sun-moon conjunction occurs between two moments */
export function isConjunction(m1: number, s1: number, s2: number, m2: number): boolean {
  if (m2 < m1) m2 += 360.0;
  if (s2 < s1) s2 += 360.0;
  if (m1 <= s1 && s1 < s2 && s2 <= m2) return true;

  m1 = putIn180(m1);
  m2 = putIn180(m2);
  s1 = putIn180(s1);
  s2 = putIn180(s2);
  if (m1 <= s1 && s1 < s2 && s2 <= m2) return true;

  return false;
}

/** Find previous sun-moon conjunction (returns [sunLongitude, date]) */
export function getPrevConjunctionX(inDate: GregorianDateTime, earth: EarthData): [longitude: number, date: GregorianDateTime | null] {
  let bCont = 32;
  const date = inDate.clone();
  const d = date.clone();
  d.shour = 0.5;
  d.TimezoneHours = 0.0;

  let prevSun = SunData.getSunLongitude(d);
  let prevMoon = getMoonLongitude(d, earth);
  let prevDiff = putIn180(prevSun - prevMoon);

  do {
    d.previousDay();
    const nowMoon = getMoonLongitude(d, earth);
    const nowSun = SunData.getSunLongitude(d);
    const nowDiff = putIn180(nowSun - nowMoon);

    if (isConjunction(nowMoon, nowSun, prevSun, prevMoon)) {
      if (prevDiff === nowDiff) return [0, null];
      // FIX B7: Math.Abs → Math.abs
      const x = Math.abs(nowDiff) / Math.abs(prevDiff - nowDiff);
      if (x < 0.5) {
        d.shour = x + 0.5;
      } else {
        d.nextDay();
        d.shour = x - 0.5;
      }
      date.set(d);
      if (Math.abs(prevSun - nowSun) > 10.0) {
        return [putIn180(nowSun) + (putIn180(prevSun) - putIn180(nowSun)) * x, date];
      }
      return [nowSun + (prevSun - nowSun) * x, date];
    }
    prevSun = nowSun;
    prevMoon = nowMoon;
    prevDiff = nowDiff;
    bCont--;
  } while (bCont >= 0);

  return [1000.0, null];
}

/** Find next sun-moon conjunction (returns [sunLongitude, date]) */
export function getNextConjunctionX(inDate: GregorianDateTime, earth: EarthData): [longitude: number, date: GregorianDateTime | null] {
  let bCont = 32;
  const date = inDate.clone();
  const d = date.clone();
  d.shour = 0.5;
  d.TimezoneHours = 0.0;

  let nowSun = putIn360(SunData.getSunLongitude(d));
  let nowMoon = putIn360(getMoonLongitude(d, earth));
  let nowDiff = putIn180(nowSun - nowMoon);

  do {
    d.nextDay();
    const prevSun = SunData.getSunLongitude(d);
    const prevMoon = getMoonLongitude(d, earth);
    const prevDiff = putIn180(prevSun - prevMoon);

    if (isConjunction(nowMoon, nowSun, prevSun, prevMoon)) {
      if (prevDiff === nowDiff) return [0, null];
      // FIX B7: Math.Abs → Math.abs
      const x = Math.abs(nowDiff) / Math.abs(prevDiff - nowDiff);
      if (x < 0.5) {
        d.previousDay();
        d.shour = x + 0.5;
      } else {
        d.shour = x - 0.5;
      }
      date.set(d);
      if (Math.abs(prevSun - nowSun) > 10.0) {
        return [putIn180(nowSun) + (putIn180(prevSun) - putIn180(nowSun)) * x, date];
      }
      return [nowSun + (prevSun - nowSun) * x, date];
    }
    nowSun = prevSun;
    nowMoon = prevMoon;
    nowDiff = prevDiff;
    bCont--;
  } while (bCont >= 0);

  return [1000.0, null];
}

/** Find previous conjunction with binary-search refinement (phi=12°) */
export function getPrevConjunction(testDate: GregorianDateTime, thisConj: boolean, earth: EarthData): [sunLongitude: number, found: GregorianDateTime] {
  const phi = 12.0;

  if (thisConj) {
    testDate.shour -= 0.2;
    testDate.normalizeValues();
  }

  const d = testDate.clone();
  const xd = testDate.clone();
  let scanStep = 1.0;
  let sunl = SunData.getSunLongitude(d);
  let longitudeMoon = getMoonLongitude(d, earth);
  let l1 = putIn180(longitudeMoon - sunl);
  let prevTit = intFloor(l1 / phi);

  let counter = 0;
  while (counter < 20) {
    xd.set(d);

    d.shour -= scanStep;
    if (d.shour < 0.0) {
      d.shour += 1.0;
      d.previousDay();
    }

    longitudeMoon = getMoonLongitude(d, earth);
    sunl = SunData.getSunLongitude(d);
    const l2 = putIn180(longitudeMoon - sunl);
    const newTit = intFloor(l2 / phi);

    if (prevTit >= 0 && newTit < 0) {
      d.set(xd);
      scanStep *= 0.5;
      counter++;
    } else {
      l1 = l2;
      prevTit = newTit;
    }
  }

  const found = d.clone();
  return [sunl, found];
}

/** Find next conjunction with binary-search refinement (phi=12°) */
export function getNextConjunction(testDate: GregorianDateTime, thisConj: boolean, earth: EarthData): [sunLongitude: number, found: GregorianDateTime] {
  const phi = 12.0;

  if (thisConj) {
    testDate.shour += 0.2;
    testDate.normalizeValues();
  }

  const d = testDate.clone();
  const xd = testDate.clone();
  let scanStep = 1.0;
  let longitudeSun = SunData.getSunLongitude(d);
  let longitudeMoon = getMoonLongitude(d, earth);
  let l1 = putIn180(longitudeMoon - longitudeSun);
  let prevTit = intFloor(l1 / phi);

  let counter = 0;
  while (counter < 20) {
    xd.set(d);

    d.shour += scanStep;
    if (d.shour > 1.0) {
      d.shour -= 1.0;
      d.nextDay();
    }

    longitudeMoon = getMoonLongitude(d, earth);
    longitudeSun = SunData.getSunLongitude(d);
    const l2 = putIn180(longitudeMoon - longitudeSun);
    const newTit = intFloor(l2 / phi);

    if (prevTit < 0 && newTit >= 0) {
      d.set(xd);
      scanStep *= 0.5;
      counter++;
      // do NOT update prevTit — keep the negative side for refinement
    } else {
      l1 = l2;
      prevTit = newTit;
    }
  }

  const found = d.clone();
  return [longitudeSun, found];
}

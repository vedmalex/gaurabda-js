// Converted from js/GCSankranti.js (80 lines)
// FIX: global mutable sankrantiDetermineType → module-level (encapsulated)

import { putIn360, intFloor } from './math.js';
import { getAyanamsa } from './ayanamsha.js';
import { getSunLongitude } from './core-astronomy.js';
import { GregorianDateTime } from './gregorian-date-time.js';
import type { EarthData } from './earth-data.js';

const SANKRANTI_METHOD_NAMES = [
  'midnight to midnight',
  'sunrise to sunrise',
  'noon to noon',
  'sunset to sunset',
] as const;

let sankrantiDetermineType = 2;

export function getSankrantiType(): number {
  return sankrantiDetermineType;
}

export function setSankrantiType(i: number): number {
  const prev = sankrantiDetermineType;
  sankrantiDetermineType = i;
  return prev;
}

export function getSankMethodName(i: number): string {
  return SANKRANTI_METHOD_NAMES[i] ?? '';
}

/** Find next zodiac sign transition (binary search, 20 iterations) */
export function getNextSankranti(startDate: GregorianDateTime, earth: EarthData): [date: GregorianDateTime, zodiac: number] {
  const d = startDate.clone();
  let step = 1.0;
  let count = 0;
  let zodiac = 0;

  let prev = putIn360(getSunLongitude(d, earth) - getAyanamsa(d.getJulian()));
  let prevRasi = intFloor(prev / 30.0);

  while (count < 20) {
    const prevday = d.clone();
    d.shour += step;
    if (d.shour > 1.0) {
      d.shour -= 1.0;
      d.nextDay();
    }

    const ld = putIn360(getSunLongitude(d, earth) - getAyanamsa(d.getJulian()));
    const newRasi = intFloor(ld / 30.0);

    if (prevRasi !== newRasi) {
      zodiac = newRasi;
      step *= 0.5;
      d.set(prevday);
      count++;
    }
  }

  return [d, zodiac];
}

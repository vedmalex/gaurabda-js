// Converted from js/GCFestivalBase.js (127 lines)
// FIX: string.Empty → '', .Replace() → .replace() (all instances)
// GCFestivalSpecialExecutor.js was empty (5 lines) — omitted

import { FastType } from './enums.js';
import { isExtraMasa } from './masa.js';
import { tithiIsEkadasi, tithiIsDvadasi } from './tithi.js';

/** Festival descriptor — describes when a festival occurs */
export interface FestivalDescriptor {
  dayoff: number;
  masa: number;
  tithi: number;
  paksa: number;
  sankranti: number;
  masa1: number;
  masa2: number;
  script?: (days: readonly FestivalDayLike[], idx: number) => boolean;
}

/** Minimal interface for a day in the calendar array (avoids circular dep with VaisnavaDay) */
export interface FestivalDayLike {
  astrodata: {
    masa: number;
    sunRise: { tithi: number; paksa: number };
  };
  ksayaMasa: number;
  ksayaTithi: number;
  nFastID: number;
  sankranti_zodiac: number;
}

export function isFestivalDay(_days: readonly FestivalDayLike[], _idx: number, _fb: FestivalDescriptor): boolean {
  return false;
}

/** Test if today is tithi of given masa (or ksaya replacement) */
export function testFestivalTithiMasa(
  days: readonly FestivalDayLike[], index: number, fb: FestivalDescriptor, stickToMasa: boolean,
): boolean {
  const yesterday = days[index - fb.dayoff - 1];
  const today = days[index - fb.dayoff];

  if (!today) return false;

  if (today.astrodata.masa === fb.masa && today.astrodata.sunRise.tithi === fb.tithi) {
    if (yesterday && yesterday.astrodata.masa === fb.masa && yesterday.astrodata.sunRise.tithi === fb.tithi)
      return false;
    return true;
  }

  if (stickToMasa || isExtraMasa(today.astrodata.masa)) {
    if (today.ksayaMasa === fb.masa && today.ksayaTithi === fb.tithi) {
      return true;
    }
  } else if (yesterday) {
    if (yesterday.ksayaMasa === fb.masa && yesterday.ksayaTithi === fb.tithi) {
      return true;
    }
  }

  return false;
}

export function isFestivalTithiMasa(days: readonly FestivalDayLike[], index: number, fb: FestivalDescriptor): boolean {
  return testFestivalTithiMasa(days, index, fb, false);
}

export function isFestivalMasaDay(days: readonly FestivalDayLike[], index: number, fb: FestivalDescriptor): boolean {
  return testFestivalTithiMasa(days, index, fb, true);
}

export function isFestivalEkadasi(days: readonly FestivalDayLike[], idx: number, fb: FestivalDescriptor): boolean {
  const testDay = days[idx - fb.dayoff];
  if (!testDay) return false;

  return testDay.astrodata.masa === fb.masa
    && testDay.astrodata.sunRise.paksa === fb.paksa
    && (tithiIsEkadasi(testDay.astrodata.sunRise.tithi) || tithiIsDvadasi(testDay.astrodata.sunRise.tithi))
    && testDay.nFastID === FastType.FAST_EKADASI;
}

export function isFestivalSankranti(days: readonly FestivalDayLike[], idx: number, fb: FestivalDescriptor): boolean {
  const day = days[idx - fb.dayoff];
  return day ? day.sankranti_zodiac === fb.sankranti : false;
}

export function isFestivalSpecial(days: readonly FestivalDayLike[], idx: number, fb: FestivalDescriptor): boolean {
  const t = days[idx - fb.dayoff];
  if (!t) return false;

  if (fb.masa1 <= fb.masa2) {
    if (t.astrodata.masa < fb.masa1 || t.astrodata.masa > fb.masa2) return false;
  } else {
    if (t.astrodata.masa < fb.masa1 && t.astrodata.masa > fb.masa2) return false;
  }

  return fb.script ? fb.script(days, idx) : false;
}

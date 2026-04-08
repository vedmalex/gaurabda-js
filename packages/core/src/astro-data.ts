// Converted from js/GCAstroData.js (721 lines)
// FIX: Convert.ToInt32 → toInt32 (lines 420-422)
// FIX: sprintf → template literals
// Includes CalcTithiDate/CalcTithiEnd from GCTithi.js (moved here to avoid circular dep)

import { MasaId } from './enums.js';
import { toInt32 } from './math.js';
import { getAyanamsa } from './ayanamsha.js';
import { getRasi } from './rasi.js';
import { SunData } from './sun.js';
import { getMoonLongitude } from './core-astronomy.js';
import { getNextConjunction, getPrevConjunction } from './conjunction.js';
import { getNextTithiStart, getPrevTithiStart } from './tithi.js';
import { HourTime } from './hour-time.js';
import { GregorianDateTime } from './gregorian-date-time.js';
import type { EarthData } from './earth-data.js';
import gaurBegData from './data/gaur-beg.json' with { type: 'json' };

const gGaurBeg: readonly number[] = gaurBegData;

// ── AstroData class — astronomical data for one day ─────────────────

export class AstroData {
  julianDay: number = 0.0;
  gaurabdaYear: number = 0;
  ayanamsa: number = 0.0;
  masa: number = 0;

  sunArunodaya: HourTime = new HourTime();
  sunRise: HourTime = new HourTime();
  sunNoon: HourTime = new HourTime();
  sunSet: HourTime = new HourTime();

  get tithi(): number { return this.sunRise.tithi; }
  get naksatra(): number { return this.sunRise.naksatra; }
  get paksa(): number { return this.sunRise.paksa; }

  /** Calculate sun/moon positions for a given date */
  dayCalc(date: GregorianDateTime, earth: EarthData): number {
    this.sunRise = SunData.calcSunrise(date, earth);
    this.sunSet = SunData.calcSunset(date, earth);

    // arunodaya is 96 min before sunrise
    this.sunArunodaya.totalDays = this.sunRise.totalDays - 96 / 1440.0;
    this.sunArunodaya.longitude = this.sunRise.longitude - (24.0 / 365.25);

    // noon
    this.sunNoon.totalDays = (this.sunSet.totalDays + this.sunRise.totalDays) / 2;
    this.sunNoon.longitude = (this.sunRise.longitude + this.sunSet.longitude) / 2;

    date.shour = this.sunRise.totalDays;
    this.julianDay = date.getJulianDetailed();

    // moon position at sunrise
    this.sunRise.longitudeMoon = getMoonLongitude(date, earth);

    this.ayanamsa = getAyanamsa(this.julianDay);
    this.sunArunodaya.ayanamsa = this.ayanamsa;
    this.sunRise.ayanamsa = this.ayanamsa;
    this.sunNoon.ayanamsa = this.ayanamsa;
    this.sunSet.ayanamsa = this.ayanamsa;

    this.masa = -1;

    date.shour = this.sunSet.totalDays;
    this.sunSet.longitudeMoon = getMoonLongitude(date, earth);

    date.shour = this.sunArunodaya.totalDays;
    this.sunArunodaya.longitudeMoon = getMoonLongitude(date, earth);

    return 1;
  }

  /** Determine Gaurabda masa and year for given date */
  masaCalc(date: GregorianDateTime, earth: EarthData): number {
    const PREV_MONTHS = 6;

    const L: number[] = new Array(8).fill(0.0);
    const C: GregorianDateTime[] = Array.from({ length: 8 }, () => new GregorianDateTime());
    const R: number[] = new Array(8).fill(0);

    let masa: number = MasaId.VISNU_MASA;
    let ksayaFrom = -1;
    let ksayaTo = -1;

    date.shour = this.sunRise.totalDays;

    // Find surrounding conjunctions
    [L[1], C[1]] = getNextConjunction(date, false, earth);
    [L[0], C[0]] = getNextConjunction(C[1], true, earth);
    [L[2], C[2]] = getPrevConjunction(date, false, earth);

    for (let n = 3; n < PREV_MONTHS; n++) {
      [L[n], C[n]] = getPrevConjunction(C[n - 1], true, earth);
    }

    for (let n = 0; n < PREV_MONTHS; n++) {
      R[n] = getRasi(L[n], getAyanamsa(C[n].getJulian()));
    }

    // Look for ksaya month
    for (let n = PREV_MONTHS - 2; n >= 0; n--) {
      if ((R[n + 1] + 2) % 12 === R[n]) {
        ksayaFrom = n;
        break;
      }
    }

    if (ksayaFrom >= 0) {
      for (let n = ksayaFrom; n > 0; n--) {
        if (R[n] === R[n - 1]) {
          ksayaTo = n;
          break;
        }
      }

      if (ksayaTo < 0) ksayaTo = 0;

      let currentRasi = R[ksayaFrom + 1] + 1;
      for (let n = ksayaFrom; n >= ksayaTo; n--) {
        R[n] = currentRasi;
        currentRasi = (currentRasi + 1) % 12;
      }
    }

    // Test for adhika masa
    let rasi: number;
    if (R[1] === R[2]) {
      masa = 12; // adhika masa
      rasi = R[1];
    } else {
      masa = this.sunRise.paksa === 0 ? R[1] : R[2];
      rasi = masa;
    }

    // Gaurabda year
    this.gaurabdaYear = date.year - 1486;
    if (rasi > 7 && rasi < 11) {
      if (date.month < 6) this.gaurabdaYear -= 1;
    }

    this.masa = masa;
    return masa;
  }

  /** Find first day of given masa in Gaurabda year */
  static getFirstDayOfMasa(earth: EarthData, gYear: number, nMasa: number): GregorianDateTime {
    return calcTithiDate(gYear, nMasa, 0, 0, earth);
  }

  /** Find Visnu Masa Pratipat for a Gregorian year */
  static getFirstDayOfYear(earth: EarthData, nYear: number): GregorianDateTime {
    const a = [2, 15, 3, 1, 3, 15, 4, 1, 4, 15];
    const d = new GregorianDateTime();
    const day = new AstroData();

    if (nYear >= 1950 && nYear < 2058) {
      const tmp = gGaurBeg[(nYear - 1950) * 26 + 22];
      d.month = (tmp & 0x3e0) >> 5;
      d.day = tmp & 0x1f;
      d.year = nYear;
      d.nextDay();
      a[0] = d.month;
      a[1] = d.day;
    }

    for (let i = 0; i < 10; i += 2) {
      d.year = nYear;
      d.month = a[i];
      d.day = a[i + 1];

      day.dayCalc(d, earth);
      day.masaCalc(d, earth);

      if (day.masa === 11) { // visnu masa
        let step: number;
        do {
          step = toInt32(day.sunRise.tithi / 2);
          if (step <= 0) step = 1;
          for (let j = step; j > 0; j--) d.previousDay();
          day.dayCalc(d, earth);
        } while (day.sunRise.tithi < 28);

        d.nextDay();
        d.TimezoneHours = earth.offsetUtcHours;
        d.shour = day.sunRise.totalDays;
        return d;
      }
    }

    d.year = -1;
    d.month = -1;
    d.day = -1;
    d.TimezoneHours = earth.offsetUtcHours;
    d.shour = day.sunRise.totalDays;
    return d;
  }

  toString(): string {
    return `JulianDay: ${this.julianDay}, sunrise: ${this.sunRise}, noon: ${this.sunNoon}, sunset: ${this.sunSet}`;
  }
}

// ── CalcTithiDate / CalcTithiEnd (from GCTithi.js, moved here) ─────

/** Calculate date when a specific tithi falls */
export function calcTithiDate(nGYear: number, nMasa: number, nPaksa: number, nTithi: number, earth: EarthData): GregorianDateTime {
  const d = new GregorianDateTime();
  const day = new AstroData();
  let i = 0;
  let tithi = 0;
  let counter = 0;

  if (nGYear >= 464 && nGYear < 572) {
    const tmp = gGaurBeg[(nGYear - 464) * 26 + nMasa * 2 + nPaksa];
    // FIX: Convert.ToInt32 → toInt32
    d.month = toInt32((tmp & 0x3e0) >> 5);
    d.day = toInt32(tmp & 0x1f);
    d.year = toInt32((tmp & 0xfffc00) >> 10);
    d.TimezoneHours = earth.offsetUtcHours;
    d.nextDay();

    day.dayCalc(d, earth);
    day.masaCalc(d, earth);
  } else {
    d.day = 15;
    d.month = 2 + nMasa;
    d.year = nGYear + 1486;
    if (d.month > 12) {
      d.month -= 12;
      d.year++;
    }
    d.shour = 0.5;
    d.TimezoneHours = earth.offsetUtcHours;

    i = 0;
    do {
      d.addDays(13);
      day.dayCalc(d, earth);
      day.masaCalc(d, earth);
      i++;
    } while ((day.sunRise.paksa !== nPaksa || day.masa !== nMasa) && i <= 30);
  }

  if (i >= 30) {
    d.year = d.month = d.day = -1;
    return d;
  }

  tithi = nTithi + nPaksa * 15;

  if (day.sunRise.tithi === tithi) {
    d.previousDay();
    day.dayCalc(d, earth);
    if (day.sunRise.tithi > tithi && day.sunRise.paksa !== nPaksa) {
      d.nextDay();
    }
    return d;
  }

  if (day.sunRise.tithi < tithi) {
    counter = 0;
    while (counter < 16) {
      d.nextDay();
      day.dayCalc(d, earth);
      if (day.sunRise.tithi === tithi) return d;
      if (day.sunRise.tithi < tithi && day.sunRise.paksa !== nPaksa) return d;
      if (day.sunRise.tithi > tithi) return d;
      counter++;
    }
    d.year = d.month = d.day = 0;
    return d;
  }

  // day.sunRise.tithi > tithi
  counter = 0;
  while (counter < 16) {
    d.previousDay();
    day.dayCalc(d, earth);
    if (day.sunRise.tithi === tithi) return d;
    if (day.sunRise.tithi > tithi && day.sunRise.paksa !== nPaksa) {
      d.nextDay();
      return d;
    }
    if (day.sunRise.tithi < tithi) {
      d.nextDay();
      return d;
    }
    counter++;
  }
  d.year = d.month = d.day = 0;
  return d;
}

/** Calculate start and end dates of a specific tithi */
export function calcTithiEnd(nGYear: number, nMasa: number, nPaksa: number, nTithi: number, earth: EarthData): [start: GregorianDateTime, end: GregorianDateTime | null] {
  const d = new GregorianDateTime();

  d.set(AstroData.getFirstDayOfYear(earth, nGYear + 1486));
  d.shour = 0.5;
  d.TimezoneHours = earth.offsetUtcHours;

  return calcTithiEndEx(d, nGYear, nMasa, nPaksa, nTithi, earth);
}

/** Extended: calculate tithi end from a starting date */
export function calcTithiEndEx(
  vcStart: GregorianDateTime, _gYear: number, nMasa: number, nPaksa: number, nTithi: number, earth: EarthData,
): [start: GregorianDateTime, end: GregorianDateTime | null] {
  let nType = 0;
  const d = vcStart.clone();
  const day = new AstroData();
  let i = 0;

  do {
    d.addDays(13);
    day.dayCalc(d, earth);
    day.masaCalc(d, earth);
    i++;
  } while ((day.sunRise.paksa !== nPaksa || day.masa !== nMasa) && i <= 30);

  if (i >= 30) {
    d.year = d.month = d.day = -1;
    return [d, null];
  }

  const tithi = nTithi + nPaksa * 15;

  if (day.sunRise.tithi === tithi) {
    nType = 1;
  } else {
    let succ = false;
    if (day.sunRise.tithi < tithi) {
      let counter = 0;
      while (counter < 30) {
        d.nextDay();
        day.dayCalc(d, earth);
        if (day.sunRise.tithi === tithi) { succ = true; break; }
        if (day.sunRise.tithi < tithi && day.sunRise.paksa !== nPaksa) { d.previousDay(); succ = true; break; }
        if (day.sunRise.tithi > tithi) { d.previousDay(); succ = true; break; }
        counter++;
      }
      if (!succ) { d.year = d.month = d.day = 0; nType = 0; }
    } else {
      let counter = 0;
      while (counter < 30) {
        d.previousDay();
        day.dayCalc(d, earth);
        if (day.sunRise.tithi === tithi) { succ = true; break; }
        if (day.sunRise.tithi > tithi && day.sunRise.paksa !== nPaksa) { succ = true; break; }
        if (day.sunRise.tithi < tithi) { succ = true; break; }
        counter++;
      }
      if (!succ) { d.year = d.month = d.day = 0; nType = 0; }
    }

    nType = day.sunRise.tithi === tithi ? 1 : 2;
  }

  const sunrise = day.sunRise.totalDays;

  if (nType === 1) {
    d.shour = sunrise;
    const [, d1] = getPrevTithiStart(earth, d);
    const [, d2] = getNextTithiStart(earth, d);
    return [d1, d2];
  }

  if (nType === 2) {
    d.shour = sunrise;
    const [, d1] = getNextTithiStart(earth, d);
    const dd = d1.clone();
    dd.shour += 0.1;
    dd.normalizeValues();
    const [, d2] = getNextTithiStart(earth, dd);
    return [d1, d2];
  }

  // nType === 0 — failure
  d.year = 0; d.month = 0; d.day = 0; d.shour = 0.0;
  return [d, d.clone()];
}

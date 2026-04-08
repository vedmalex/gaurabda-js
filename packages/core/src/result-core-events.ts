// Converted from js/TResultCoreEvents.js (317 lines)
// Removed: TCoreEventCollection (replaced by CoreEvent[] + insertByTime)
// Removed: XMLHttpRequest LoadFile/SaveFile (not needed in modern JS)
// Replaced: GCLocation → EarthData + DisplaySettings param

import { CoreEventType } from './enums.js';
import { putIn360, intFloor } from './math.js';
import { getAyanamsa } from './ayanamsha.js';
import { getRasi } from './rasi.js';
import { CoreEvent } from './core-event.js';
import { GregorianDateTime } from './gregorian-date-time.js';
import { getNextTithiStart } from './tithi.js';
import { getNextNaksatra } from './naksatra.js';
import { getNextYogaStart } from './yoga.js';
import { getNextSankranti } from './sankranti.js';
import { getNextConjunction } from './conjunction.js';
import { getMoonLongitude } from './core-astronomy.js';
import { GCDS, DisplaySettings } from './display-settings.js';
import type { EarthData } from './earth-data.js';

// ── getNextMoonRasi (from GCMoonData.GetNextMoonRasi) ───────────────

function getNextMoonRasi(ed: EarthData, startDate: GregorianDateTime): [rasiIndex: number, date: GregorianDateTime] {
  const phi = 30.0;
  const d = startDate.clone();
  const xd = startDate.clone();
  const jday0 = startDate.getJulianComplete();
  const ayanamsa = getAyanamsa(jday0);
  let scanStep = 0.5;

  let longitudeMoon = getMoonLongitude(d, ed);
  let l1 = putIn360(longitudeMoon - ayanamsa);
  let prevNaks = intFloor(l1 / phi);
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
    newNaks = intFloor(l2 / phi);
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

// ── ResultCoreEvents class ──────────────────────────────────────────

export class ResultCoreEvents {
  full: boolean = false;
  year: number = 0;
  month?: number;
  events: CoreEvent[] = [];

  clear(): void {
    this.events = [];
  }

  addEvent(gTime: GregorianDateTime, inType: number, inData: number): void {
    const de = new CoreEvent();
    de.Time = gTime.getJulianComplete() * 86400;
    de.nDst = 0;
    de.nData = inData;
    de.nType = inType;
    this.events.push(de);
  }

  sort(): void {
    this.events.sort((a, b) => a.Time - b.Time);
  }

  /** Get core events within a UTC time range */
  getCoreEvents(utcDayStart: number, utcDayEnd: number): CoreEvent[] {
    const result: CoreEvent[] = [];
    for (const ce of this.events) {
      if (ce.Time >= utcDayStart && ce.Time < utcDayEnd) {
        result.push(ce);
      }
    }
    return result;
  }

  /** Calculate all astronomical events for a year or month */
  calculateEvents(earth: EarthData, nYear: number, nMonth?: number, settings?: DisplaySettings): void {
    const gds = settings ?? new DisplaySettings();
    this.clear();
    this.year = nYear;
    this.month = nMonth;

    let vcStart: GregorianDateTime;
    let vcEnd: GregorianDateTime;

    if (nMonth !== undefined) {
      vcStart = GregorianDateTime.fromComponents(nYear, nMonth, 1);
      vcEnd = GregorianDateTime.fromComponents(nYear, nMonth, GregorianDateTime.getMonthMaxDays(nYear, nMonth));
    } else {
      vcStart = GregorianDateTime.fromComponents(nYear - 1, 12, 29);
      vcEnd = GregorianDateTime.fromComponents(nYear + 1, 1, 2);
    }

    const vc = vcStart.clone();
    vc.TimezoneHours = earth.offsetUtcHours;
    const vcAdd = vc.clone();

    let nData: number;
    let vcNext: GregorianDateTime;

    // Tithi events
    if (this.full || gds.getValue(GCDS.COREEVENTS_TITHI) !== 0) {
      vcAdd.set(vc);
      vcAdd.shour = 0.0;
      while (vcAdd.isLessThan(vcEnd)) {
        [nData, vcNext] = getNextTithiStart(earth, vcAdd);
        if (vcNext.getDayInteger() < vcEnd.getDayInteger()) {
          this.addEvent(vcNext, CoreEventType.CCTYPE_TITHI, nData);
        } else break;
        vcAdd.set(vcNext);
        vcAdd.shour += 0.2;
        if (vcAdd.shour >= 1.0) { vcAdd.shour -= 1.0; vcAdd.nextDay(); }
      }
    }

    // Naksatra events
    if (this.full || gds.getValue(GCDS.COREEVENTS_NAKSATRA) !== 0) {
      vcAdd.set(vc);
      vcAdd.shour = 0.0;
      while (vcAdd.isLessThan(vcEnd)) {
        [nData, vcNext] = getNextNaksatra(earth, vcAdd);
        if (vcNext.getDayInteger() < vcEnd.getDayInteger()) {
          this.addEvent(vcNext, CoreEventType.CCTYPE_NAKS, nData);
        } else break;
        vcAdd.set(vcNext);
        vcAdd.shour += 0.2;
        if (vcAdd.shour >= 1.0) { vcAdd.shour -= 1.0; vcAdd.nextDay(); }
      }
    }

    // Yoga events
    if (this.full || gds.getValue(GCDS.COREEVENTS_YOGA) !== 0) {
      vcAdd.set(vc);
      vcAdd.shour = 0.0;
      while (vcAdd.isLessThan(vcEnd)) {
        [nData, vcNext] = getNextYogaStart(earth, vcAdd);
        if (vcNext.getDayInteger() < vcEnd.getDayInteger()) {
          this.addEvent(vcNext, CoreEventType.CCTYPE_YOGA, nData);
        } else break;
        vcAdd.set(vcNext);
        vcAdd.shour += 0.2;
        if (vcAdd.shour >= 1.0) { vcAdd.shour -= 1.0; vcAdd.nextDay(); }
      }
    }

    // Sankranti events
    if (this.full || gds.getValue(GCDS.COREEVENTS_SANKRANTI) !== 0) {
      vcAdd.set(vc);
      vcAdd.shour = 0.0;
      while (vcAdd.isLessThan(vcEnd)) {
        const [sankDate, sankZodiac] = getNextSankranti(vcAdd, earth);
        vcNext = sankDate;
        if (vcNext.getDayInteger() < vcEnd.getDayInteger()) {
          this.addEvent(vcNext, CoreEventType.CCTYPE_SANK, sankZodiac);
        } else break;
        vcAdd.set(vcNext);
        vcAdd.nextDay();
      }
    }

    // Moon rasi events
    if (this.full || gds.getValue(GCDS.COREEVENTS_MOONRASI) !== 0) {
      vcAdd.set(vc);
      vcAdd.shour = 0.0;
      while (vcAdd.isLessThan(vcEnd)) {
        const [rasiIdx, rasiDate] = getNextMoonRasi(earth, vcAdd);
        vcNext = rasiDate;
        if (vcNext.getDayInteger() < vcEnd.getDayInteger()) {
          this.addEvent(vcNext, CoreEventType.CCTYPE_M_RASI, rasiIdx);
        } else break;
        vcAdd.set(vcNext);
        vcAdd.shour += 0.5;
        vcAdd.normalizeValues();
      }
    }

    // Conjunction events
    if (this.full || gds.getValue(GCDS.COREEVENTS_CONJUNCTION) !== 0) {
      vcAdd.set(vc);
      vcAdd.shour = 0.0;
      while (vcAdd.isLessThan(vcEnd)) {
        const [dlong, conjDate] = getNextConjunction(vcAdd, true, earth);
        vcNext = conjDate;
        if (vcNext.getDayInteger() < vcEnd.getDayInteger()) {
          this.addEvent(vcNext, CoreEventType.CCTYPE_CONJ, getRasi(dlong, getAyanamsa(vcNext.getJulianComplete())));
        } else break;
        vcAdd.set(vcNext);
        vcAdd.nextDay();
      }
    }

    this.sort();
  }
}

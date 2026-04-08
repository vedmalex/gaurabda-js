// Rewritten from js/TResultEvents.js (609 lines of C# code)
// Original was never converted from C# to JS — this is a fresh TypeScript implementation
// Provides DST-aware event listing with sun events, kala periods, and astronomical events

import { CoreEventType, DstTypeChange, KalaType } from './enums.js';
import { getRasi } from './rasi.js';
import { getAyanamsa } from './ayanamsha.js';
import { SunData } from './sun.js';
import { GregorianDateTime } from './gregorian-date-time.js';
import { getNextTithiStart } from './tithi.js';
import { getNextNaksatra } from './naksatra.js';
import { getNextYogaStart } from './yoga.js';
import { getNextSankranti } from './sankranti.js';
import { getNextConjunction } from './conjunction.js';
import { GCDS, DisplaySettings } from './display-settings.js';
import { Location } from './location.js';

// ── DayEvent — event with GregorianDateTime and DST info ────────────

export class DayEvent {
  nType: number = 0;
  nData: number = 0;
  time: GregorianDateTime = new GregorianDateTime();
  nDst: number = 0;

  get typeString(): string {
    return CoreEvent_getTypeString(this.nType, this.nData);
  }

  get groupNameString(): string {
    return CoreEvent_getTypeString(this.nType);
  }
}

// Reuse CoreEvent.getTypeString logic (already in core-event.ts but avoid import cycle)
import { CoreEvent } from './core-event.js';

function CoreEvent_getTypeString(nType: number, nData?: number): string {
  return CoreEvent.getTypeString(nType, nData);
}

// ── Sorting ─────────────────────────────────────────────────────────

export const SORTING_BY_TYPE = 0;
export const SORTING_BY_DATE = 1;

function compareDayEvents(a: DayEvent, b: DayEvent, sortType: number): number {
  if (sortType === SORTING_BY_TYPE && a.nType !== b.nType) {
    return a.nType - b.nType;
  }
  const d = a.time.getJulianComplete() - b.time.getJulianComplete();
  if (d < 0) return -1;
  if (d > 0) return 1;
  return 0;
}

// ── ResultEvents class ──────────────────────────────────────────────

export class ResultEvents {
  startDateTime: GregorianDateTime = new GregorianDateTime();
  endDateTime: GregorianDateTime = new GregorianDateTime();
  sortType: number = SORTING_BY_DATE;
  events: DayEvent[] = [];

  clear(): void { this.events = []; }

  addEvent(inTime: GregorianDateTime, inType: number, inData: number, inDst: DstTypeChange): void {
    const de = new DayEvent();
    de.time = inTime.clone();

    switch (inDst) {
      case DstTypeChange.DstOff:
        de.nDst = 0;
        break;
      case DstTypeChange.DstStart:
        if (de.time.shour >= 2 / 24.0) {
          de.time.shour += 1 / 24.0;
          de.time.normalizeValues();
          de.nDst = 1;
        } else {
          de.nDst = 0;
        }
        break;
      case DstTypeChange.DstOn:
        de.time.shour += 1 / 24.0;
        de.time.normalizeValues();
        de.nDst = 1;
        break;
      case DstTypeChange.DstEnd:
        if (de.time.shour <= 2 / 24.0) {
          de.time.shour += 1 / 24.0;
          de.time.normalizeValues();
          de.nDst = 1;
        } else {
          de.nDst = 0;
        }
        break;
      default:
        de.nDst = 0;
    }

    de.nData = inData;
    de.nType = inType;
    this.events.push(de);
  }

  sort(nSortType: number = SORTING_BY_DATE): void {
    this.sortType = nSortType;
    this.events.sort((a, b) => compareDayEvents(a, b, nSortType));
  }

  /** Calculate all events for a date range with DST support */
  calculateEvents(loc: Location, vcStart: GregorianDateTime, vcEnd: GregorianDateTime, settings?: DisplaySettings): void {
    const gds = settings ?? new DisplaySettings();
    this.clear();
    this.startDateTime = vcStart.clone();
    this.endDateTime = vcEnd.clone();

    const earth = loc.getEarthData();
    const vc = vcStart.clone();
    vc.TimezoneHours = loc.offsetUtcHours;
    const vcAdd = vc.clone();
    vcAdd.initWeekDay();

    // Sun events + Kala periods (daily iteration)
    while (vcAdd.isLessThan(vcEnd)) {
      const sunriseData = SunData.calcSunrise(vcAdd, earth);
      const sunsetData = SunData.calcSunset(vcAdd, earth);
      const sunRise = sunriseData.totalDays;
      const sunSet = sunsetData.totalDays;
      const ndst = loc.timezone.determineDaylightChange(vcAdd);

      if (gds.getValue(GCDS.COREEVENTS_SUN) !== 0) {
        vcAdd.shour = sunriseData.totalDays - 96.0 / 1440.0;
        this.addEvent(vcAdd, CoreEventType.CCTYPE_S_ARUN, 0, ndst);
        vcAdd.shour = sunRise;
        this.addEvent(vcAdd, CoreEventType.CCTYPE_S_RISE, 0, ndst);
        vcAdd.shour = (sunRise + sunSet) / 2;
        this.addEvent(vcAdd, CoreEventType.CCTYPE_S_NOON, 0, ndst);
        vcAdd.shour = sunSet;
        this.addEvent(vcAdd, CoreEventType.CCTYPE_S_SET, 0, ndst);
      }

      if (gds.getValue(GCDS.COREEVENTS_RAHUKALAM) !== 0) {
        const [r1, r2] = SunData.calculateKala(sunRise, sunSet, vcAdd.weekday, KalaType.KT_RAHU_KALAM);
        if (r1 >= 0) {
          vcAdd.shour = r1;
          this.addEvent(vcAdd, CoreEventType.CCTYPE_KALA_START, KalaType.KT_RAHU_KALAM, ndst);
          vcAdd.shour = r2;
          this.addEvent(vcAdd, CoreEventType.CCTYPE_KALA_END, KalaType.KT_RAHU_KALAM, ndst);
        }
      }

      if (gds.getValue(GCDS.COREEVENTS_YAMAGHANTI) !== 0) {
        const [r1, r2] = SunData.calculateKala(sunRise, sunSet, vcAdd.weekday, KalaType.KT_YAMA_GHANTI);
        if (r1 >= 0) {
          vcAdd.shour = r1;
          this.addEvent(vcAdd, CoreEventType.CCTYPE_KALA_START, KalaType.KT_YAMA_GHANTI, ndst);
          vcAdd.shour = r2;
          this.addEvent(vcAdd, CoreEventType.CCTYPE_KALA_END, KalaType.KT_YAMA_GHANTI, ndst);
        }
      }

      if (gds.getValue(GCDS.COREEVENTS_GULIKALAM) !== 0) {
        const [r1, r2] = SunData.calculateKala(sunRise, sunSet, vcAdd.weekday, KalaType.KT_GULI_KALAM);
        if (r1 >= 0) {
          vcAdd.shour = r1;
          this.addEvent(vcAdd, CoreEventType.CCTYPE_KALA_START, KalaType.KT_GULI_KALAM, ndst);
          vcAdd.shour = r2;
          this.addEvent(vcAdd, CoreEventType.CCTYPE_KALA_END, KalaType.KT_GULI_KALAM, ndst);
        }
      }

      if (gds.getValue(GCDS.COREEVENTS_ABHIJIT_MUHURTA) !== 0) {
        const [r1, r2] = SunData.calculateKala(sunRise, sunSet, vcAdd.weekday, KalaType.KT_ABHIJIT);
        if (r1 > 0 && r2 > 0) {
          vcAdd.shour = r1;
          this.addEvent(vcAdd, CoreEventType.CCTYPE_KALA_START, KalaType.KT_ABHIJIT, ndst);
          vcAdd.shour = r2;
          this.addEvent(vcAdd, CoreEventType.CCTYPE_KALA_END, KalaType.KT_ABHIJIT, ndst);
        }
      }

      vcAdd.nextDay();
    }

    // Tithi events
    if (gds.getValue(GCDS.COREEVENTS_TITHI) !== 0) {
      vcAdd.set(vc); vcAdd.shour = 0.0;
      while (vcAdd.isLessThan(vcEnd)) {
        const [nData, vcNext] = getNextTithiStart(earth, vcAdd);
        if (vcNext.getDayInteger() < vcEnd.getDayInteger()) {
          vcNext.initWeekDay();
          const ndst = loc.timezone.determineDaylightChange(vcNext);
          this.addEvent(vcNext, CoreEventType.CCTYPE_TITHI, nData, ndst);
        } else break;
        vcAdd.set(vcNext);
        vcAdd.shour += 0.2;
        if (vcAdd.shour >= 1.0) { vcAdd.shour -= 1.0; vcAdd.nextDay(); }
      }
    }

    // Naksatra events
    if (gds.getValue(GCDS.COREEVENTS_NAKSATRA) !== 0) {
      vcAdd.set(vc); vcAdd.shour = 0.0;
      while (vcAdd.isLessThan(vcEnd)) {
        const [nData, vcNext] = getNextNaksatra(earth, vcAdd);
        if (vcNext.getDayInteger() < vcEnd.getDayInteger()) {
          vcNext.initWeekDay();
          const ndst = loc.timezone.determineDaylightChange(vcNext);
          this.addEvent(vcNext, CoreEventType.CCTYPE_NAKS, nData, ndst);
        } else break;
        vcAdd.set(vcNext);
        vcAdd.shour += 0.2;
        if (vcAdd.shour >= 1.0) { vcAdd.shour -= 1.0; vcAdd.nextDay(); }
      }
    }

    // Yoga events
    if (gds.getValue(GCDS.COREEVENTS_YOGA) !== 0) {
      vcAdd.set(vc); vcAdd.shour = 0.0;
      while (vcAdd.isLessThan(vcEnd)) {
        const [nData, vcNext] = getNextYogaStart(earth, vcAdd);
        if (vcNext.getDayInteger() < vcEnd.getDayInteger()) {
          vcNext.initWeekDay();
          const ndst = loc.timezone.determineDaylightChange(vcNext);
          this.addEvent(vcNext, CoreEventType.CCTYPE_YOGA, nData, ndst);
        } else break;
        vcAdd.set(vcNext);
        vcAdd.shour += 0.2;
        if (vcAdd.shour >= 1.0) { vcAdd.shour -= 1.0; vcAdd.nextDay(); }
      }
    }

    // Sankranti events
    if (gds.getValue(GCDS.COREEVENTS_SANKRANTI) !== 0) {
      vcAdd.set(vc); vcAdd.shour = 0.0;
      while (vcAdd.isLessThan(vcEnd)) {
        const [sankDate, nData] = getNextSankranti(vcAdd, earth);
        if (sankDate.getDayInteger() < vcEnd.getDayInteger()) {
          sankDate.initWeekDay();
          const ndst = loc.timezone.determineDaylightChange(sankDate);
          this.addEvent(sankDate, CoreEventType.CCTYPE_SANK, nData, ndst);
        } else break;
        vcAdd.set(sankDate);
        vcAdd.nextDay();
      }
    }

    // Conjunction events
    if (gds.getValue(GCDS.COREEVENTS_CONJUNCTION) !== 0) {
      vcAdd.set(vc); vcAdd.shour = 0.0;
      while (vcAdd.isLessThan(vcEnd)) {
        const [dlong, vcNext] = getNextConjunction(vcAdd, true, earth);
        if (vcNext.getDayInteger() < vcEnd.getDayInteger()) {
          vcNext.initWeekDay();
          const ndst = loc.timezone.determineDaylightChange(vcNext);
          this.addEvent(vcNext, CoreEventType.CCTYPE_CONJ, getRasi(dlong, getAyanamsa(vcNext.getJulianComplete())), ndst);
        } else break;
        vcAdd.set(vcNext);
        vcAdd.nextDay();
      }
    }

    // Sort
    if (gds.getValue(GCDS.COREEVENTS_SORT) !== 0)
      this.sort(SORTING_BY_DATE);
    else
      this.sort(SORTING_BY_TYPE);
  }
}

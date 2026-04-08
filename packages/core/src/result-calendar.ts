// Converted from js/TResultCalendar.js (768 lines)
// Core calculation pipeline only: astro data → masa → mahadvadasi → ekadasi → parana
// Deferred: DST, eclipses, festival matching, formatting (these need GCLocation/timezone)
// Replaced: GCLocation → EarthData, gds → optional DisplaySettings
// Replaced: TCoreEventCollection → CoreEvent[] + insertByTime

import { CoreEventType, FastType } from './enums.js';
import { CoreEvent } from './core-event.js';
import { AstroData } from './astro-data.js';
import { VaisnavaDay, insertByTime } from './vaisnava-day.js';
import { ResultCoreEvents } from './result-core-events.js';
import { GregorianDateTime } from './gregorian-date-time.js';
import type { EarthData } from './earth-data.js';

export class ResultCalendar {
  readonly BEFORE_DAYS = 8;

  days: VaisnavaDay[] = [];
  totalCount: number = 0;
  pureCount: number = 0;
  vcStart: GregorianDateTime = new GregorianDateTime();
  ekadasiOnly: boolean = false;

  /** Get a day by index */
  getDay(i: number): VaisnavaDay | null {
    return i >= 0 && i < this.days.length ? this.days[i] : null;
  }

  /** Find index of a date in the calendar */
  findDate(date: GregorianDateTime): number {
    for (let i = 0; i < this.days.length; i++) {
      if (this.days[i].date && this.days[i].date!.day === date.day &&
          this.days[i].date!.month === date.month && this.days[i].date!.year === date.year) {
        return i;
      }
    }
    return -1;
  }

  /** Calculate calendar for a year */
  calculateYear(earth: EarthData, nYear: number): void {
    const sdate = GregorianDateTime.fromComponents(nYear, 1, 1);
    const count = GregorianDateTime.isLeapYear(nYear) ? 366 : 365;
    this.calculateCalendar(earth, sdate, count);
  }

  /** Calculate calendar for a month */
  calculateMonth(earth: EarthData, nYear: number, nMonth: number): void {
    const sdate = GregorianDateTime.fromComponents(nYear, nMonth, 1);
    this.calculateCalendar(earth, sdate, GregorianDateTime.getMonthMaxDays(nYear, nMonth));
  }

  /** Main calendar calculation pipeline */
  calculateCalendar(earth: EarthData, begDate: GregorianDateTime, iCount: number): void {
    const nTotalCount = this.BEFORE_DAYS + iCount + this.BEFORE_DAYS;
    let lastMasa = 0;
    let lastGYear = 0;

    this.totalCount = nTotalCount;
    this.vcStart = begDate.clone();
    this.pureCount = iCount;
    this.days = [];

    const date = begDate.clone();
    date.shour = 0.0;
    date.TimezoneHours = earth.offsetUtcHours;
    date.subtractDays(this.BEFORE_DAYS);
    date.initWeekDay();

    let weekday = date.weekday;
    let utcDayStart = date.getJulianComplete() * 86400;

    // Step 1: Initialize days
    for (let i = 0; i < nTotalCount; i++) {
      const vday = new VaisnavaDay();
      vday.date = date.clone();
      vday.date.dayOfWeek = weekday;
      vday.moonrise.setValue(-1);
      vday.moonset.setValue(-1);
      vday.utcDayStart = utcDayStart;
      vday.earth = earth;

      this.days.push(vday);

      date.nextDay();
      utcDayStart += 86400;
      weekday = (weekday + 1) % 7;
    }

    // Link previous/next
    for (let i = 1; i < nTotalCount; i++) {
      this.days[i].previous = this.days[i - 1];
    }
    for (let i = 0; i < nTotalCount - 1; i++) {
      this.days[i].next = this.days[i + 1];
    }

    // Step 2: Calculate core events for each day
    let recentEvents: ResultCoreEvents | null = null;
    let recentYear = -1;
    let recentMonth = -1;

    for (const t of this.days) {
      // No DST calculation in core — biasMinutes stays 0
      const dayUtcStart = t.utcDayStart;
      const dayUtcEnd = t.utcDayStart + 86400;

      if (recentEvents === null || recentYear !== t.date!.year || recentMonth !== t.date!.month) {
        recentEvents = new ResultCoreEvents();
        recentEvents.full = true;
        recentEvents.calculateEvents(earth, t.date!.year, t.date!.month);
        recentYear = t.date!.year;
        recentMonth = t.date!.month;
      }

      t.coreEvents = recentEvents.getCoreEvents(dayUtcStart, dayUtcEnd);
    }

    // Step 3: Calculate astro data
    for (const t of this.days) {
      t.astrodata = new AstroData();
      t.astrodata.dayCalc(t.date!, earth);

      insertByTime(t.coreEvents, CoreEvent.withTimeType(
        t.utcDayStart + t.astrodata.sunArunodaya.totalSeconds,
        CoreEventType.CCTYPE_S_ARUN));
      insertByTime(t.coreEvents, CoreEvent.withTimeType(
        t.utcDayStart + t.astrodata.sunRise.totalSeconds,
        CoreEventType.CCTYPE_S_RISE));
      insertByTime(t.coreEvents, CoreEvent.withTimeType(
        t.utcDayStart + t.astrodata.sunNoon.totalSeconds,
        CoreEventType.CCTYPE_S_NOON));
      insertByTime(t.coreEvents, CoreEvent.withTimeType(
        t.utcDayStart + t.astrodata.sunSet.totalSeconds,
        CoreEventType.CCTYPE_S_SET));
    }

    // Step 4: Calculate masa
    for (const t of this.days) {
      if (!t.previous || t.astrodata.sunRise.paksa !== t.previous.astrodata.sunRise.paksa) {
        t.astrodata.masaCalc(t.date!, earth);
        lastMasa = t.astrodata.masa;
        lastGYear = t.astrodata.gaurabdaYear;
      }
      t.astrodata.masa = lastMasa;
      t.astrodata.gaurabdaYear = lastGYear;
    }

    // Step 5: Mahadvadasi
    for (const t of this.days) {
      t.mahadvadasiCalc(earth);
    }

    // Step 6: Ekadasi
    for (const t of this.days) {
      if (!t.previous) continue;
      t.ekadasiCalc(earth);
    }

    // Step 7: Parana (break-fast)
    for (const t of this.days) {
      if (t.previous && t.previous.nFastID === FastType.FAST_EKADASI) {
        t.calculateEParana(earth);
      }
    }

    if (this.ekadasiOnly) return;

    // Step 8: Ksaya/vriddhi data
    this.calculateKsayaVriddhiTithis();
  }

  /** Calculate ksaya and vriddhi tithi data */
  private calculateKsayaVriddhiTithis(): void {
    for (let i = 1; i < this.days.length; i++) {
      const t = this.days[i];
      const prev = this.days[i - 1];

      // Ksaya tithi — when a tithi is skipped (prev tithi + 2 = current tithi)
      if (t.astrodata.sunRise.tithi !== prev.astrodata.sunRise.tithi) {
        const expected = (prev.astrodata.sunRise.tithi + 1) % 30;
        if (t.astrodata.sunRise.tithi !== expected) {
          t.ksayaTithi = expected;
          t.ksayaMasa = prev.astrodata.masa;
        }
      }

      // Vriddhi — when the same tithi appears on consecutive days
      if (t.astrodata.sunRise.tithi === prev.astrodata.sunRise.tithi) {
        t.vriddhiDayNo = 2;
      }
    }
  }
}
